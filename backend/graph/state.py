"""
graph/state.py
--------------
Defines the AgentState TypedDict — the single source of truth for all data
that flows through the LangGraph essay-writing pipeline.
"""
from __future__ import annotations

import operator
from typing import Annotated, List, Optional, TypedDict


class AgentState(TypedDict):
    """
    The shared state object passed between every node in the graph.

    Fields
    ------
    task            : The original user-supplied essay topic.
    lnode           : Name of the last node that ran (for UI tracking).
    plan            : High-level essay outline produced by the planner node.
    draft           : The current essay draft produced by the generator node.
    critique        : Feedback on the draft produced by the reflector node.
    content         : Accumulated research snippets from Tavily searches.
    queries         : The search queries that were sent to Tavily.
    revision_number : How many drafts have been generated so far.
    max_revisions   : The cap on how many revisions to allow before stopping.
    force_end       : When True, all remaining nodes are no-ops and the graph
                      routes to END immediately — lets the user accept the
                      current draft without any further LLM cycles.
    count           : Monotonically increasing step counter (uses operator.add
                      so LangGraph reduces parallel updates by summing them).
    """
    task: str
    lnode: str
    plan: str
    draft: str
    critique: str
    content: List[str]
    queries: List[str]
    revision_number: int
    max_revisions: int
    force_end: Optional[bool]
    count: Annotated[int, operator.add]
