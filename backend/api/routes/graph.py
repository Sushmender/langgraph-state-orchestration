"""
api/routes/graph.py
--------------------
Graph introspection endpoints — gives the frontend everything it needs to
render a live, interactive graph visualisation without needing LangGraph
Studio.

Concept map:
  GET /graph/schema  → Full node/edge topology (for ReactFlow / D3 rendering)
  GET /graph/config  → Default settings (interrupt_after list, revision caps)
"""
from __future__ import annotations

from fastapi import APIRouter

from backend.graph.prompts import ALL_NODES, DEFAULT_INTERRUPT_AFTER, get_graph_schema

router = APIRouter(prefix="/graph", tags=["Graph Introspection"])


@router.get(
    "/schema",
    summary="Get graph topology",
    description=(
        "Returns the full node and edge structure of the essay-writing graph. "
        "Use this to render a live graph visualisation in the frontend "
        "(e.g. with ReactFlow or D3.js). Each node includes a `hitl_note` "
        "explaining what the user can inspect/edit at that pause point."
    ),
)
def graph_schema():
    return get_graph_schema()


@router.get(
    "/config",
    summary="Get graph default configuration",
    description=(
        "Returns default configuration values used when starting a workflow. "
        "The frontend can use this to pre-populate the 'start workflow' form."
    ),
)
def graph_config():
    return {
        "all_nodes": ALL_NODES,
        "default_interrupt_after": DEFAULT_INTERRUPT_AFTER,
        "default_max_revisions": 2,
        "max_revisions_cap": 5,
        "llm_model": "llama-3.3-70b-versatile",
        "llm_provider": "Groq",
        "search_provider": "Tavily",
        "description": (
            "The essay-writing pipeline runs: "
            "planner → research_plan → generate → reflect → research_critique → generate (loop). "
            "It stops when revision_number > max_revisions."
        ),
        "concept_explanations": {
            "hitl": (
                "Human-In-The-Loop: the graph pauses at interrupt_after nodes, "
                "giving you a chance to inspect state, edit fields, then resume."
            ),
            "time_travel": (
                "LangGraph saves a checkpoint after every node. You can list all "
                "checkpoints via GET /history/{thread_id} and fork back to any "
                "past state via POST /history/{thread_id}/time-travel."
            ),
            "state_modification": (
                "While paused, PATCH /workflow/{thread_id}/state lets you edit "
                "any field (plan, draft, critique, etc.) and the graph will use "
                "your modified values when it resumes."
            ),
            "multi_thread": (
                "Each workflow run gets its own thread_id. You can have many "
                "concurrent runs and switch between them via GET /threads."
            ),
        },
    }
