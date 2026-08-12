# LangGraph HITL Explorer Backend

This document explains how to set up, run, and interact with the backend of the LangGraph Human-In-The-Loop (HITL) Explorer.

## How to run the backend

1. **Navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Create a virtual environment**
   It's highly recommended to use a virtual environment to manage dependencies:
   ```bash
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install the dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**
   The backend relies on Groq and Tavily APIs. Create a file named `.env` in the `backend` folder and add your keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

5. **Validate your APIs (Optional)**
   Run the connectivity check to ensure your keys are correctly configured and working:
   ```bash
   python api_check.py
   ```

6. **Start the Server**
   Start the FastAPI application using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will now be available at `http://localhost:8000`.
   - **Swagger UI** (Interactive Docs): `http://localhost:8000/docs`
   - **ReDoc**: `http://localhost:8000/redoc`

---

## Available API Endpoints

The API is grouped into three main categories:

### 1. Workflow / HITL Endpoints
These endpoints are used to control the state machine execution.
- `POST /api/workflow/start`: Start a new thread and execute the workflow until the first interrupt point.
- `GET /api/workflow/{thread_id}/status`: Poll the current execution status (completed vs interrupted).
- `GET /api/workflow/{thread_id}/state`: Read all current values in the `AgentState` (e.g., plan, draft, queries).
- `PATCH /api/workflow/{thread_id}/state`: Update state fields manually mid-flight (Human-In-The-Loop action).
- `POST /api/workflow/resume`: Continue the workflow execution to the next interrupt point.
- `GET /api/workflow/interrupt-options`: List all the valid nodes where the graph can be paused.

### 2. History & Time-Travel Endpoints
These endpoints allow you to inspect past iterations and fork from them.
- `GET /api/history/{thread_id}`: List all checkpoints saved for a given thread.
- `GET /api/history/{thread_id}/snapshot/{checkpoint_id}`: Inspect the `AgentState` at a specific past checkpoint.
- `POST /api/history/{thread_id}/time-travel`: Fork the workflow from a historical checkpoint, effectively making it the new present state.
- `GET /api/threads`: List all active `thread_id`s stored in the database.
- `DELETE /api/threads/{thread_id}`: Clear a specific thread and all its history from the database.

### 3. Graph Schema
- `GET /api/graph/schema`: Retrieve information about the graph's structure (nodes and edges).

---

## Sample Questions (Requests) and Expected Answers (Responses)

You can check these endpoints using `curl`, Postman, or directly in the Swagger UI (`http://localhost:8000/docs`).

### 1. Checking if the server is healthy
**Request:**
```bash
curl -X GET http://localhost:8000/health
```
**Expected Response:**
```json
{
  "status": "ok"
}
```

### 2. Starting a new workflow
**Request:**
```bash
curl -X POST http://localhost:8000/api/workflow/start \
  -H "Content-Type: application/json" \
  -d '{
        "task": "Write an essay about AI in healthcare",
        "max_revisions": 2,
        "interrupt_after": ["planner"]
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

### 3. Inspecting the state (While interrupted)
**Request:**
```bash
# Note: Replace with the actual thread_id from the start endpoint
curl -X GET http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state
```
**Expected Response:**
```json
{
  "task": "Write an essay about AI in healthcare",
  "lnode": "planner",
  "plan": "1. Introduction...\n2. Overview of Healthcare AI...\n3. Conclusion.",
  "draft": "",
  "critique": "",
  "content": [],
  "queries": [],
  "revision_number": 0,
  "max_revisions": 2,
  "count": 1
}
```

### 4. Editing the state manually (HITL action)
**Request:**
```bash
curl -X PATCH http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/state \
  -H "Content-Type: application/json" \
  -d '{
        "key": "plan",
        "value": "1. Let us skip the introduction entirely...",
        "as_node": "planner"
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

### 5. Resuming the workflow
**Request:**
```bash
curl -X POST http://localhost:8000/api/workflow/resume \
  -H "Content-Type: application/json" \
  -d '{
        "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8"
      }'
```
**Expected Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "research_plan",
  "next_node": "generate",
  "revision_number": 0,
  "step_count": 2,
  "status": "interrupted",
  "message": "Paused after 'research_plan'. Next node: 'generate'. You can inspect/modify state, then POST /resume to continue."
}
```

### 6. Checking Workflow Status
You can poll this endpoint without fetching the entire state (useful for UI updates).
**Request:**
```bash
curl -X GET http://localhost:8000/api/workflow/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/status
```
**Expected Response:**
```json
{
  "thread_id": "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "last_node": "research_plan",
  "next_node": "generate",
  "revision_number": 0,
  "step_count": 2,
  "status": "interrupted",
  "message": "Paused after 'research_plan'. Next node: 'generate'. You can inspect/modify state, then POST /resume to continue."
}
```

### 7. Listing all Checkpoints (History)
View the state history of a given thread to see all the pause points.
**Request:**
```bash
curl -X GET http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```
**Expected Response:**
```json
[
  {
    "checkpoint_id": "1e9b88c4-c09a...",
    "parent_checkpoint_id": "1e9b88a1-d00f...",
    "node_name": "research_plan",
    "created_at": "2026-08-12T10:05:00Z"
  },
  {
    "checkpoint_id": "1e9b88a1-d00f...",
    "parent_checkpoint_id": null,
    "node_name": "planner",
    "created_at": "2026-08-12T10:04:00Z"
  }
]
```

### 8. Inspecting a Past State (Snapshot)
Retrieve the exact `AgentState` values as they were at a past checkpoint.
**Request:**
```bash
# Note: Replace checkpoint_id with an actual ID from the history list
curl -X GET http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/snapshot/1e9b88a1-d00f...
```
**Expected Response:**
```json
{
  "task": "Write an essay about AI in healthcare",
  "lnode": "planner",
  "plan": "1. Introduction...\n2. Overview of Healthcare AI...\n3. Conclusion.",
  "draft": "",
  "critique": "",
  "content": [],
  "queries": [],
  "revision_number": 0,
  "max_revisions": 2,
  "count": 1
}
```

### 9. Time-Traveling (Forking from a past state)
Restore a past state, effectively rewinding the workflow. You can then resume or modify it from that point.
**Request:**
```bash
curl -X POST http://localhost:8000/api/history/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8/time-travel \
  -H "Content-Type: application/json" \
  -d '{
        "checkpoint_id": "1e9b88a1-d00f..."
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
  "message": "Time-traveled to checkpoint 1e9b88a1-d00f..."
}
```

### 10. Listing Active Threads
List all the workflow `thread_id`s stored in the database.
**Request:**
```bash
curl -X GET http://localhost:8000/api/threads
```
**Expected Response:**
```json
[
  "3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8",
  "a123b456-7890-1234-5678-abcdef123456"
]
```

### 11. Deleting a Thread
Clear a thread and its entire history from the database.
**Request:**
```bash
curl -X DELETE http://localhost:8000/api/threads/3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8
```
**Expected Response:**
```json
{
  "status": "success",
  "message": "Thread 3f98c8c5-9b24-4f4c-8a9d-1b3a4a75e2e8 deleted successfully."
}
```

### 12. Getting Graph Schema
Retrieve the topology of the state graph (useful for rendering in a UI).
**Request:**
```bash
curl -X GET http://localhost:8000/api/graph/schema
```
**Expected Response:**
```json
{
  "nodes": {
    "planner": {
      "hitl_note": "You can inspect/edit the plan before it is used for research."
    },
    "generate": {
      "hitl_note": "You can inspect/edit the essay draft."
    }
  },
  "edges": [
    {
      "source": "planner",
      "target": "research_plan"
    },
    {
      "source": "research_plan",
      "target": "generate"
    }
  ]
}
```
