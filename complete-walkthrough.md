# LangGraph HITL Explorer — Complete End-to-End Walkthrough

> **A complete guide** to setting up, running, and exploring every feature of the LangGraph Human-In-The-Loop Explorer — from first boot to time-traveling through checkpoints.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Prerequisites](#3-prerequisites)
4. [Backend Setup & Launch](#4-backend-setup--launch)
5. [Frontend Setup & Launch](#5-frontend-setup--launch)
6. [The Pipeline — How It Works](#6-the-pipeline--how-it-works)
7. [Feature 1 — Starting a Workflow (HITL)](#7-feature-1--starting-a-workflow-hitl)
8. [Feature 2 — Inspecting State](#8-feature-2--inspecting-state)
9. [Feature 3 — Editing State Mid-Flight](#9-feature-3--editing-state-mid-flight)
10. [Feature 4 — Resuming the Workflow](#10-feature-4--resuming-the-workflow)
11. [Feature 5 — History & Checkpoints](#11-feature-5--history--checkpoints)
12. [Feature 6 — Time Travel (Fork from Past State)](#12-feature-6--time-travel-fork-from-past-state)
13. [Feature 7 — Multi-Thread Workflows](#13-feature-7--multi-thread-workflows)
14. [Feature 8 — Fully Autonomous Run](#14-feature-8--fully-autonomous-run)
15. [Complete API Reference with Sample Q&A](#15-complete-api-reference-with-sample-qa)
16. [Exploring via Swagger UI](#16-exploring-via-swagger-ui)
17. [Exploring via the React Frontend](#17-exploring-via-the-react-frontend)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Project Overview

The **LangGraph HITL Explorer** is a full-stack application that demonstrates four core LangGraph concepts interactively:

| Concept | Description |
|---|---|
| **Human-In-The-Loop (HITL)** | The AI graph pauses after each node, letting you inspect and modify state before the agent continues |
| **Time Travel** | Every node execution is checkpointed. You can browse history and restore ("fork") from any past state |
| **State Modification** | While paused, edit any field (`plan`, `draft`, `critique`) mid-flight; the agent uses your edits on resume |
| **Multi-Thread** | Run many independent workflow "threads" simultaneously and switch between them |

**The AI pipeline** writes a 3-paragraph essay on any topic you give it:

```
planner → research_plan → generate ──[done?]──► END
                              ▲                    │ no
                              │                    ▼
                          research_critique ◄── reflect
```

**Tech Stack:**
- **Backend:** FastAPI + LangGraph + LangChain-Groq (llama-3.3-70b-versatile) + Tavily Search + SQLite
- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS v3 + ReactFlow + Zustand + Framer Motion

---

## 2. Repository Structure

```
Human_in_loop/
├── backend/
│   ├── .env                    ← API keys (create this yourself)
│   ├── .venv/                  ← Python virtual environment
│   ├── main.py                 ← FastAPI entrypoint
│   ├── requirements.txt
│   ├── api_check.py            ← Key validation script
│   ├── backend-instructions.md
│   ├── api/
│   │   ├── schemas.py          ← All Pydantic request/response models
│   │   └── routes/
│   │       ├── workflow.py     ← HITL endpoints
│   │       ├── history.py      ← Time-travel endpoints
│   │       └── graph.py        ← Schema introspection
│   ├── graph/
│   │   ├── state.py            ← AgentState TypedDict
│   │   ├── nodes.py            ← 5 LangGraph node functions
│   │   ├── builder.py          ← Graph factory (interrupt_after config)
│   │   └── prompts.py          ← LLM prompt strings + graph metadata
│   ├── checkpointer/           ← SQLite persistence factory
│   └── database/               ← graph_state.db (auto-created)
├── frontend/
│   ├── src/
│   │   ├── types/api.ts        ← TypeScript interfaces (mirrors backend schemas)
│   │   ├── api/                ← Typed axios wrappers for all endpoints
│   │   ├── stores/             ← Zustand global state
│   │   ├── hooks/              ← useWorkflow (2s polling, all operations)
│   │   ├── components/
│   │   │   ├── layout/         ← Header, Sidebar
│   │   │   ├── workflow/       ← StartWorkflowForm, StatusBanner, NodePipeline
│   │   │   ├── graph/          ← GraphVisualizer (ReactFlow), GraphNode
│   │   │   ├── state/          ← StatePanel (5 tabs), StateEditModal
│   │   │   └── history/        ← HistoryTimeline, TimeTravelModal
│   │   └── pages/              ← LandingPage, WorkspacePage
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── sample_responses/           ← Real JSON snapshots of completed runs
├── docs/                       ← Reference agent implementation
└── tasks.md                    ← 3-day sprint checklist
```

---

## 3. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.10+ | For the backend |
| Node.js | 18+ | For the frontend |
| npm | 9+ | Comes with Node.js |
| Groq API Key | — | Free at [console.groq.com](https://console.groq.com) |
| Tavily API Key | — | Free tier at [tavily.com](https://tavily.com) |

---

## 4. Backend Setup & Launch

### Step 1 — Navigate to backend

```powershell
cd backend
```

### Step 2 — Create Python virtual environment

```powershell
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` in your prompt after activation.

### Step 3 — Install dependencies

```powershell
pip install -r requirements.txt
```

This installs: `fastapi`, `uvicorn`, `langgraph`, `langchain-groq`, `langchain-community`, `tavily-python`, `python-dotenv`, `pydantic`.

### Step 4 — Create the `.env` file

Create `backend/.env` (this file already exists if you followed setup):

```env
GROQ_API_KEY=gsk_your_key_here
TAVILY_API_KEY=tvly_your_key_here
```

> ⚠️ Never commit `.env` to git. It is listed in `.gitignore`.

### Step 5 — (Optional) Validate API keys

```powershell
python api_check.py
```

Expected output:
```
✅ GROQ_API_KEY found: gsk_...
✅ Groq connection successful. Model: llama-3.3-70b-versatile
✅ TAVILY_API_KEY found: tvly_...
✅ Tavily search successful. Got results.
```

### Step 6 — Start the server

```powershell
uvicorn main:app --reload
```

The server starts at **http://localhost:8000**.

Available URLs:
| URL | Purpose |
|---|---|
| http://localhost:8000/ | Root health check |
| http://localhost:8000/health | Simple `{"status":"ok"}` |
| http://localhost:8000/docs | **Swagger UI** (interactive) |
| http://localhost:8000/redoc | ReDoc documentation |

---

## 5. Frontend Setup & Launch

Open a **second terminal** (keep the backend running):

```powershell
cd frontend
npm install        # only needed on first run
npm run dev
```

The frontend starts at **http://localhost:5173**.

> The Vite dev server proxies all `/api/*` and `/health` requests to the backend at `localhost:8000`, so no CORS issues.

---

## 6. The Pipeline — How It Works

The essay-writing pipeline has **5 nodes** and runs in this order:

```
┌──────────┐    ┌───────────────┐    ┌──────────┐
│  Planner │───►│ Research Plan │───►│ Generate │
└──────────┘    └───────────────┘    └──────────┘
    🗺️              🔍                    ✍️
                                          │
                          ┌───────────────┘
                          │ revision_number > max_revisions?
                          ├── YES ──► END ✅
                          └── NO  ──► Reflect
                                          │
                                    ┌─────▼──────────────┐    ┌──────────┐
                                    │      Reflect        │───►│Research  │
                                    │   (Critique)        │    │Critique  │
                                    └─────────────────────┘    └──┬───────┘
                                          🪞                       │
                                                                   └──► Generate (loop)
                                                                        🔬
```

**AgentState fields** (what flows between nodes):

| Field | Type | Set by |
|---|---|---|
| `task` | `str` | User on start |
| `plan` | `str` | Planner node |
| `content` | `List[str]` | Research Plan + Research Critique nodes |
| `queries` | `List[str]` | Research Plan + Research Critique nodes |
| `draft` | `str` | Generate node |
| `critique` | `str` | Reflect node |
| `revision_number` | `int` | Generate node (increments each draft) |
| `max_revisions` | `int` | User on start (1–5, default 2) |
| `lnode` | `str` | Every node (tracks "last node ran") |
| `count` | `int` | Every node (monotonically increases) |

---

## 7. Feature 1 — Starting a Workflow (HITL)

### Via the UI

1. Go to **http://localhost:5173**
2. Click **"Start New Workflow"**
3. Enter a topic, e.g.: `The impact of artificial intelligence on modern healthcare`
4. (Optional) Expand **Advanced Settings** to change `max_revisions` or which nodes to pause at
5. Click **Start Workflow**

The workflow runs until the first interrupt (default: after `planner`), then pauses.

### Via API

```bash
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "The impact of artificial intelligence on modern healthcare",
    "max_revisions": 2,
    "interrupt_after": ["planner", "research_plan", "generate", "reflect", "research_critique"]
  }'
```

**Expected Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "Paused after 'planner'. Next node: 'research_plan'. You can inspect/modify state, then POST /resume to continue."
}
```

> 💡 **Save the `thread_id`** — you'll need it for every subsequent request in this session.

### What `interrupt_after` does

```json
// Pause after ALL nodes (default — maximum human control)
"interrupt_after": ["planner", "research_plan", "generate", "reflect", "research_critique"]

// Pause only after planner and generate (review plan and draft only)
"interrupt_after": ["planner", "generate"]

// Never pause — fully autonomous run
"interrupt_after": []
```

---

## 8. Feature 2 — Inspecting State

### Lightweight status check

```bash
curl http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/status
```

**Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "Paused after 'planner'. Next node: 'research_plan'."
}
```

### Full state inspection

```bash
curl http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state
```

**Response (after planner runs):**
```json
{
  "task": "The impact of artificial intelligence on modern healthcare",
  "lnode": "planner",
  "plan": "I. Introduction: The Rise of AI in Healthcare\n   - Brief overview of AI's emergence in the medical field\n   - Thesis statement: AI is transforming healthcare...\n\nII. Main Body: AI Applications and Impact\n   - Diagnostic AI: image analysis, early detection...\n   - Operational AI: administrative automation...\n\nIII. Conclusion: Future and Challenges\n   - Benefits vs. risks (bias, privacy, ethics)...",
  "draft": "",
  "critique": "",
  "content": [],
  "queries": [],
  "revision_number": 0,
  "max_revisions": 2,
  "count": 1
}
```

### In the UI

Switch to the **Plan** tab in the State Panel (center column). You'll see the full AI-generated outline rendered as markdown.

---

## 9. Feature 3 — Editing State Mid-Flight

This is the core HITL "human intervention" action. While the workflow is paused, you can overwrite any state field before resuming.

### Example A — Override the plan

```bash
curl -X PATCH http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state \
  -H "Content-Type: application/json" \
  -d '{
    "key": "plan",
    "value": "Focus entirely on AI in medical diagnostics and imaging. Skip the introduction. Three sections: 1) Computer Vision in Radiology, 2) Predictive Analytics for Patient Outcomes, 3) Ethical Challenges.",
    "as_node": "planner"
  }'
```

**Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "status": "interrupted",
  "message": "Paused after 'planner'. Next node: 'research_plan'."
}
```

### Example B — Override the draft (after generate runs)

```bash
curl -X PATCH http://localhost:8000/api/workflow/<THREAD_ID>/state \
  -H "Content-Type: application/json" \
  -d '{
    "key": "draft",
    "value": "AI is revolutionizing healthcare by improving diagnostics...\n\n[Your manually edited draft here]\n\nIn conclusion, responsible AI adoption requires robust governance.",
    "as_node": "generate"
  }'
```

### Example C — Override the critique (after reflect runs)

```bash
curl -X PATCH http://localhost:8000/api/workflow/<THREAD_ID>/state \
  -H "Content-Type: application/json" \
  -d '{
    "key": "critique",
    "value": "The draft is too generic. Please add 3 specific real-world examples: IBM Watson, Google DeepMind, and Mayo Clinic AI programs. Also expand the ethics section by 2 paragraphs.",
    "as_node": "reflect"
  }'
```

> 🔑 **The `as_node` parameter** tells LangGraph which node "made" this change, keeping the internal graph pointer consistent. Always match:
> - `plan` → `as_node: "planner"`
> - `draft` → `as_node: "generate"`
> - `critique` → `as_node: "reflect"`

### In the UI

1. When the workflow is **Paused**, hover over any content in the State Panel tabs
2. Click the **Edit** button (top-right of the content)
3. Modify the text in the modal textarea
4. Click **Save Changes**

---

## 10. Feature 4 — Resuming the Workflow

After inspecting or editing state, tell the graph to continue to the next interrupt.

```bash
curl -X POST http://localhost:8000/api/workflow/resume \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8"}'
```

**Response (after research_plan runs):**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "research_plan",
  "next_node": "generate",
  "revision_number": 0,
  "step_count": 2,
  "status": "interrupted",
  "message": "Paused after 'research_plan'. Next node: 'generate'."
}
```

Now check state again to see the research content that was fetched:

```bash
curl http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state
```

You'll see `queries` (search terms) and `content` (web snippets from Tavily) are now populated.

**Keep resuming** to walk through the full pipeline:

| Resume # | Runs | `last_node` after | What you can inspect |
|---|---|---|---|
| 1 | `planner` | `planner` | `plan` (essay outline) |
| 2 | `research_plan` | `research_plan` | `queries`, `content` (Tavily results) |
| 3 | `generate` | `generate` | `draft` (first essay draft) |
| 4 | `reflect` | `reflect` | `critique` (AI critique of draft) |
| 5 | `research_critique` | `research_critique` | `content` (additional research), `queries` |
| 6 | `generate` (rev 2) | `generate` | `draft` (revised essay) |
| 7+ | … | … | … until `revision_number > max_revisions` → END |

### In the UI

Click the **Resume** button in the amber status banner. The UI will show a sliding progress bar while the LLM runs (10–30 seconds).

---

## 11. Feature 5 — History & Checkpoints

LangGraph saves a checkpoint after **every node execution**. You can browse the full history.

### List all checkpoints

```bash
curl http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```

**Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "total_snapshots": 3,
  "snapshots": [
    {
      "checkpoint_id": "1ef9b241-4aa3-6d20-8003-47b0a36b3891",
      "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
      "step": 3,
      "last_node": "generate",
      "next_node": "reflect",
      "revision_number": 1,
      "step_count": 3,
      "values": { "task": "...", "plan": "...", "draft": "...", ... }
    },
    {
      "checkpoint_id": "1ef9b241-3cc1-6ecc-8002-47b0a36b3891",
      "step": 2,
      "last_node": "research_plan",
      "next_node": "generate",
      "revision_number": 0,
      "step_count": 2,
      "values": { "task": "...", "plan": "...", "content": [...], ... }
    },
    {
      "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891",
      "step": 1,
      "last_node": "planner",
      "next_node": "research_plan",
      "revision_number": 0,
      "step_count": 1,
      "values": { "task": "...", "plan": "...", "draft": "", ... }
    }
  ]
}
```

### Inspect a specific past snapshot

```bash
curl http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/snapshot/1ef9b241-2f85-6b1a-8001-47b0a36b3891
```

This returns the **exact `AgentState`** as it was at checkpoint step 1 (just after the planner ran) — without modifying the current state.

### List all threads in the database

```bash
curl http://localhost:8000/api/threads
```

**Response:**
```json
{
  "threads": [
    "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
    "a123b456-7890-1234-5678-abcdef123456"
  ],
  "total": 2
}
```

### Delete a thread

```bash
curl -X DELETE http://localhost:8000/api/threads/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```

**Response:**
```json
{
  "message": "Thread '3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8' and all its checkpoints have been deleted."
}
```

### In the UI

The **right panel** shows a vertical timeline of all checkpoints, newest-first. Each card shows:
- The node that created the checkpoint
- Step number, revision number, checkpoint ID
- An **expand** arrow to preview the plan/draft at that point
- A **Fork** button to time-travel

---

## 12. Feature 6 — Time Travel (Fork from Past State)

Time travel lets you **rewind** a workflow to any past checkpoint and continue from there — optionally with state modifications.

### Basic time travel (restore checkpoint)

```bash
curl -X POST http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/time-travel \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891"
  }'
```

**Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "✅ Time-traveled to checkpoint '1ef9b241-2f85-6b1a-8001-47b0a36b3891'. State restored at node 'planner'. POST /workflow/resume to continue from this point."
}
```

The thread is now **rewound** to step 1 (post-planner). Resume will run `research_plan` next, as if nothing after that ever happened.

### Time travel + state override (fork with changes)

This is the most powerful operation: rewind AND change something simultaneously:

```bash
curl -X POST http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/time-travel \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891",
    "state_overrides": {
      "plan": "New plan: Focus ONLY on AI in drug discovery and clinical trials. Skip diagnostics entirely.",
      "max_revisions": 3
    }
  }'
```

After this, resuming will run `research_plan` using the **new plan** you injected — creating an entirely different essay branch from the same starting point.

### In the UI

1. In the **History** panel (right), click **Fork** on any checkpoint
2. The **Time Travel modal** opens, showing the checkpoint details
3. Optionally enter JSON in the **State Overrides** textarea to modify values at that point
4. Click **Fork Here**
5. The workflow is now rewound — click Resume to continue

---

## 13. Feature 7 — Multi-Thread Workflows

You can run multiple independent workflows simultaneously. Each has its own `thread_id` and isolated state.

### Start a second workflow

```bash
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "The future of quantum computing in cryptography",
    "max_revisions": 1,
    "interrupt_after": ["generate"]
  }'
```

This returns a **different** `thread_id`. Both threads exist in SQLite simultaneously.

### List all active threads

```bash
curl http://localhost:8000/api/threads
```

### Switch between threads in the UI

The **left sidebar** shows all thread IDs. Click any thread to switch — the graph, state panel, and history all update to reflect that thread's state.

---

## 14. Feature 8 — Fully Autonomous Run

Pass an empty `interrupt_after` list to let the agent run from start to finish without any pauses:

```bash
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Climate change solutions and renewable energy technologies",
    "max_revisions": 2,
    "interrupt_after": []
  }'
```

**Response (after full run completes):**
```json
{
  "thread_id": "b7c3f1a2-...",
  "last_node": "generate",
  "next_node": null,
  "revision_number": 3,
  "step_count": 11,
  "status": "completed",
  "message": "Workflow completed after 3 revision(s)."
}
```

Then inspect the final essay:

```bash
curl http://localhost:8000/api/workflow/b7c3f1a2-.../state
```

The `draft` field will contain the final polished essay.

---

## 15. Complete API Reference with Sample Q&A

### Health Check

| | |
|---|---|
| **Request** | `GET /health` |
| **Response** | `{"status": "ok"}` |

---

### GET /api/graph/schema

Returns the graph topology for frontend visualization.

```bash
curl http://localhost:8000/api/graph/schema
```

```json
{
  "nodes": [
    {"id": "planner", "label": "Planner", "description": "Creates a structured essay outline from the topic.", "hitl_note": "Pause here to review/modify the plan before research starts."},
    {"id": "research_plan", "label": "Research Plan", "description": "Generates search queries and fetches research via Tavily.", "hitl_note": "Pause here to review what research was gathered."},
    {"id": "generate", "label": "Generate", "description": "Writes or revises the essay draft using the plan + research.", "hitl_note": "Pause here to read the draft and optionally edit it."},
    {"id": "reflect", "label": "Reflect", "description": "Critiques the current draft and suggests improvements.", "hitl_note": "Pause here to review or override the AI critique."},
    {"id": "research_critique", "label": "Research Critique", "description": "Fetches more research based on the critique.", "hitl_note": "Pause here to see what new evidence was pulled in."}
  ],
  "edges": [
    {"from": "planner", "to": "research_plan", "type": "fixed"},
    {"from": "research_plan", "to": "generate", "type": "fixed"},
    {"from": "generate", "to": "reflect", "type": "conditional", "condition": "revision_number <= max_revisions"},
    {"from": "generate", "to": "__end__", "type": "conditional", "condition": "revision_number > max_revisions"},
    {"from": "reflect", "to": "research_critique", "type": "fixed"},
    {"from": "research_critique", "to": "generate", "type": "fixed"}
  ],
  "entry_point": "planner",
  "all_nodes": ["planner", "research_plan", "generate", "reflect", "research_critique"],
  "default_interrupt_after": ["planner", "research_plan", "generate", "reflect", "research_critique"]
}
```

---

### GET /api/graph/config

```bash
curl http://localhost:8000/api/graph/config
```

```json
{
  "all_nodes": ["planner", "research_plan", "generate", "reflect", "research_critique"],
  "default_interrupt_after": ["planner", "research_plan", "generate", "reflect", "research_critique"],
  "default_max_revisions": 2,
  "max_revisions_cap": 5,
  "llm_model": "llama-3.3-70b-versatile",
  "llm_provider": "Groq",
  "search_provider": "Tavily"
}
```

---

### GET /api/workflow/interrupt-options

```bash
curl http://localhost:8000/api/workflow/interrupt-options
```

```json
{
  "all_nodes": ["planner", "research_plan", "generate", "reflect", "research_critique"],
  "default_interrupt_after": ["planner", "research_plan", "generate", "reflect", "research_critique"],
  "description": "Pass any subset of all_nodes in interrupt_after when starting a workflow."
}
```

---

### POST /api/workflow/start

```bash
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
    "task": "The impact of artificial intelligence on modern healthcare",
    "max_revisions": 2,
    "interrupt_after": ["planner"]
  }'
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "Paused after 'planner'. Next node: 'research_plan'. You can inspect/modify state, then POST /resume to continue."
}
```

---

### GET /api/workflow/{thread_id}/status

```bash
curl http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/status
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "Paused after 'planner'. Next node: 'research_plan'."
}
```

---

### GET /api/workflow/{thread_id}/state

```bash
curl http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state
```

```json
{
  "task": "The impact of artificial intelligence on modern healthcare",
  "lnode": "planner",
  "plan": "I. Introduction: The Rise of AI in Healthcare\n   - Thesis statement...\nII. Core Applications\n   - Diagnostics, imaging, predictive analytics...\nIII. Challenges and Future\n   - Bias, privacy, ethical frameworks...",
  "draft": "",
  "critique": "",
  "content": [],
  "queries": [],
  "revision_number": 0,
  "max_revisions": 2,
  "count": 1
}
```

---

### PATCH /api/workflow/{thread_id}/state

```bash
curl -X PATCH http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state \
  -H "Content-Type: application/json" \
  -d '{
    "key": "plan",
    "value": "Focus only on AI in diagnostics. Cover: 1) Medical imaging AI, 2) Predictive patient risk models, 3) Bias and fairness in clinical AI.",
    "as_node": "planner"
  }'
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted"
}
```

---

### POST /api/workflow/resume

```bash
curl -X POST http://localhost:8000/api/workflow/resume \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8"}'
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "research_plan",
  "next_node": "generate",
  "revision_number": 0,
  "step_count": 2,
  "status": "interrupted",
  "message": "Paused after 'research_plan'. Next node: 'generate'."
}
```

---

### GET /api/history/{thread_id}

```bash
curl http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "total_snapshots": 2,
  "snapshots": [
    {
      "checkpoint_id": "1ef9b241-3cc1-6ecc-8002-47b0a36b3891",
      "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
      "step": 2,
      "last_node": "research_plan",
      "next_node": "generate",
      "revision_number": 0,
      "step_count": 2,
      "values": {
        "task": "The impact of artificial intelligence on modern healthcare",
        "lnode": "research_plan",
        "plan": "Focus only on AI in diagnostics...",
        "draft": "",
        "critique": "",
        "content": ["AI in healthcare is moving from concept to reality..."],
        "queries": ["AI medical imaging advances 2024", "predictive AI patient outcomes"],
        "revision_number": 0,
        "max_revisions": 2,
        "count": 2
      }
    },
    {
      "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891",
      "step": 1,
      "last_node": "planner",
      "next_node": "research_plan",
      "revision_number": 0,
      "step_count": 1,
      "values": { "task": "...", "plan": "...", "draft": "", ... }
    }
  ]
}
```

---

### GET /api/history/{thread_id}/snapshot/{checkpoint_id}

```bash
curl http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/snapshot/1ef9b241-2f85-6b1a-8001-47b0a36b3891
```

```json
{
  "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891",
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "step": 1,
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "values": {
    "task": "The impact of artificial intelligence on modern healthcare",
    "lnode": "planner",
    "plan": "I. Introduction: The Rise of AI...\nII. Core Applications...\nIII. Challenges...",
    "draft": "",
    "critique": "",
    "content": [],
    "queries": [],
    "revision_number": 0,
    "max_revisions": 2,
    "count": 1
  }
}
```

---

### POST /api/history/{thread_id}/time-travel

```bash
curl -X POST http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/time-travel \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint_id": "1ef9b241-2f85-6b1a-8001-47b0a36b3891",
    "state_overrides": {
      "plan": "Rewrite: focus on AI in drug discovery only."
    }
  }'
```

```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "planner",
  "next_node": "research_plan",
  "revision_number": 0,
  "step_count": 1,
  "status": "interrupted",
  "message": "✅ Time-traveled to checkpoint '1ef9b241-2f85-6b1a-8001-47b0a36b3891'. State restored at node 'planner'. POST /workflow/resume to continue from this point."
}
```

---

### GET /api/threads

```bash
curl http://localhost:8000/api/threads
```

```json
{
  "threads": [
    "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
    "b7c3f1a2-1234-5678-90ab-cdef01234567"
  ],
  "total": 2
}
```

---

### DELETE /api/threads/{thread_id}

```bash
curl -X DELETE http://localhost:8000/api/threads/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```

```json
{
  "message": "Thread '3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8' and all its checkpoints have been deleted."
}
```

---

## 16. Exploring via Swagger UI

The fastest way to explore the API without writing `curl` commands:

1. Open **http://localhost:8000/docs** in your browser
2. You'll see all endpoints grouped by tag:
   - **Workflow — HITL**: start, resume, status, state, patch state
   - **History & Time-Travel**: history, snapshot, time-travel, threads
   - **Graph Introspection**: schema, config
3. Click any endpoint → **Try it out** → fill fields → **Execute**
4. The real JSON request and response are shown inline

> 💡 Start with `POST /api/workflow/start`, copy the `thread_id` from the response, then use it in every subsequent endpoint.

---

## 17. Exploring via the React Frontend

### Landing Page (`http://localhost:5173`)

| Element | Action |
|---|---|
| **Start New Workflow** button | Opens the workflow form modal |
| **Open Workspace** button | Goes directly to the 3-panel workspace |
| Feature cards | Visual overview of HITL, Time Travel, State Modification, Multi-Thread |

### Workspace Page (`http://localhost:5173/workspace`)

The workspace has **3 collapsible panels**:

#### Left Panel — Thread Sidebar
- Lists all saved `thread_id`s from the SQLite database
- Click any thread to switch to it (loads status, state, history)
- **+ New Workflow** opens the start form
- Trash icon deletes a thread

#### Center Panel — Main Workflow

**Pipeline Progress bar** (top):
- Shows all 5 nodes as icons
- Active node pulses with indigo glow
- Completed nodes show a green checkmark
- Connector lines turn green as nodes complete

**Graph Topology** (ReactFlow):
- Interactive node/edge diagram of the pipeline
- Blue edges = fixed transitions
- Amber dashed edges = conditional transitions (revision loop)
- Active node glows and pulses

**Status Banner**:
- `⏸ Paused` (amber): Shows which node just ran, which runs next, and a **Resume** button
- `Running…` (indigo): Shows animated sliding progress bar while LLM is executing
- `✅ Completed` (green): Shows final revision and step count
- `⚠ Error` (red): Shows the error message

**State Panel** (tabs):
| Tab | Shows | Editable? |
|---|---|---|
| Plan | Essay outline from Planner | ✅ (while paused) |
| Draft | Full essay draft | ✅ (while paused) |
| Research | Tavily queries + content snippets | ❌ |
| Critique | AI critique of draft | ✅ (while paused) |
| Raw JSON | Full `AgentState` as JSON | ❌ |

To edit: hover over the content → click the **Edit** button → modify text → **Save Changes**.

#### Right Panel — History Timeline
- Vertical list of checkpoints, newest first
- Each card shows: node name, step, revision, checkpoint ID
- **Expand** a card to preview plan/draft at that point
- **Fork** button opens the Time Travel modal

---

## 18. Troubleshooting

### Backend won't start

| Error | Fix |
|---|---|
| `GROQ_API_KEY is not set` | Create `backend/.env` with your key |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` in `.venv` |
| `Address already in use` | Kill the process using port 8000: `netstat -ano \| findstr :8000` |

### Frontend can't connect to backend

| Symptom | Fix |
|---|---|
| `Network Error` in browser console | Make sure backend is running on port 8000 |
| CORS errors | Backend allows `localhost:5173` — verify Vite is on that port |
| Old data showing | The SQLite DB persists between restarts — threads are remembered |

### LLM calls timing out

The Groq + Tavily calls can take 15–30 seconds. The frontend has a 120-second timeout. If you see a timeout error:
- Check your Groq and Tavily API rate limits
- Retry the resume — the checkpoint means you won't lose progress

### "Thread has already completed"

If you call `POST /resume` on a completed thread, you'll get a 400 error. Start a new workflow or time-travel to a past checkpoint first.

### State edit fails with 400

Make sure `as_node` matches the field you're editing:
- `plan` → `"as_node": "planner"`
- `draft` → `"as_node": "generate"`
- `critique` → `"as_node": "reflect"`

---

## Quick Reference

```bash
# === Start everything ===
# Terminal 1:
cd backend && .venv\Scripts\activate && uvicorn main:app --reload

# Terminal 2:
cd frontend && npm run dev

# === Core flow (replace THREAD_ID each session) ===
THREAD="your-thread-id-here"

# 1. Start
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{"task":"Your essay topic","max_revisions":2,"interrupt_after":["planner","generate"]}'

# 2. Inspect state
curl http://localhost:8000/api/workflow/$THREAD/state

# 3. Edit state (optional)
curl -X PATCH http://localhost:8000/api/workflow/$THREAD/state \
  -H "Content-Type: application/json" \
  -d '{"key":"plan","value":"New plan...","as_node":"planner"}'

# 4. Resume
curl -X POST http://localhost:8000/api/workflow/resume \
  -H "Content-Type: application/json" \
  -d "{\"thread_id\":\"$THREAD\"}"

# 5. Get history
curl http://localhost:8000/api/history/$THREAD

# 6. Time travel
curl -X POST http://localhost:8000/api/history/$THREAD/time-travel \
  -H "Content-Type: application/json" \
  -d '{"checkpoint_id":"<checkpoint_id_from_history>"}'

# 7. List all threads
curl http://localhost:8000/api/threads

# 8. Delete thread
curl -X DELETE http://localhost:8000/api/threads/$THREAD
```

---

*Built with LangGraph · FastAPI · Groq (llama-3.3-70b) · Tavily · React · Vite · Tailwind CSS*
