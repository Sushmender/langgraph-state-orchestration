# How This Project Works — Full Flow

## Big Picture

This is an **AI Essay Writer** with **Human-In-The-Loop (HITL)** control.
You give it a topic → it researches, plans, writes, reflects, revises — but it **pauses after every step** so you can inspect (and optionally edit) what it did before it continues.

---

## The 3 Layers

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND  (React + Vite, port 5173)                 │
│  Shows the graph, current state, lets you resume     │
└───────────────────┬──────────────────────────────────┘
                    │  HTTP (fetch)
┌───────────────────▼──────────────────────────────────┐
│  BACKEND  (FastAPI, port 8000)                       │
│  /api/workflow, /api/history, /api/graph             │
└───────────────────┬──────────────────────────────────┘
                    │  Python calls
┌───────────────────▼──────────────────────────────────┐
│  LANGGRAPH  (the actual AI pipeline)                 │
│  5 nodes, SQLite checkpointer, interrupt_after       │
└──────────────────────────────────────────────────────┘
```

---

## The Graph Pipeline (the real core)

```
[START]
   │
   ▼
[planner]          → LLM reads topic → produces an essay outline (plan)
   │
   ▼
[research_plan]    → LLM generates 3 search queries → Tavily fetches web content
   │
   ▼
[generate]         → LLM writes essay draft using plan + research
   │
   ▼ (should_continue?)
   ├── revision_number > max_revisions → [END]
   │
   ▼
[reflect]          → LLM critiques the draft
   │
   ▼
[research_critique] → LLM generates 2 new queries → Tavily fetches more content
   │
   └──────────────────────────────► back to [generate]
                                    (loop until max_revisions hit)
```

**The "interrupt_after" magic:** After every node finishes, the graph
automatically **pauses** and waits. It doesn't continue until the backend
calls `graph.invoke(None, thread_config)` again (the resume step).

---

## The Shared State — `AgentState`

This is the "memory" object that every node reads from and writes to:

| Field | Who writes it | Who reads it |
|---|---|---|
| `task` | You (on start) | planner, generate |
| `plan` | planner | generate |
| `content` | research_plan, research_critique | generate |
| `queries` | research_plan, research_critique | (UI display) |
| `draft` | generate | reflect, UI |
| `critique` | reflect | research_critique |
| `revision_number` | generate (+1 each time) | should_continue |
| `max_revisions` | You (on start) | should_continue |
| `lnode` | every node (tracks who ran last) | UI status |
| `count` | every node (+1) | UI step counter |

---

## The Backend API Endpoints

### `/api/workflow` — The HITL Core

| Endpoint | What it does |
|---|---|
| `POST /start` | Creates a new thread_id, runs graph until first pause, returns status |
| `POST /resume` | Calls `graph.invoke(None, config)` — tells graph "OK continue" |
| `GET /{id}/status` | Lightweight poll: what node ran last, what's next |
| `GET /{id}/state` | Full AgentState: see plan, draft, critique, everything |
| `PATCH /{id}/state` | **Edit any field mid-flight** — e.g. rewrite the plan before research starts |

### `/api/history` — Time Travel

| Endpoint | What it does |
|---|---|
| `GET /history/{id}` | Lists every checkpoint (state snapshot after each node) |
| `GET /history/{id}/snapshot/{cid}` | Inspect exact state at a past step |
| `POST /history/{id}/time-travel` | **Rewind** — copy old checkpoint as current state, then resume from there |
| `GET /threads` | List all active/past thread IDs from SQLite |
| `DELETE /threads/{id}` | Wipe a thread and its history |

### `/api/graph` — Metadata

| Endpoint | What it does |
|---|---|
| `GET /schema` | Returns node/edge info for the frontend to render the graph diagram |
| `GET /config` | Returns model name, default settings |

---

## A Full User Journey (step by step)

```
1. User types topic "AI in Agriculture" → clicks Start
         POST /api/workflow/start
         → backend: graph.invoke(initial_state, thread_config)
         → graph runs: planner node → produces plan → PAUSES
         → backend returns: { thread_id, status: "interrupted", last_node: "planner" }

2. Frontend shows: plan text, "Graph paused at planner. Click Continue."

3. User clicks Continue (or edits plan first)
         (Optional) PATCH /api/workflow/{id}/state  { key: "plan", value: "edited plan..." }
         POST /api/workflow/resume
         → graph continues: research_plan node → searches web → PAUSES
         → returns: { last_node: "research_plan" }

4. Frontend shows: search queries used, research snippets gathered

5. User clicks Continue
         POST /api/workflow/resume
         → graph: generate node → writes first draft → PAUSES

6. Frontend shows: the essay draft

7. ... cycle continues: reflect → research_critique → generate again ...

8. When revision_number > max_revisions:
         → graph hits END
         → status: "completed"
         → Frontend shows final essay
```

---

## The SQLite Checkpointer

Every time a node completes, LangGraph **saves the full AgentState to SQLite**.
This is what enables:
- **Pausing** — the state is stored, server can restart, state survives
- **History** — every node run is a separate row in the DB
- **Time Travel** — you can load any old row and make it the "current" state

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| [`graph/state.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/graph/state.py) | Defines `AgentState` — the shared memory |
| [`graph/nodes.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/graph/nodes.py) | The 5 node functions (where LLM calls happen) |
| [`graph/builder.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/graph/builder.py) | Wires nodes + edges together, compiles the graph |
| [`graph/prompts.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/graph/prompts.py) | All system prompts + node name constants |
| [`api/routes/workflow.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/api/routes/workflow.py) | start / resume / inspect / edit endpoints |
| [`api/routes/history.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/api/routes/history.py) | time-travel + thread management |
| [`main.py`](file:///c:/Users/susmi/OneDrive/Desktop/Human_in_loop/backend/main.py) | FastAPI app — loads .env, compiles graph on startup |
