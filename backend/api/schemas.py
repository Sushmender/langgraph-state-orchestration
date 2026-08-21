"""
api/schemas.py
--------------
All Pydantic request and response models for the backend API.

Keeping schemas in one file means:
- The frontend dev can look here to understand exactly what the API
  accepts and returns (auto-reflected in Swagger at /docs).
- Changes to the contract are visible in one diff.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from graph.prompts import ALL_NODES, DEFAULT_INTERRUPT_AFTER

# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class StartWorkflowRequest(BaseModel):
    """Body for POST /api/workflow/start"""
    task: str = Field(
        ...,
        description="The essay topic the agent will research and write about.",
        example="The impact of artificial intelligence on modern healthcare",
    )
    max_revisions: int = Field(
        default=2,
        ge=1,
        le=5,
        description="Maximum number of draft revisions before the workflow ends.",
    )
    interrupt_after: list[str] = Field(
        default=DEFAULT_INTERRUPT_AFTER,
        description=(
            "List of node names to pause at for human review. "
            f"Valid values: {ALL_NODES}. "
            "Pass an empty list [] to run fully autonomously."
        ),
    )


class ResumeWorkflowRequest(BaseModel):
    """Body for POST /api/workflow/resume"""
    thread_id: str = Field(
        ...,
        description="The thread ID of the paused workflow to resume.",
    )


class UpdateStateRequest(BaseModel):
    """Body for PATCH /api/workflow/{thread_id}/state — edit any state field mid-flight."""
    key: str = Field(
        ...,
        description="The AgentState field to update (e.g. 'plan', 'draft', 'critique').",
        example="plan",
    )
    value: Any = Field(
        ...,
        description="The new value for the field.",
    )
    as_node: str = Field(
        ...,
        description=(
            "Pretend the update was made by this node. This sets the graph's "
            "'next' pointer correctly. E.g. if you edited 'plan', pass 'planner'."
        ),
        example="planner",
    )


class TimeTravelRequest(BaseModel):
    """Body for POST /api/history/{thread_id}/time-travel"""
    checkpoint_id: str = Field(
        ...,
        description=(
            "The checkpoint_id (thread_ts) to travel back to. "
            "Obtain this from GET /api/history/{thread_id}."
        ),
    )
    state_overrides: dict[str, Any] | None = Field(
        default=None,
        description=(
            "Optional key/value pairs to override in the restored state. "
            "E.g. you can fork to an old checkpoint AND change the plan at the same time."
        ),
    )


# ═══════════════════════════════════════════════════════════════════════════════
# RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class WorkflowStatus(BaseModel):
    """Lightweight status returned after start / resume / status check."""
    thread_id: str
    last_node: str | None = Field(None, description="The node that ran most recently.")
    next_node: str | None = Field(None, description="The node that will run next (None = finished).")
    revision_number: int = Field(0, description="How many drafts have been generated.")
    step_count: int = Field(0, description="Total steps executed so far.")
    status: str = Field(
        ...,
        description="One of: 'running', 'interrupted', 'completed', 'error'.",
    )
    message: str | None = Field(None, description="Human-readable status message for the UI.")


class StateValues(BaseModel):
    """Full snapshot of AgentState values at a given point in time."""
    task: str | None = None
    lnode: str | None = None
    plan: str | None = None
    draft: str | None = None
    critique: str | None = None
    content: list[str] | None = None
    queries: list[str] | None = None
    revision_number: int | None = None
    max_revisions: int | None = None
    count: int | None = None


class StateSnapshot(BaseModel):
    """A single checkpoint entry in the state history."""
    checkpoint_id: str = Field(..., description="Unique ID for this checkpoint (thread_ts).")
    thread_id: str
    step: int = Field(..., description="Step index in the execution sequence.")
    last_node: str | None = None
    next_node: str | None = None
    revision_number: int = 0
    step_count: int = 0
    values: StateValues


class HistoryResponse(BaseModel):
    """Response for GET /api/history/{thread_id} — ordered list of snapshots."""
    thread_id: str
    total_snapshots: int
    snapshots: list[StateSnapshot]


class GraphNodeSchema(BaseModel):
    """Schema for a single graph node (for frontend visualisation)."""
    id: str
    label: str
    description: str
    hitl_note: str


class GraphEdgeSchema(BaseModel):
    """Schema for a single graph edge."""
    source: str = Field(..., alias="from")
    target: str = Field(..., alias="to")
    edge_type: str = Field(..., alias="type")
    condition: str | None = None

    class Config:
        populate_by_name = True


class GraphSchemaResponse(BaseModel):
    """Full graph topology returned by GET /api/graph/schema."""
    nodes: list[dict]
    edges: list[dict]
    entry_point: str
    all_nodes: list[str]
    default_interrupt_after: list[str]


class ThreadInfo(BaseModel):
    thread_id: str
    task: str | None = None


class ThreadListResponse(BaseModel):
    """Response for GET /api/threads."""
    threads: list[ThreadInfo]
    total: int


class ErrorResponse(BaseModel):
    """Standard error envelope."""
    error: str
    detail: str | None = None
