"""
api/routes/history.py
----------------------
Time-travel endpoints — demonstrates LangGraph's checkpoint history system.

Concept map:
  GET  /history/{id}                 → List all checkpoints (state snapshots)
  GET  /history/{id}/snapshot/{cid}  → Inspect a specific past snapshot
  POST /history/{id}/time-travel     → Fork: copy old state → new current state
  GET  /threads                      → List all thread IDs in the DB
  DELETE /threads/{id}               → Clear a thread (fresh start)

The time-travel pattern mirrors the reference agent's `copy_state()`:
  graph.get_state(old_config) → graph.update_state(current_thread, old_values, as_node=...)
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from api.schemas import (
    HistoryResponse,
    StateSnapshot,
    StateValues,
    ThreadListResponse,
    TimeTravelRequest,
    WorkflowStatus,
)

router = APIRouter(tags=["History & Time-Travel"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_graph(request: Request):
    return request.app.state.graph


def _make_thread_config(thread_id: str) -> dict:
    return {"configurable": {"thread_id": thread_id}}


def _state_to_snapshot(state, thread_id: str) -> StateSnapshot:
    """Convert a raw LangGraph StateSnapshot to our API StateSnapshot model."""
    config = state.config
    checkpoint_id = config["configurable"].get("checkpoint_id") or config["configurable"].get("thread_ts", "unknown")
    vals = state.values
    next_nodes = state.next
    return StateSnapshot(
        checkpoint_id=checkpoint_id,
        thread_id=thread_id,
        step=state.metadata.get("step", 0),
        last_node=vals.get("lnode"),
        next_node=next_nodes[0] if next_nodes else None,
        revision_number=vals.get("revision_number", 0),
        step_count=vals.get("count", 0),
        values=StateValues(
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
        ),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/history/{thread_id}",
    response_model=HistoryResponse,
    summary="Get state history for a thread",
    description=(
        "Returns all checkpoints (state snapshots) saved for this thread, ordered "
        "newest-first. Each snapshot includes a `checkpoint_id` you can use to "
        "time-travel back to that exact point. "
        "\n\n**LangGraph concept:** `graph.get_state_history(thread_config)` returns "
        "a generator of StateSnapshot objects — one per node execution."
    ),
)
def get_history(thread_id: str, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)

    snapshots = []
    try:
        for state in graph.get_state_history(thread_config):
            # Skip the initial empty state (step < 1)
            if state.metadata.get("step", 0) < 1:
                continue
            snapshots.append(_state_to_snapshot(state, thread_id))
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    return HistoryResponse(
        thread_id=thread_id,
        total_snapshots=len(snapshots),
        snapshots=snapshots,
    )


@router.get(
    "/history/{thread_id}/snapshot/{checkpoint_id}",
    response_model=StateSnapshot,
    summary="Inspect a specific historical snapshot",
    description=(
        "Fetches the exact AgentState values at a past checkpoint. "
        "Use this to understand what the graph 'looked like' at any step "
        "without actually changing the current state."
    ),
)
def get_snapshot(thread_id: str, checkpoint_id: str, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)

    try:
        for state in graph.get_state_history(thread_config):
            config = state.config
            cid = config["configurable"].get("checkpoint_id") or config["configurable"].get("thread_ts", "")
            if cid == checkpoint_id:
                return _state_to_snapshot(state, thread_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    raise HTTPException(status_code=404, detail=f"Checkpoint '{checkpoint_id}' not found.")


@router.post(
    "/history/{thread_id}/time-travel",
    response_model=WorkflowStatus,
    summary="Time-travel: fork from a past checkpoint",
    description=(
        "Copies a past checkpoint's state and makes it the *new current state* of "
        "the thread. After this, POST /workflow/resume will continue from that past point "
        "— effectively 'rewinding' the workflow.\n\n"
        "**Optional:** Pass `state_overrides` to modify values on top of the restored "
        "state — e.g. restore checkpoint 3 but with a different plan.\n\n"
        "**LangGraph concept:** This uses `graph.get_state(old_config)` + "
        "`graph.update_state(current_thread, old_values, as_node=lnode)`."
    ),
)
def time_travel(thread_id: str, body: TimeTravelRequest, request: Request):
    graph = _get_graph(request)
    thread_config = _make_thread_config(thread_id)

    # ── Find the target checkpoint ─────────────────────────────────────────
    target_config = None
    target_state = None
    try:
        for state in graph.get_state_history(thread_config):
            config = state.config
            cid = config["configurable"].get("checkpoint_id") or config["configurable"].get("thread_ts", "")
            if cid == body.checkpoint_id:
                target_config = config
                target_state = state
                break
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Thread not found: {e}")

    if not target_state:
        raise HTTPException(
            status_code=404,
            detail=f"Checkpoint '{body.checkpoint_id}' not found in thread '{thread_id}'.",
        )

    # ── Build the values to restore ────────────────────────────────────────
    restored_values = dict(target_state.values)

    # Apply any user-supplied overrides (e.g. change the plan while forking)
    if body.state_overrides:
        restored_values.update(body.state_overrides)

    # Determine as_node: use the checkpoint's lnode so the graph pointer is correct
    as_node = restored_values.get("lnode") or "planner"
    
    # HITL FIX: If the user provides a manual override, they are doing the job of
    # that node. We must advance the `as_node` pointer to match, otherwise the 
    # graph will run the AI node and immediately overwrite their manual edits!
    if body.state_overrides:
        if "critique" in body.state_overrides:
            as_node = "reflect"
        elif "plan" in body.state_overrides:
            as_node = "planner"

    try:
        graph.update_state(thread_config, restored_values, as_node=as_node)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Time travel failed: {e}")

    # ── Return new status ──────────────────────────────────────────────────
    new_state = graph.get_state(thread_config)
    vals = new_state.values
    next_nodes = new_state.next
    next_node = next_nodes[0] if next_nodes else None

    return WorkflowStatus(
        thread_id=thread_id,
        last_node=vals.get("lnode"),
        next_node=next_node,
        revision_number=vals.get("revision_number", 0),
        step_count=vals.get("count", 0),
        status="interrupted" if next_node else "completed",
        message=(
            f"✅ Time-traveled to checkpoint '{body.checkpoint_id}'. "
            f"State restored at node '{as_node}'. "
            f"POST /workflow/resume to continue from this point."
        ),
    )


# ── Thread Management ─────────────────────────────────────────────────────────

@router.get(
    "/threads",
    response_model=ThreadListResponse,
    summary="List all active thread IDs",
    description=(
        "Returns all thread IDs that exist in the SQLite checkpoint DB. "
        "Use this to switch between concurrent workflow runs."
    ),
)
def list_threads(request: Request):
    """
    Query the SQLite checkpoint DB directly for distinct thread IDs,
    then fetch the task for each from the graph state.
    """
    checkpointer = request.app.state.checkpointer
    graph = _get_graph(request)
    thread_infos = []

    try:
        # SqliteSaver stores checkpoints in a table — query it directly
        conn = checkpointer.conn
        cursor = conn.execute(
            "SELECT thread_id FROM checkpoints GROUP BY thread_id ORDER BY MIN(checkpoint_id) ASC"
        )
        thread_ids = [row[0] for row in cursor.fetchall()]
        
        for tid in thread_ids:
            task = None
            try:
                state = graph.get_state(_make_thread_config(tid))
                if state and hasattr(state, 'values') and hasattr(state.values, 'get') or state and isinstance(state.values, dict):
                    task = state.values.get("task")
            except Exception:
                pass
            thread_infos.append({"thread_id": tid, "task": task})
    except Exception:
        # Fallback: if the table doesn't exist yet, return empty list
        pass

    return ThreadListResponse(threads=thread_infos, total=len(thread_infos))


@router.delete(
    "/threads/{thread_id}",
    summary="Delete a thread and all its history",
    description=(
        "Permanently removes all checkpoints for a thread from the SQLite DB. "
        "Useful for clearing test runs or resetting a workflow."
    ),
)
def delete_thread(thread_id: str, request: Request):
    checkpointer = request.app.state.checkpointer
    try:
        conn = checkpointer.conn
        try:
            conn.execute("DELETE FROM checkpoint_blobs WHERE thread_id = ?", (thread_id,))
            conn.execute("DELETE FROM checkpoint_writes WHERE thread_id = ?", (thread_id,))
        except Exception:
            pass  # Older langgraph versions might not have these tables
        conn.execute("DELETE FROM checkpoints WHERE thread_id = ?", (thread_id,))
        conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete thread: {e}")

    return {"message": f"Thread '{thread_id}' and all its checkpoints have been deleted."}
