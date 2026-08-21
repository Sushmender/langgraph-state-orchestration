"""
checkpointer/factory.py
-----------------------
Returns a persistent SqliteSaver backed by `backend/graph_state.db`.

Why SqliteSaver (not in-memory)?
- State survives server restarts — users can pick up a paused workflow
  even after the server is restarted.
- Multiple threads are stored in the same DB, enabling cross-thread
  time-travel and history browsing.
- Zero external dependencies (no Postgres, no Redis).

Thread safety:
- `check_same_thread=False` is required because FastAPI uses a threadpool
  and the same SQLite connection may be accessed from different threads.
- SqliteSaver wraps the connection with its own locking, so this is safe.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

from langgraph.checkpoint.sqlite import SqliteSaver

# Resolve DB path relative to this file: backend/database/graph_state.db
_DB_PATH = Path(__file__).resolve().parent.parent / "database" / "graph_state.db"


def get_checkpointer() -> SqliteSaver:
    """
    Returns a SqliteSaver instance pointing at `backend/graph_state.db`.
    The DB file is created automatically on first call.

    Call this once at app startup (in the FastAPI lifespan) and share the
    instance — do NOT create a new checkpointer per request.
    """
    conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    saver = SqliteSaver(conn=conn)
    return saver
