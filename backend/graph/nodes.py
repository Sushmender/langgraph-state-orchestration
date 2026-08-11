"""
graph/nodes.py
--------------
The five node functions that form the essay-writing pipeline, plus the
conditional edge function.  All LLM calls use Groq (llama-3.3-70b-versatile)
instead of OpenAI — keys already verified in api_check.py.

Each node returns a *partial* dict; LangGraph merges it into AgentState.
The `count` field uses operator.add so returning {"count": 1} increments.
"""
from __future__ import annotations

import os
from typing import List

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langgraph.graph import END
from tavily import TavilyClient

from graph.prompts import (
    PLAN_PROMPT,
    REFLECTION_PROMPT,
    RESEARCH_CRITIQUE_PROMPT,
    RESEARCH_PLAN_PROMPT,
    WRITER_PROMPT,
    NODE_PLANNER,
    NODE_RESEARCH_PLAN,
    NODE_GENERATE,
    NODE_REFLECT,
    NODE_RESEARCH_CRITIQUE,
)
from graph.state import AgentState


# ── Pydantic model for structured search query output ────────────────────────
class Queries(BaseModel):
    queries: List[str]


# ── Shared clients (initialised lazily per request to stay thread-safe) ───────
def _get_llm() -> ChatGroq:
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.environ["GROQ_API_KEY"],
    )


def _get_tavily() -> TavilyClient:
    return TavilyClient(api_key=os.environ["TAVILY_API_KEY"])


# ── Node 1: Planner ───────────────────────────────────────────────────────────
def plan_node(state: AgentState) -> dict:
    """
    Reads the task and produces a structured essay outline.
    HITL pause point: user can inspect/modify the plan before research begins.
    """
    llm = _get_llm()
    messages = [
        SystemMessage(content=PLAN_PROMPT),
        HumanMessage(content=state["task"]),
    ]
    response = llm.invoke(messages)
    return {
        "plan": response.content,
        "lnode": NODE_PLANNER,
        "count": 1,
    }


# ── Node 2: Research Plan ─────────────────────────────────────────────────────
def research_plan_node(state: AgentState) -> dict:
    """
    Generates search queries from the task, runs them through Tavily, and
    accumulates research snippets into state['content'].
    HITL pause point: user can see what research was gathered before drafting.
    """
    llm = _get_llm()
    tavily = _get_tavily()

    queries: Queries = llm.with_structured_output(Queries).invoke(
        [
            SystemMessage(content=RESEARCH_PLAN_PROMPT),
            HumanMessage(content=state["task"]),
        ]
    )

    content: List[str] = list(state.get("content") or [])
    for q in queries.queries:
        results = tavily.search(query=q, max_results=2)
        for r in results["results"]:
            content.append(r["content"])

    return {
        "content": content,
        "queries": queries.queries,
        "lnode": NODE_RESEARCH_PLAN,
        "count": 1,
    }


# ── Node 3: Generate ──────────────────────────────────────────────────────────
def generation_node(state: AgentState) -> dict:
    """
    Uses the outline + research content to write (or revise) the essay draft.
    HITL pause point: user can read the draft and decide whether to refine,
    continue, or manually edit it before the reflector sees it.
    """
    llm = _get_llm()
    content_text = "\n\n".join(state.get("content") or [])
    user_message = HumanMessage(
        content=f"{state['task']}\n\nHere is my plan:\n\n{state['plan']}"
    )
    messages = [
        SystemMessage(content=WRITER_PROMPT.format(content=content_text)),
        user_message,
    ]
    response = llm.invoke(messages)
    return {
        "draft": response.content,
        "revision_number": state.get("revision_number", 1) + 1,
        "lnode": NODE_GENERATE,
        "count": 1,
    }


# ── Node 4: Reflect ───────────────────────────────────────────────────────────
def reflection_node(state: AgentState) -> dict:
    """
    Grades the current draft and produces critique / improvement suggestions.
    HITL pause point: user can read the AI critique and optionally override it
    with their own feedback before the researcher acts on it.
    """
    llm = _get_llm()
    messages = [
        SystemMessage(content=REFLECTION_PROMPT),
        HumanMessage(content=state["draft"]),
    ]
    response = llm.invoke(messages)
    return {
        "critique": response.content,
        "lnode": NODE_REFLECT,
        "count": 1,
    }


# ── Node 5: Research Critique ─────────────────────────────────────────────────
def research_critique_node(state: AgentState) -> dict:
    """
    Takes the critique, generates targeted search queries, and fetches more
    research to support the revision.
    HITL pause point: user can see what new research was pulled before the
    next draft is written.
    """
    llm = _get_llm()
    tavily = _get_tavily()

    queries: Queries = llm.with_structured_output(Queries).invoke(
        [
            SystemMessage(content=RESEARCH_CRITIQUE_PROMPT),
            HumanMessage(content=state["critique"]),
        ]
    )

    content: List[str] = list(state.get("content") or [])
    for q in queries.queries:
        results = tavily.search(query=q, max_results=2)
        for r in results["results"]:
            content.append(r["content"])

    return {
        "content": content,
        "queries": queries.queries,
        "lnode": NODE_RESEARCH_CRITIQUE,
        "count": 1,
    }


# ── Conditional Edge ──────────────────────────────────────────────────────────
def should_continue(state: AgentState) -> str:
    """
    Routes from 'generate':
    - If we've hit the revision cap → END
    - Otherwise → 'reflect' for another critique cycle
    """
    if state["revision_number"] > state["max_revisions"]:
        return END
    return NODE_REFLECT
