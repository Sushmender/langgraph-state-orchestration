# LangGraph HITL Explorer - Frontend Walkthrough Guide

Welcome to the **LangGraph HITL (Human-In-The-Loop) Explorer**! 

This guide is designed to help you, the user, get the absolute most out of the frontend experience. We will walk through the entire application step-by-step, explaining the power of each feature. 

Assuming your backend is running (`http://localhost:8000`) and your frontend is running (`http://localhost:5173`), you're ready to experience AI workflows where **you** hold the reins!

---

## 🌟 The Philosophy

Normally, AI agents execute entirely in a black box. They think, they act, and they produce a final output. If they go off-track, there's nothing you can do until they finish.

**Not anymore.** 

This platform allows you to:
1. **Pause** the AI mid-thought.
2. **Inspect** exactly what it's planning, drafting, or critiquing.
3. **Modify** its internal state (change its plan, rewrite a section of its draft).
4. **Resume** the workflow as if the AI came up with your ideas itself.
5. **Time Travel** to past decisions and fork new paths!

Let's dive into the core features.

---

## 🚀 Feature 1: Starting a New Workflow Thread

Every workflow lives in a dedicated "Thread". To start, look for the main input area on the dashboard. 

### How to use it:
1. Find the **"Start New Run"** or **"Topic"** input on the main dashboard.
2. Enter a topic you want the AI to write an essay about (e.g., *"The Impact of AI on Modern Agriculture"*).
3. Hit **Submit**.

### What happens under the hood (API Context):
The frontend makes a call to start the graph execution.

**Endpoint:** `POST /api/workflow/start`
**Sample Payload:**
```json
{
  "topic": "The Impact of AI on Modern Agriculture"
}
```
**Expected Response:**
```json
{
  "thread_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "running"
}
```

*Enthusiast Tip:* Notice how quickly the thread is created. The AI is now working on the first node of the graph (usually creating an initial plan).

---

## ⏸️ Feature 2: Human-In-The-Loop (HITL) Interruption

The AI is configured to pause after specific steps (nodes) so you can review its work. Once a step is complete, the status changes to `interrupted`.

### How to use it:
1. On your thread dashboard, you'll see a visual graph or a timeline.
2. The current active step will highlight, and the workflow status will show as **Paused** or **Interrupted**.
3. You can click on the current node to view why it paused.

### What happens under the hood (API Context):
The frontend polls or fetches the status to see where the workflow currently sits.

**Endpoint:** `GET /api/workflow/{thread_id}/status`
**Expected Response:**
```json
{
  "thread_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "interrupted",
  "next_nodes": ["draft_essay"],
  "current_node": "plan_essay"
}
```

---

## 🔍 Feature 3: State Inspection

When the workflow is paused, it's time to peek inside the AI's "brain" to see what it generated.

### How to use it:
1. Locate the **State Inspector** panel on the frontend.
2. You will see tabs or sections for variables like `plan`, `draft`, `critique`, and `topic`.
3. If it paused after planning, check the `plan` variable. You'll see the exact outline the AI intends to follow!

### What happens under the hood (API Context):
The frontend retrieves the full `AgentState`.

**Endpoint:** `GET /api/workflow/{thread_id}/state`
**Expected Response:**
```json
{
  "topic": "The Impact of AI on Modern Agriculture",
  "plan": "1. Introduction\n2. AI in Crop Monitoring\n3. Automated Harvesting\n4. Conclusion",
  "draft": "",
  "critique": ""
}
```

---

## ✍️ Feature 4: State Modification (Steering the AI)

This is the magic! You don't like part of the plan? You can rewrite it right there. The AI will accept your changes as its own reality and proceed based on your edits.

### How to use it:
1. In the State Inspector, click **Edit** on the `plan` or `draft`.
2. Add a new point to the plan (e.g., *"2.5 Predictive Weather Modeling"*).
3. Click **Save** or **Update State**.

### What happens under the hood (API Context):
The frontend sends a PATCH request to overwrite that specific state variable.

**Endpoint:** `PATCH /api/workflow/{thread_id}/state`
**Sample Payload:**
```json
{
  "state_updates": {
    "plan": "1. Introduction\n2. AI in Crop Monitoring\n2.5 Predictive Weather Modeling\n3. Automated Harvesting\n4. Conclusion"
  }
}
```
**Expected Response:**
```json
{
  "status": "success",
  "updated_keys": ["plan"]
}
```

*Enthusiast Tip:* This completely breaks the traditional AI black-box limit. You just steered the trajectory of the generation seamlessly!

---

## ▶️ Feature 5: Resuming the Workflow

Once you are satisfied with the state (whether you edited it or just reviewed it), you tell the AI to continue to the next step.

### How to use it:
1. Click the big **"Resume"** or **"Continue"** button on the UI.
2. The UI will show the workflow transition from `interrupted` back to `running`.
3. It will proceed to the next node (e.g., `draft_essay`) and pause again.

### What happens under the hood (API Context):
The frontend triggers the resume action.

**Endpoint:** `POST /api/workflow/resume`
**Sample Payload:**
```json
{
  "thread_id": "123e4567-e89b-12d3-a456-426614174000"
}
```
**Expected Response:**
```json
{
  "status": "resumed"
}
```

---

## ⏱️ Feature 6: Time Travel & History

Mistakes happen! Maybe the AI generated a bad draft, or maybe you want to explore two different ideas from the same plan. You can view the history and jump back in time.

### How to use it:
1. Open the **History** or **Timeline** view in the sidebar or main panel.
2. You will see a list of all checkpoints (every time the graph executed a node).
3. Click on a past checkpoint to view what the state looked like exactly at that moment.
4. Click **"Restore to this checkpoint"** or **"Fork from here"**.

### What happens under the hood (API Context):

**Viewing History Endpoint:** `GET /api/history/{thread_id}`
**Expected Response:**
```json
{
  "checkpoints": [
    {
      "checkpoint_id": "chk_abc",
      "timestamp": "2026-08-18T13:00:00Z",
      "node": "plan_essay"
    },
    {
      "checkpoint_id": "chk_xyz",
      "timestamp": "2026-08-18T13:01:00Z",
      "node": "draft_essay"
    }
  ]
}
```

**Time Travel Endpoint:** `POST /api/history/{thread_id}/time-travel`
**Sample Payload:**
```json
{
  "checkpoint_id": "chk_abc"
}
```
**Expected Response:**
```json
{
  "status": "success",
  "new_thread_id": "999e4567-e89b-12d3-a456-426614174001",
  "message": "Forked successfully. New thread created."
}
```

*Enthusiast Tip:* Time travel effectively creates a new parallel timeline. Your original thread remains untouched, but now you have a new thread starting from the exact past state you selected. Perfect for A/B testing ideas!

---

## 🎓 Conclusion

By using this frontend, you aren't just prompting an AI; you are **orchestrating** an AI workflow. 
1. **Start** a thread.
2. **Review** when it pauses.
3. **Modify** state variables to steer.
4. **Resume**.
5. **Time-travel** if you want to branch out.

Enjoy exploring the possibilities!
