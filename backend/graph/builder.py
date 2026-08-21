"""
graph/builder.py
----------------
Graph factory — the single place where the LangGraph StateGraph is assembled
and compiled.

Key design decision: `interrupt_after` is a *parameter*, not hardcoded.
This means the API can pass a custom list per workflow run, giving the user
full control over which nodes pause for human review.
"""
from __future__ import annotations

from typing import Any

from langgraph.graph import END, StateGraph

from graph.nodes import (
    generation_node,
    plan_node,
    reflection_node,
    research_critique_node,
    research_plan_node,
    should_continue,
)
from graph.prompts import (
    ALL_NODES,
    DEFAULT_INTERRUPT_AFTER,
    NODE_GENERATE,
    NODE_PLANNER,
    NODE_REFLECT,
    NODE_RESEARCH_CRITIQUE,
    NODE_RESEARCH_PLAN,
)
from graph.state import AgentState


def build_graph(
    checkpointer: Any,
    interrupt_after: list[str] | None = None,
):
    """
    Compile and return the essay-writing LangGraph.

    Parameters
    ----------
    checkpointer    : A LangGraph checkpoint saver (SqliteSaver).
    interrupt_after : List of node names to pause at.  Defaults to ALL_NODES
                      (pause after every single node).  Pass [] to run fully
                      autonomously with no HITL pauses.

    Graph topology
    --------------
    planner
      └─► research_plan
            └─► generate ──[should_continue]──► reflect
                    ▲                                └─► research_critique
                    └────────────────────────────────────────┘
                 (loop until revision_number > max_revisions → END)
    """
    if interrupt_after is None:
        interrupt_after = DEFAULT_INTERRUPT_AFTER

    builder = StateGraph(AgentState)

    # ── Register nodes ────────────────────────────────────────────────────────
    builder.add_node(NODE_PLANNER, plan_node)
    builder.add_node(NODE_RESEARCH_PLAN, research_plan_node)
    builder.add_node(NODE_GENERATE, generation_node)
    builder.add_node(NODE_REFLECT, reflection_node)
    builder.add_node(NODE_RESEARCH_CRITIQUE, research_critique_node)

    # ── Set entry point ───────────────────────────────────────────────────────
    builder.set_entry_point(NODE_PLANNER)

    # ── Fixed edges ───────────────────────────────────────────────────────────
    builder.add_edge(NODE_PLANNER, NODE_RESEARCH_PLAN)
    builder.add_edge(NODE_RESEARCH_PLAN, NODE_GENERATE)
    builder.add_edge(NODE_REFLECT, NODE_RESEARCH_CRITIQUE)
    builder.add_edge(NODE_RESEARCH_CRITIQUE, NODE_GENERATE)

    # ── Conditional edge from generate ───────────────────────────────────────
    builder.add_conditional_edges(
        NODE_GENERATE,
        should_continue,
        {END: END, NODE_REFLECT: NODE_REFLECT},
    )

    # ── Compile with checkpointer + dynamic interrupts ────────────────────────
    graph = builder.compile(
        checkpointer=checkpointer,
        interrupt_after=interrupt_after,
    )

    return graph


def get_graph_schema() -> dict:
    """
    Returns a serialisable description of the graph's topology for the
    frontend to render a node/edge visualisation without needing to run
    any LLM calls.
    """
    return {
        "nodes": [
            {
                "id": NODE_PLANNER,
                "label": "Planner",
                "description": "Creates a structured essay outline from the topic.",
                "hitl_note": "Pause here to review/modify the plan before research starts.",
            },
            {
                "id": NODE_RESEARCH_PLAN,
                "label": "Research Plan",
                "description": "Generates search queries and fetches research via Tavily.",
                "hitl_note": "Pause here to review what research was gathered.",
            },
            {
                "id": NODE_GENERATE,
                "label": "Generate",
                "description": "Writes or revises the essay draft using the plan + research.",
                "hitl_note": "Pause here to read the draft and optionally edit it.",
            },
            {
                "id": NODE_REFLECT,
                "label": "Reflect",
                "description": "Critiques the current draft and suggests improvements.",
                "hitl_note": "Pause here to review or override the AI critique.",
            },
            {
                "id": NODE_RESEARCH_CRITIQUE,
                "label": "Research Critique",
                "description": "Fetches more research based on the critique.",
                "hitl_note": "Pause here to see what new evidence was pulled in.",
            },
        ],
        "edges": [
            {"from": NODE_PLANNER, "to": NODE_RESEARCH_PLAN, "type": "fixed"},
            {"from": NODE_RESEARCH_PLAN, "to": NODE_GENERATE, "type": "fixed"},
            {"from": NODE_GENERATE, "to": NODE_REFLECT, "type": "conditional", "condition": "revision_number <= max_revisions"},
            {"from": NODE_GENERATE, "to": "__end__", "type": "conditional", "condition": "revision_number > max_revisions"},
            {"from": NODE_REFLECT, "to": NODE_RESEARCH_CRITIQUE, "type": "fixed"},
            {"from": NODE_RESEARCH_CRITIQUE, "to": NODE_GENERATE, "type": "fixed"},
        ],
        "entry_point": NODE_PLANNER,
        "all_nodes": ALL_NODES,
        "default_interrupt_after": DEFAULT_INTERRUPT_AFTER,
    }
