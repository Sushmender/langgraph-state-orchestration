"""
main.py
--------
FastAPI application entrypoint for the LangGraph HITL Explorer backend.

Startup sequence (lifespan):
  1. Load environment variables (.env)
  2. Initialise the persistent SQLite checkpointer (graph_state.db)
  3. Compile the LangGraph essay-writing graph with default interrupt_after
  4. Store both on app.state for all routes to share

Then mounts:
  /api/workflow   → HITL start/resume/status/state/modify
  /api/history    → history/snapshot/time-travel/threads
  /api/graph      → schema/config

CORS is open to localhost:3000 and localhost:5173 (Vite React dev server).

Swagger UI: http://localhost:8000/docs
ReDoc:      http://localhost:8000/redoc
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.workflow import router as workflow_router
from api.routes.history import router as history_router
from api.routes.graph import router as graph_router
from checkpointer.factory import get_checkpointer
from graph.builder import build_graph


# ── Load .env before anything else ───────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))


# ── Lifespan: initialise shared resources once at startup ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once when the server starts.  Initialises the checkpointer and graph
    and attaches them to app.state so every request handler can access them
    without re-creating them.
    """
    print("🚀  Starting LangGraph HITL Explorer backend...")

    # Validate required env vars
    groq_key = os.getenv("GROQ_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not groq_key:
        raise RuntimeError("GROQ_API_KEY is not set in .env")
    if not tavily_key:
        raise RuntimeError("TAVILY_API_KEY is not set in .env")

    # Initialise persistent checkpointer
    checkpointer = get_checkpointer()
    print("✅  Checkpointer initialised (graph_state.db)")

    # Compile graph (interrupt_after ALL nodes by default — user can override per run)
    graph = build_graph(checkpointer=checkpointer)
    print("✅  LangGraph compiled with default interrupt_after=ALL_NODES")

    # Store on app.state
    app.state.checkpointer = checkpointer
    app.state.graph = graph
    app.state.thread_interrupt_prefs = {}  # {thread_id: [node names]}

    print("✅  Backend ready. Swagger UI: http://localhost:8000/docs\n")

    yield  # ← app is running while we're here

    # Shutdown cleanup (close DB connection gracefully)
    print("🛑  Shutting down, closing SQLite connection...")
    checkpointer.conn.close()


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="LangGraph HITL Explorer",
    description=(
        "A production-grade backend for exploring LangGraph concepts interactively.\n\n"
        "## Core Concepts Exposed\n"
        "- **HITL (Human-In-The-Loop)**: Pause the graph at any node, inspect state, "
        "modify it, then resume.\n"
        "- **Time Travel**: Browse full state history, restore any past checkpoint, "
        "and fork the execution from there.\n"
        "- **State Inspection**: See every field of `AgentState` at any moment.\n"
        "- **State Modification**: Edit plan, draft, critique mid-flight via "
        "`graph.update_state`.\n"
        "- **Multi-Thread**: Run multiple independent workflows simultaneously.\n\n"
        "## Workflow\n"
        "1. `POST /api/workflow/start` — Start a new run, get a `thread_id`\n"
        "2. `GET /api/workflow/{thread_id}/status` — See where it paused\n"
        "3. `GET /api/workflow/{thread_id}/state` — Inspect all state values\n"
        "4. *(optional)* `PATCH /api/workflow/{thread_id}/state` — Edit a value\n"
        "5. `POST /api/workflow/resume` — Continue to the next interrupt\n"
        "6. `GET /api/history/{thread_id}` — Browse all checkpoints\n"
        "7. `POST /api/history/{thread_id}/time-travel` — Fork from any past checkpoint\n"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React (CRA)
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ─────────────────────────────────────────────────────────────
app.include_router(workflow_router, prefix="/api")
app.include_router(history_router, prefix="/api")
app.include_router(graph_router, prefix="/api")


# ── Root health check ─────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "service": "LangGraph HITL Explorer",
        "version": "1.0.0",
        "status": "running",
        "docs": "http://localhost:8000/docs",
        "graph_schema": "http://localhost:8000/api/graph/schema",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
