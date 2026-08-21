"""
graph/nodes.py
--------------
The five node functions that form the essay-writing pipeline, plus the
conditional edge function.  All LLM calls use Groq (qwen/qwen3.6-27b)
instead of OpenAI — keys already verified in api_check.py.

Each node returns a *partial* dict; LangGraph merges it into AgentState.
The `count` field uses operator.add so returning {"count": 1} increments.
"""
from __future__ import annotations

import json
import os
import re

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END
from tavily import TavilyClient

from graph.prompts import (
    NODE_GENERATE,
    NODE_PLANNER,
    NODE_REFLECT,
    NODE_RESEARCH_CRITIQUE,
    NODE_RESEARCH_PLAN,
    PLAN_PROMPT,
    REFLECTION_PROMPT,
    RESEARCH_CRITIQUE_PROMPT,
    RESEARCH_PLAN_PROMPT,
    WRITER_PROMPT,
)
from graph.state import AgentState


# ── Helper: strip Qwen's <think>...</think> reasoning traces ────────────────
def _strip_thinking(text: str) -> str:
    """
    Qwen3 wraps chain-of-thought in <think>...</think> before the answer.
    We strip that block so only the clean answer is stored in AgentState.

    Handles three cases:
      1. Proper <think>...</think>  → take everything AFTER </think>
      2. <think> with no closing tag → strip the opening tag, return remainder
      3. No tags at all          → return as-is
    """
    if '</think>' in text:
        return text.split('</think>', 1)[1].strip()
    # Opening tag present but no closing — strip the tag and return the rest
    cleaned = re.sub(r'<\s*think[^>]*>', '', text, flags=re.IGNORECASE)
    return cleaned.strip()


# ── Helper: parse search queries from LLM plain-text response ───────────────
def _parse_queries(raw: str) -> list[str]:
    """
    Strip thinking traces first, then try JSON, then numbered/bulleted list,
    then newline-split as a last resort.
    Returns a list of query strings.
    """
    text = _strip_thinking(raw)

    # 1. JSON extraction — handles both bare JSON and markdown-fenced blocks
    #    Use a greedy match so we capture the full array even with newlines.
    json_match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if json_match:
        try:
            data = json.loads(json_match.group())
            queries = data.get("queries") or data.get("search_queries") or []
            if isinstance(queries, list) and queries:
                # Filter out any placeholders like "query 1", "search term 1", etc.
                real = [
                    str(q).strip() for q in queries
                    if str(q).strip() and not re.match(
                        r'^(query|search[_ ]?(query|term|string)?)[\s_]?\d*$',
                        str(q).strip(), re.IGNORECASE
                    )
                ]
                if real:
                    return real
        except (json.JSONDecodeError, KeyError):
            pass

    # 2. Numbered / bulleted list fallback  (e.g. '1. "AI in agriculture"')
    queries = re.findall(
        r'(?:^|\n)\s*(?:\d+[.)\-]|-|\*)\s*["\u201c\u201d]?([^"\'\n\u201c\u201d]{10,})["\u201c\u201d]?',
        text,
    )
    if queries:
        return [q.strip().strip('"\u201c\u201d\' ') for q in queries if q.strip()]

    # 3. Last resort: non-empty lines
    return [ln.strip().strip('"\' ') for ln in text.splitlines() if len(ln.strip()) > 5]


# ── Shared clients (initialised lazily per request to stay thread-safe) ───────────
def _get_llm() -> ChatGroq:
    return ChatGroq(
        model="qwen/qwen3.6-27b",
        temperature=0,
        api_key=os.environ["GROQ_API_KEY"],
        # Disable Qwen's extended thinking mode so responses contain
        # only the final answer — no <think>...</think> traces.
        reasoning_effort="none",
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
        "plan": _strip_thinking(response.content),
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

    response = llm.invoke(
        [
            SystemMessage(content=RESEARCH_PLAN_PROMPT),
            HumanMessage(
                content=(
                    f"{state['task']}\n\n"
                    "Output a JSON object with a single key 'queries' whose value is "
                    "a JSON array of real search engine query strings relevant to the topic above. "
                    "Do NOT include placeholder text. Output raw JSON only, no markdown fences."
                )
            ),
        ]
    )
    query_list = _parse_queries(response.content)

    content: list[str] = list(state.get("content") or [])
    for q in query_list:
        results = tavily.search(query=q, max_results=2)
        for r in results["results"]:
            content.append(r["content"])

    return {
        "content": content,
        "queries": query_list,
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

    # Build the user message — always include task + plan; append critique when
    # present so the writer treats it as a hard revision brief.
    user_content = f"{state['task']}\n\nHere is my plan:\n\n{state['plan']}"
    critique = state.get("critique", "").strip()
    if critique:
        user_content += f"\n\nCRITIQUE TO ADDRESS:\n{critique}"

    user_message = HumanMessage(content=user_content)
    messages = [
        SystemMessage(content=WRITER_PROMPT.format(content=content_text)),
        user_message,
    ]
    response = llm.invoke(messages)
    return {
        "draft": _strip_thinking(response.content),
        "revision_number": state.get("revision_number", 1) + 1,
        "lnode": NODE_GENERATE,
        "count": 1,
    }


# ── Node 4: Reflect ────────────────────────────────────────────────────────────────────────────────
def reflection_node(state: AgentState) -> dict:
    """
    Grades the current draft and produces critique / improvement suggestions.
    HITL pause point: user can read the AI critique and optionally override it
    with their own feedback before the researcher acts on it.
    If force_end is set, this is a no-op (skips LLM call entirely).
    """
    # ── Fast-path: user accepted the current draft, skip all further LLM work ──
    if state.get("force_end"):
        return {"critique": "", "lnode": NODE_REFLECT, "count": 1}

    llm = _get_llm()
    messages = [
        SystemMessage(content=REFLECTION_PROMPT),
        HumanMessage(content=state["draft"]),
    ]
    response = llm.invoke(messages)
    return {
        "critique": _strip_thinking(response.content),
        "lnode": NODE_REFLECT,
        "count": 1,
    }


# ── Node 5: Research Critique ─────────────────────────────────────────────────────────────────────────────
def research_critique_node(state: AgentState) -> dict:
    """
    Takes the critique, generates targeted search queries, and fetches more
    research to support the revision.
    HITL pause point: user can see what new research was pulled before the
    next draft is written.
    If force_end is set, this is a no-op (skips LLM + Tavily calls entirely).
    """
    # ── Fast-path: user accepted the current draft, skip all further LLM work ──
    if state.get("force_end"):
        return {"lnode": NODE_RESEARCH_CRITIQUE, "count": 1}

    llm = _get_llm()
    tavily = _get_tavily()

    response = llm.invoke(
        [
            SystemMessage(content=RESEARCH_CRITIQUE_PROMPT),
            HumanMessage(
                content=(
                    f"{state['critique']}\n\n"
                    "Output a JSON object with a single key 'queries' whose value is "
                    "a JSON array of real search engine query strings that would find "
                    "information to address the critique above. "
                    "Do NOT include placeholder text. Output raw JSON only, no markdown fences."
                )
            ),
        ]
    )
    query_list = _parse_queries(response.content)

    content: list[str] = list(state.get("content") or [])
    for q in query_list:
        results = tavily.search(query=q, max_results=2)
        for r in results["results"]:
            content.append(r["content"])

    return {
        "content": content,
        "queries": query_list,
        "lnode": NODE_RESEARCH_CRITIQUE,
        "count": 1,
    }


# ── Conditional Edge ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
def should_continue(state: AgentState) -> str:
    """
    Routes from 'generate':
    - If force_end is True (user accepted the draft mid-run) → END immediately
    - If we've hit the revision cap → END
    - Otherwise → 'reflect' for another critique cycle
    """
    if state.get("force_end") or state["revision_number"] > state["max_revisions"]:
        return END
    return NODE_REFLECT
