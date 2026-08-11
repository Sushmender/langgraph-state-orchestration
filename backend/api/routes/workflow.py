"""
api/routes/workflow.py
----------------------
Core HITL endpoints — the heart of the system.

Concept map (what each endpoint demonstrates):
  POST /start      → How LangGraph threads and first-run interrupts work
  POST /resume     → The HITL "continue" — resuming from an interrupt
  GET  /{id}/status → Polling the graph state machine (lnode / nnode)
  GET  /{id}/state  → Full state inspection — see every field at once
  PATCH/{id}/state  → State modification — edit plan/draft/critique mid-flight
                       (uses graph.update_state with as_node)
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request

from api.schemas import (
    StartWorkflowRequest,
    ResumeWorkflowRequest,
    UpdateStateRequest,
    WorkflowStatus,
    StateValues,
)
from backend.graph.prompts import ALL_NODES, DEFAULT_INTERRUPT_AFTER

router = APIRouter(prefix="/workflow", tags=["Workflow — HITL"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_graph(request: Request):
    """Pull the compiled graph from app state (set in main.py lifespan)."""
    return request.app.state.graph


def _make_thread_config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


def _build_status(thread_id: str, graph, thread_config: dict) -> WorkflowStatus:
    """
    Read the current LangGraph state for a thread and convert it to a
    WorkflowStatus response the frontend can interpret.
    """
    try:
        state = graph.get_state(thread_config)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    if not state or not state.metadata:
        raise HTTPException(status_code=404, detail="Thread has no state yet.")

    vals = state.values
    last_node = vals.get("lnode")
    next_nodes = state.next  # tuple of upcoming nodes
    next_node = next_nodes[0] if next_nodes else None

    if next_node is None:
        status = "completed"
        message = f"Workflow completed after {vals.get('revision_number', 0)} revision(s)."
    else:
        status = "interrupted"
        message = (
            f"Paused after '{last_node}'. "
            f"Next node: '{next_node}'. "
            f"You can inspect/modify state, then POST /resume to continue."
        )

    return WorkflowStatus(
        thread_id=thread_id,
        last_node=last_node,
        next_node=next_node,
        revision_number=vals.get("revision_number", 0),
        step_count=vals.get("count", 0),
        status=status,
        message=message,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/start",
    response_model=WorkflowStatus,
    summary="Start a new workflow",
    description=(
        "Creates a new LangGraph thread and runs the graph until the first "
        "interrupt point. Returns the thread_id and current status. "
        "Save the thread_id — you'll need it to resume, inspect, and time-travel."
    ),
)
def start_workflow(body: StartWorkflowRequest, request: Request):
    graph = _get_graph(request)

    # ── Generate a unique thread ID for this run ───────────────────────────
    thread_id = str(uuid.uuid4())
    thread_config = _make_thread_config(thread_id)

    # ── Build the initial state dict ───────────────────────────────────────
    initial_state = {
        "task": body.task,
        "max_revisions": body.max_revisions,
        "revision_number": 0,
        "lnode": "",
        "plan": "",
        "draft": "",
        "critique": "",
        "content": [],
        "queries": [],
        "count": 0,
    }

    # ── Store which nodes to interrupt on (used by the graph compiled at startup) ─
    # Note: interrupt_after is baked in at compile-time. The user's preference
    # is stored in app.state so the resume endpoint can check it.
    # For a fully dynamic system (future), we'd recompile per request.
    # For now we store user's preference as metadata for UI display.
    request.app.state.thread_interrupt_prefs[thread_id] = body.interrupt_after

    try:
        # invoke with None config to let graph run until first interrupt
        graph.invoke(initial_state, thread_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph execution error: {e}")

    return _build_status(thread_id, graph, thread_config)


@router.post(
    "/resume",
    response_model=WorkflowStatus,
    summary="Resume a paused workflow (HITL continue)",
    description=(
        "Resumes a thread that is currently paused at an interrupt point. "
        "Calling this is the HITL 'I've reviewed it, continue' action. "
        "Optionally, call PATCH /{thread_id}/state first to modify state before resuming."
    ),
)
def resume_workflow(body: ResumeWorkflowRequest, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(body.thread_id)

    # Verify thread exists and is actually paused
    try:
        current = graph.get_state(thread_config)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    if not current or not current.next:
        raise HTTPException(
            status_code=400,
            detail="This workflow has already completed. Start a new one.",
        )

    try:
        # Pass None as input to resume from the current checkpoint
        graph.invoke(None, thread_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Graph execution error: {e}")

    return _build_status(body.thread_id, graph, thread_config)


@router.get(
    "/{thread_id}/status",
    response_model=WorkflowStatus,
    summary="Get workflow status",
    description=(
        "Lightweight poll endpoint. Returns the last node, next node, revision count, "
        "and a human-readable status message. Use this to update the UI without "
        "fetching the full state."
    ),
)
def get_status(thread_id: str, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)
    return _build_status(thread_id, graph, thread_config)


@router.get(
    "/{thread_id}/state",
    response_model=StateValues,
    summary="Get full workflow state",
    description=(
        "Returns all AgentState field values for the current checkpoint. "
        "This lets the user inspect the plan, draft, critique, research content, "
        "and all other fields at any pause point."
    ),
)
def get_full_state(thread_id: str, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)

    try:
        state = graph.get_state(thread_config)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    if not state or not state.metadata:
        raise HTTPException(status_code=404, detail="Thread has no state yet.")

    vals = state.values
    return StateValues(
        task=vals.get("task"),
        lnode=vals.get("lnode"),
        plan=vals.get("plan"),
        draft=vals.get("draft"),
        critique=vals.get("critique"),
        content=vals.get("content"),
        queries=vals.get("queries"),
        revision_number=vals.get("revision_number"),
        max_revisions=vals.get("max_revisions"),
        count=vals.get("count"),
    )


@router.patch(
    "/{thread_id}/state",
    response_model=WorkflowStatus,
    summary="Modify state mid-flight (HITL edit)",
    description=(
        "The most powerful HITL operation: modify any AgentState field while "
        "the workflow is paused. Changes take effect on the next resume. "
        "\n\n"
        "**How it works:** calls `graph.update_state(thread, {key: value}, as_node=as_node)`. "
        "The `as_node` parameter tells LangGraph which node 'made' the change, "
        "so the graph's internal pointer stays consistent.\n\n"
        "**Example use cases:**\n"
        "- Edit the plan before research starts (as_node='planner')\n"
        "- Override the draft directly (as_node='generate')\n"
        "- Replace the AI critique with your own (as_node='reflect')"
    ),
)
def update_state(thread_id: str, body: UpdateStateRequest, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)

    try:
        current = graph.get_state(thread_config)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    if not current or not current.metadata:
        raise HTTPException(status_code=404, detail="Thread has no state yet.")

    # Build updated values dict
    updated_values = dict(current.values)
    updated_values[body.key] = body.value

    try:
        graph.update_state(thread_config, updated_values, as_node=body.as_node)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"State update failed: {e}")

    return _build_status(thread_id, graph, thread_config)


@router.get(
    "/interrupt-options",
    summary="List valid interrupt_after node names",
    description="Returns the list of node names that can be used in interrupt_after.",
)
def get_interrupt_options(request: Request):
    return {
        "all_nodes": ALL_NODES,
        "default_interrupt_after": DEFAULT_INTERRUPT_AFTER,
        "description": "Pass any subset of all_nodes in interrupt_after when starting a workflow.",
    }
