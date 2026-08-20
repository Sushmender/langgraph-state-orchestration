# 🧠 LangGraph HITL Explorer — Complete User Guide

> **You are not just prompting an AI. You are *orchestrating* one.**
> This guide will take you from zero to a completed, human-steered AI essay — step by step.

---

## 📖 Table of Contents

1. [What Is This?](#what-is-this)
2. [How to Start](#how-to-start)
3. [Understanding the UI](#understanding-the-ui)
4. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
5. [HITL Superpowers](#hitl-superpowers--what-you-can-do-at-each-pause)
6. [Time Travel & History](#time-travel--history)
7. [Tips, Tricks & Sample Edits](#tips-tricks--sample-edits)
8. [What's Happening Under the Hood](#whats-happening-under-the-hood)
9. [Quick Reference Card](#quick-reference-card)

---

## 🌟 What Is This?

This is an **AI-powered essay writing system** built with **LangGraph** and a **Human-In-The-Loop (HITL)** architecture.

### The Problem It Solves

Traditional AI agents are a black box:
```
You type → [AI does everything in secret] → You get output ❌ (no control)
```

This system breaks that:
```
You type → AI plans → ⏸️ YOU REVIEW → AI researches → ⏸️ YOU REVIEW
→ AI drafts → ⏸️ YOU REVIEW/EDIT → AI critiques → ⏸️ YOU REVIEW/EDIT
→ AI revises → 🏁 DONE ✅ (full transparency + control)
```

> 💡 **Key Insight:** At every `⏸️` pause, you can read, edit, or override what the AI produced.
> The AI will accept your edits as **its own reality** and continue from there.

---

## 🚀 How to Start

### Prerequisites — Make sure both servers are running:

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload
# → Running at http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → Running at http://localhost:5173
```

### Starting Your First Workflow

1. Open your browser at **`http://localhost:5173`**
2. Find the topic input field on the main dashboard
3. Type your essay topic. Here are great examples to try:

| 🟢 Sample Topic | 💬 Why It Works Well |
|---|---|
| `The Impact of AI on Modern Agriculture` | Broad, lots of real research data |
| `Climate Change and Renewable Energy Policy` | Multi-angle, great for critique cycles |
| `The Ethics of Autonomous Vehicles` | Perfect for HITL debate-steering |
| `Social Media's Effect on Mental Health` | Data-rich, many studies available |
| `Blockchain Technology in Supply Chains` | Technical + business angle mix |

4. Set **Max Revisions** (default: `2`) — how many critique→revise cycles will run
5. Click **Start** — the modal closes instantly and the AI begins working ✅

> ⚠️ **Note:** After clicking Start, the modal closes immediately and you land on the workspace. Wait 5–10 seconds for the Planner to finish — the status bar shows `🟢 Running` while it thinks.

---

## 🖥️ Understanding the UI

When the workflow is paused, you'll see this layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                        │
│  📄 Topic   Last: [node]   Next: [node]   Rev X/Y   ⏸️ Paused  │
├─────────────────────┬───────────────────────────────────────────┤
│  LEFT PANEL         │  RIGHT PANEL — STATE VIEWER               │
│                     │                                           │
│  GRAPH TOPOLOGY     │  ┌─ Plan ─ Draft ─ Research ─ Critique ──┐│
│  (visual nodes)     │  │                                       ││
│  🟢 PLANNER         │  │  Content of the selected tab          ││
│  🟢 RESEARCHER      │  │  (rendered as beautiful markdown)     ││
│  🟡 GENERATE        │  │                                       ││
│  ⬜ REFLECT         │  └───────────────────────────────────────┘│
│  ⬜ RESEARCH CRIT.  │                                           │
│                     │  [ ✏️ Edit ]      [ ▶️ Resume ]           │
└─────────────────────┴───────────────────────────────────────────┘
```

### The 4 State Tabs — Know What to Check

| Tab | What It Shows | ✅ When Populated |
|---|---|---|
| 📋 **Plan** | Essay outline with sections & writing notes | After Planner runs |
| 📝 **Draft** | The full prose essay draft | After Generate runs |
| 🔍 **Research** | Search queries used + web content snippets | After Research nodes run |
| 💬 **Critique** | AI teacher's detailed feedback + grade | After Reflect runs |

> 💡 **Always open the Research tab** after each research step to confirm the queries are real and relevant — not placeholder text!

---

## 🗺️ Step-by-Step Walkthrough

---

### 🟢 Step 1 — Planner ✍️

**What the AI does internally:**
Reads your topic → generates a structured markdown essay outline with sections, instructions, and a thesis statement.

**What you see in the UI:**
- Top bar: `Last: Planner  →  Next: Research Plan`
- **Plan tab** shows something like:

```markdown
## I. Introduction
- **Hook:** Begin with a striking statistic about AI adoption in farming
- **Context:** Historical shift from traditional to data-driven agriculture
- **Thesis:** AI is revolutionizing modern agriculture by enhancing crop yields...
- **Instructions:** Keep to one concise paragraph with an academic tone.

## II. Body: Transformative Benefits and Emerging Challenges
- **Core Focus:** Precision farming, computer vision, predictive analytics
- **Examples:** Drones, AI irrigation systems, ML yield prediction
- **Counterpoints:** High costs, digital divide, data privacy

## III. Conclusion
- **Restate Thesis:** Rephrase the central argument
- **Final Thought:** Forward-looking statement on equitable AI access
```

---

**🎯 Your HITL Actions at This Step:**

| Action | Steps | When to Use |
|---|---|---|
| ✅ **Just Resume** | Click ▶️ Resume | Happy with the plan, let AI proceed |
| ✏️ **Add a section** | Edit → add bullet → Save → Resume | Want more coverage of a subtopic |
| 🔄 **Change the focus** | Edit → rewrite section → Save → Resume | AI misunderstood the angle you wanted |
| 🔁 **Override entirely** | Edit → replace plan → Save → Resume | Complete restructure needed |

**📝 Sample Edit — Adding a Missing Subtopic:**

Click **Edit** on the Plan tab and insert:

```markdown
## II. Body: Transformative Benefits and Emerging Challenges
...existing content...

**2.5 Predictive Weather Modeling** ← ADD THIS
  - Include IBM Watson Decision Platform for Agriculture
  - Reference drought forecasting outcomes in India's Telangana region
  - Note: integrate Microsoft's AI Sowing App (ICRISAT collaboration)
```

Save → Resume. The research and draft will now include weather modeling! ✅

> 🏆 **This is the highest-impact edit you can make.** Everything downstream — queries, draft structure, critique focus — flows from the plan. A better plan = a dramatically better essay.

---

### 🔵 Step 2 — Research Plan 🔍

**What the AI does internally:**
Reads your topic → generates **3 targeted search queries** → uses Tavily to fetch **real web articles** → stores snippets in `content[]`.

**What you see in the UI:**
- Top bar: `Last: Research Plan  →  Next: Generate`
- **Research tab** shows query badges + content cards

**✅ What GOOD research looks like:**
```
🔴 artificial intelligence applications in modern agriculture precision farming
🔴 impact of AI on agricultural productivity sustainability and labor
🔴 challenges and future trends of AI adoption in farming

Research Snippets (6):
├─ "FAO statistics show 30-40% post-harvest food losses..."
├─ "AI-powered irrigation reduces water consumption by 15-30%..."
├─ "Smallholder farmers face $1000-3000 initial AI investment barrier..."
└─ (+ 3 more relevant snippets)
```

**❌ What BAD research looks like (old bug — now fixed):**
```
query1, query2, query3  ← Model returned the template literally!
Snippets: SQL tutorials, Config Manager docs  ← Completely irrelevant
```

> ⚠️ **ALWAYS verify the Research tab here before resuming.**
> If queries look like "query1" or snippets are about SQL/databases, **delete this thread and start fresh** — the draft will be garbage otherwise.

---

**🎯 Your HITL Action at This Step:**

Usually just **Resume** — if the queries look relevant, you're good to go.
The research step is less editable but critical to verify.

---

### 🟡 Step 3 — Generate (Draft) 📝

**What the AI does internally:**
Combines the **plan + all research snippets** to write the first complete essay in real prose paragraphs.

**What you see in the UI:**
- Top bar: `Last: Generate  →  Next: Reflect   Rev 1/2`
- **Draft tab** shows full essay paragraphs (not an outline — actual writing)

**✅ What a GOOD draft looks like:**
```
[Paragraph 1 — Introduction]
Feeding a global population that is rapidly expanding while simultaneously
combating the destabilizing effects of climate change and acute labor
shortages presents one of the most formidable challenges of the
twenty-first century. Traditional agricultural methods, long reliant
on mechanization and intuition, are increasingly insufficient...

[Paragraph 2 — Body]
The core of this agricultural revolution lies in the application of
AI-driven technologies, such as computer vision and predictive analytics,
which enable unprecedented levels of precision...

[Paragraph 3 — Conclusion]
Despite these profound benefits, the widespread adoption of AI in
agriculture is not without significant hurdles...
```

---

**🎯 Your HITL Actions at This Step:**

| Action | Steps | Effect |
|---|---|---|
| ✅ **Resume** | Click ▶️ Resume | Let AI critique this draft and improve it |
| ✏️ **Edit a sentence** | Edit → fix the sentence → Save → Resume | Your version gets critiqued + revised |
| 📋 **Add your own writing** | Edit → insert your paragraph → Save → Resume | AI will improve around YOUR text |

**📝 Sample Edit — Injecting a Stronger Opening:**

Replace the first sentence from:
> "Feeding a global population..."

With your edit:
> "By 2050, the world must feed 9.7 billion people — yet climate change, acute labor shortages, and depleting natural resources are converging to make traditional farming increasingly untenable. Artificial Intelligence (AI) has emerged not merely as a tool, but as the defining technological shift in modern agriculture..."

The AI will carry your stronger opening into all future revisions. 🎯

---

### 🟠 Step 4 — Reflect (Critique) 🎓

**What the AI does internally:**
Acts as an academic teacher. Reads the draft and produces a detailed critique with overall grade, structural feedback, and a specific action plan for revision.

**What you see in the UI:**
- Top bar: `Last: Reflect  →  Next: Research Critique   Rev 1/2`
- **Critique tab** shows the full teacher review

**✅ What a GOOD critique looks like:**
```markdown
### Overall Impression
Coherent, academically-toned essay. Thesis is clear. Flow from problem
(climate/labor) to solution (AI) to challenges (ethics/equity) is logical.

Grade: B+

### Recommendations:
1. **Length:** Expand to 500-750 words — currently too brief for academic depth
2. **Depth:** Add 2-3 specific case studies with measurable statistics
3. **Ethics:** Elaborate on data ownership and algorithmic bias issues
4. **Sentence Variety:** Break up the 40+ word sentences in paragraph 1

### Line-by-Line:
- P2: Add specific water savings % for AI irrigation systems
- P3: Cite which regions face the digital divide most severely
```

---

**🎯 Your HITL Actions at This Step — 🥈 2nd Most Impactful Edit!**

| Action | Effect |
|---|---|
| ✅ **Resume** | AI decides what to research based on its own critique |
| ✏️ **Add to critique** | YOUR requirements get researched and addressed in the next revision |
| 🔄 **Replace critique** | Complete override — you become the teacher |

**📝 Sample Edit — Injecting Specific Requirements:**

Open the Critique tab → click **Edit** → scroll to the bottom and add:

```markdown
---
## 🔴 Additional Requirements from Reviewer (MANDATORY):

The next revision MUST incorporate ALL of the following:

1. **India Case Study:** Include the Microsoft AI Sowing App developed with
   ICRISAT — mention the 21% increase in chili yields in Khammam, Telangana
   across 7,000 farmers

2. **Statistics:** Use this exact figure — "AI boosts crop productivity
   by 20-150% (Du et al., 2018)"

3. **Market Data:** Reference the global AI in Agriculture market reaching
   USD 2.4 billion in 2025 (CAGR of 24.5%)

4. **Ethics Paragraph:** Dedicate a full paragraph to data ownership — who
   controls the data collected from farm sensors: the farmer or the tech
   company? (Reference the Ryan, 2022 paper on AI ethics in agriculture)
```

Save → Resume. The `research_critique` node will now **specifically search** for all of these! ✅

---

### 🟣 Step 5 — Research Critique 🔎

**What the AI does internally:**
Reads your (edited) critique → generates **new targeted queries** → fetches **additional content** not in the original research → appends to `content[]`.

**What you see in the UI:**
- Top bar: `Last: Research Critique  →  Next: Generate`
- **Research tab** now shows MORE queries and snippets than before

**✅ Verify at this step:**
New queries should reflect what the critique asked for:
```
🔴 statistics on AI precision farming water savings crop yield case studies India
🔴 ethical implications AI agriculture data ownership algorithmic bias smallholder
```

> 💡 **Note:** `content[]` is **cumulative**. By the final draft, the AI has access to ALL research from all cycles combined — this is why later drafts are significantly richer.

---

### 🏁 Step 6 — Final Draft & Completion

**What the AI does internally:**
Writes the final revision using **all accumulated research** + the full critique feedback.

Then `should_continue` runs:
```python
if revision_number (3) > max_revisions (2):  # TRUE!
    return END  # ✅ Workflow complete
```

**What you see in the UI:**
```
╔════════════════════════════════════════╗
║   ✅ Workflow Complete!                ║
║   3 revision(s) · 15 steps            ║
║   Last: Generate   Rev 3/2  Completed ║
╚════════════════════════════════════════╝
```

The final essay is:
- ✅ Displayed in the **Draft tab** (rendered markdown)
- ✅ Saved as `{topic_slug}.txt` in the project root directory

> 🏆 **You just co-authored an AI essay with full transparency and human steering!**

---

## 🦸 HITL Superpowers — What You Can Do at Each Pause

Complete summary of every edit and its effect:

```
PAUSE AFTER        WHAT TO EDIT          DOWNSTREAM EFFECT
──────────────────────────────────────────────────────────────────────
Planner      →  plan (outline)      →  Research queries, draft structure
Research     →  content (snippets)  →  What the first draft is based on
Generate     →  draft (prose text)  →  What critique evaluates
Reflect      →  critique (feedback) →  What new research targets
Res.Critique →  (verify queries)    →  What final draft incorporates
```

**Edit Impact Rankings:**

| 🏅 Rank | Edit Point | Impact Level |
|---|---|---|
| 🥇 1st | Edit the **Plan** after Planner | Shapes everything downstream |
| 🥈 2nd | Edit the **Critique** after Reflect | Directly steers next revision focus |
| 🥉 3rd | Edit the **Draft** after Generate | Injects your writing into the loop |

---

## [TIME-TRAVEL] Time Travel & History

Made a mistake? Want to try a completely different direction without losing your
original work? **Rewind to any past checkpoint and fork a new branch.**

This is one of the most powerful features of LangGraph. Every node execution is
saved as a persistent checkpoint in SQLite. You can jump back to any of them at
any time.

---

### How the UI Works

**Step 1 -- Open the History panel**

Click the **clock icon** on the left icon rail. A slide-over panel appears
titled "Checkpoint History" showing every node that has run so far:

```
HISTORY                                                  [5]
-----------------------------------------------------------
[LATEST]  Generate       Step 5  Rev 1  [Fork]
          Research Plan  Step 4  Rev 0  [Fork]
          Generate       Step 3  Rev 1  [Fork]
          Research Plan  Step 2  Rev 0  [Fork]
          Planner        Step 1  Rev 0  [Fork]
```

Each card shows:
- **Node name** -- which agent ran at that step
- **Step number** -- total node executions up to that point
- **Revision number** -- which draft cycle this belongs to
- **Checkpoint ID** -- a short unique ID (e.g. `1f19c691...`)
- **[Fork]** button -- click to open the Time Travel modal

**Step 2 -- Click a card to expand it**

Clicking the card body (not the Fork button) expands it to show:
- The **Plan** text that existed at that exact moment
- The **Draft preview** (first 3 lines, clipped)
- The **Next node** that was scheduled to run

Use this to inspect the full state of the workflow at any past point.

**Step 3 -- Click Fork**

The **Time Travel Modal** opens:

```
+----------------------------------------------+
|  [CLOCK]  Time Travel                   [X]  |
|           Fork from checkpoint               |
+----------------------------------------------+
|  [>] Fork Target                             |
|      Node:     Research Plan                 |
|      Step:     2                             |
|      Revision: 0                             |
|      ID:       a3f9b2c1...                   |
+----------------------------------------------+
|  Modify State  (optional)               [v]  |
|  Optionally change the Plan or Critique      |
|  before resuming. Edit the Draft from the    |
|  Agent State panel.                          |
+----------------------------------------------+
|  [ Cancel ]               [ Fork Here ]      |
+----------------------------------------------+
```

- **Fork Here** (no changes) -- pure rewind, re-runs from that exact state
- Click **"Modify State"** toggle to open plain-text fields for Plan and Critique
  - Type your new text in plain English -- no JSON, no special syntax required
  - Leave any field blank to keep the original value
  - The button label changes to **"Fork with Changes"** when any field is filled

**Step 4 -- After forking, click Resume**

The Status Banner updates to show the restored checkpoint:

```
[PAUSED]  Last: Research Plan  ->  Next: Generate  Rev 0/2
```

The workflow continues from the forked checkpoint. A new "Latest" entry appears
at the top of the History panel -- the fork is now the current active state.

---

### Conceptual Flow

```
Normal run:
  Planner -> Researcher -> Generate -> [paused]

      |
      | (you click Fork on Research Plan checkpoint)
      v

Forked state is written as new current state:
  [Research Plan restored as current state]
      |
      v
  Resume -> Generate (runs from restored state forward)
      |
      v
  New draft based on whatever state existed at that checkpoint
  (with or without your edits injected on top)
```

The LangGraph API calls that make this happen behind the scenes:

```python
# 1. Retrieve the old state values from SQLite
old_state = graph.get_state(old_checkpoint_config)

# 2. Write those values back as the new current state
graph.update_state(current_thread_config, old_state.values, as_node=lnode)

# 3. Resume runs forward from here
graph.invoke(None, current_thread_config)
```

---

### Verified Test Results -- Topic: "Social media and mental health in Gen Z"

The following three tests were run live on this system. Results are documented
with real inputs and real outputs to confirm everything works correctly.

---

#### TEST 1 -- Plain Fork (no edits)

**Steps:**
1. Run the full workflow: Planner -> Research Plan -> Generate (paused at Step 3)
2. Open History panel, click **Fork** on **Research Plan** (Step 2)
3. Do NOT open "Modify State" -- click **"Fork Here"** directly
4. Click **Resume**

**What the system does:**
- Restores the Research Plan state as the current checkpoint
- Status Banner: `Last: Research Plan  ->  Next: Generate  Rev 0`
- Runs Generate fresh from that restored state

**Observed output comparison:**

Original draft (first sentence):
```
Generation Z, the first true cohort of "digital natives," has grown up in an
era where ubiquitous internet access and social media platforms are woven into
the fabric of daily life. This generation faces a profound paradox...
```

Fork (no edit) draft (first sentence):
```
Generation Z, the first true cohort of "digital natives," has grown up in an
era where ubiquitous internet access and social media platforms are woven into
the fabric of daily life. This generation faces a profound paradox...
```

**Result:** The drafts are nearly identical in direction and structure. Minor
wording variance exists due to LLM temperature sampling, but the angle, tone,
and conclusions are the same because the same plan and research content is used.

**Key takeaway:** A plain fork = "retry from this point." Same inputs produce
the same kind of output. To get a meaningfully different result, you need to
edit state at the fork point (Tests 2 and 3 below).

---

#### TEST 2 -- Fork + Edit Plan (redirect the entire essay)

**Steps:**
1. From the same workflow, open History panel
2. Click **Fork** on **Research Plan** (Step 2, Rev 0)
3. Click "Modify State" to expand the plain-text fields
4. In the **Plan** field, enter:

```
Research and write a comprehensive essay focusing ONLY on the POSITIVE effects
of social media on Gen Z mental health. Structure the essay around three core
benefits:
1. Community building and belonging for marginalized groups (LGBTQ+ youth,
   minorities)
2. Mental health awareness, destigmatization, and access to resources
3. Creative expression, self-discovery, and confidence building

Avoid discussing negative effects. Use optimistic, empowering language.
Cite real statistics where possible.
```

5. Click **"Fork with Changes"**, then click **Resume**

**What the system does:**
- Injects your plan text into the state before restoring it
- The Researcher uses your plan to generate new, angle-specific queries
- The Generate node writes the draft according to your plan

**Observed result -- Agent State Plan tab after fork (confirmed in UI):**
```
Research and write a comprehensive essay focusing ONLY on the POSITIVE effects
of social media on Gen Z mental health. Structure the essay around three core
benefits:
1. Community building and belonging...
2. Mental health awareness...
3. Creative expression...
```

**Observed result -- Fork + Edit Plan draft opening:**
```
Social media has emerged as a vital lifeline for Gen Z, particularly for
marginalized communities seeking connection and validation in an increasingly
digital world. For LGBTQ+ youth and racial minorities, these platforms offer
unprecedented opportunities to build supportive networks that may be
inaccessible in their immediate physical environments...
```

**Result:** The essay direction changed completely -- from a balanced analysis
of both positive and negative effects to an entirely positive, empowering essay.
The Researcher followed the new plan and generated angle-specific queries.
The Generate node produced a draft consistent with that plan.

**Key takeaway:** Editing the Plan at fork time completely redirects every
downstream node -- research, drafting, and all future revisions. This is the
most impactful Time Travel pattern.

**Impact level: HIGHEST** -- Plan edits affect every downstream node.

---

#### TEST 3 -- Fork + Edit Critique (steer the revision loop)

**Steps:**
1. Let the workflow run further: Generate -> Reflect -> Research Critique ->
   Generate (paused again at Step 5, Rev 1)
2. Open History panel, click **Fork** on the **Generate** checkpoint at Step 5
3. Click "Modify State", then in the **Critique** field, enter:

```
The current draft lacks specificity and reads too academically. Here is the
critique for the next revision:

WEAKNESSES:
- The introduction is too broad -- needs a compelling hook (a shocking
  statistic or real story)
- Missing concrete examples of real Gen Z experiences and voices
- The conclusion is weak -- needs a clear call-to-action for parents,
  educators, and platforms
- Statistics are cited but not analyzed -- explain what they MEAN for Gen Z

REQUIREMENTS FOR NEXT DRAFT:
- Start with a story or a single striking fact
- Include at least one specific platform example (TikTok, Instagram, Discord)
- End with 3 actionable recommendations
- Tone: conversational and relatable, NOT academic
```

4. Click **"Fork with Changes"**, then click **Resume**
   The graph now runs: Research Critique -> Generate (Rev 2)

**What the system does:**
- Injects your critique text into the state
- Research Critique generates targeted queries matching YOUR requirements
- Generate writes a new revision following your critique specifications

**Observed result -- Agent State Critique tab after fork (confirmed in UI):**
```
The current draft lacks specificity and reads too academically.

WEAKNESSES:
- The introduction is too broad...
- Missing concrete examples...
- The conclusion is weak...
- Statistics are cited but not analyzed...

REQUIREMENTS FOR NEXT DRAFT:
- Start with a story or a single striking fact
- Include at least one specific platform example (TikTok, Instagram, Discord)
- End with 3 actionable recommendations
- Tone: conversational and relatable, NOT academic
```

**Observed result -- Fork + Edit Critique resulting draft:**
```
Generation Z faces a profound paradox: while social media offers unprecedented
opportunities for connection, it simultaneously poses significant risks to their
mental well-being. Recent data underscores this tension, with 60% of Gen Z
adults spending at least four hours daily on these platforms, and 59% admitting
to addiction that negatively impacts their productivity and social skills...
The essay argues that the architecture of social media, driven by curated
personas and algorithmic engagement, exacerbates mental health challenges...
```

The draft references specific platforms (Instagram), cites statistics with
interpretation, and ends with concrete recommendations -- exactly as directed.

**Key takeaway:** Injecting your own critique bypasses the AI's self-assessment
entirely. Research Critique searches specifically for what you asked for. Generate
writes to your specifications. You become the editor-in-chief.

**Impact level: HIGH** -- Critique edits control the focus of each revision cycle.

---

### All Three Tests -- Side-by-Side Comparison

```
TEST        FORK POINT       EDIT APPLIED     DRAFT OUTCOME
-----------------------------------------------------------------------
Original    None             None             Balanced academic essay,
                                              covers both positive and
                                              negative effects of social
                                              media on Gen Z

Test 1      Research Plan    None             Near-identical to original.
            Step 2           (plain fork)     Same angle, minor wording
                                              variance only. Confirms
                                              rewind mechanism works.

Test 2      Research Plan    Plan changed     Completely different direction.
            Step 2           (positive-only   Positive-only framing, community
                              plan injected)  building, mental health
                                              awareness, creative expression.
                                              No negatives mentioned.

Test 3      Generate         Custom critique  Same topic but refined per
            Step 5           injected         requirements. Stronger hook,
                                              specific platform examples
                                              (Instagram, TikTok, Discord),
                                              3 actionable recommendations
                                              at the conclusion.
-----------------------------------------------------------------------
```

---

### What Each Test Proves

| Test | LangGraph Concept Demonstrated |
|---|---|
| **Plain Fork** | `update_state()` correctly rewinds the SQLite thread to a past snapshot |
| **Fork + Plan Edit** | State overrides at fork time propagate through all downstream nodes |
| **Fork + Critique Edit** | Mid-loop injection bypasses AI self-critique with human direction |
| **All Tests** | History panel correctly tracks all checkpoints across multiple forks |
| **All Tests** | Time Travel modal resets cleanly between different fork targets |

---

### Important Notes

**Your original thread is safe.** Forking does not overwrite history -- it adds
a new "Latest" checkpoint on top of the existing chain. The previous checkpoints
remain and can be forked again at any time.

**The History panel grows with every fork.** After 3 tests on one thread, you
may see 8-15 checkpoints. Each one is a real SQLite row.

**Draft editing belongs in the Agent State panel**, not the Time Travel modal.
Use the **Edit** button on the Draft tab to edit draft text inline. The Time
Travel modal only exposes Plan and Critique overrides -- these are the highest-
leverage fork interventions because they redirect research and generation upstream.

**To start completely fresh**, use the trash icon next to a thread in the
Threads panel. This permanently deletes all checkpoints for that thread from
the SQLite database.

---


## 💡 Tips, Tricks & Sample Edits

### 🎯 Tip 1 — Be Hyper-Specific in Plan Edits

❌ Weak:
> "Add more about ethics"

✅ Strong:
> "**II.5 Ethical Dimensions (dedicated section):**
> - Data Ownership: who controls farm sensor data — the farmer or the tech company?
> - Algorithmic Bias: are models trained on large US farms less effective for Indian smallholders?
> - Reference: Ryan (2022) — *Social and Ethical Impacts of AI in Agriculture*"

---

### 🎯 Tip 2 — Write Critiques Like Instructions

The critique text flows **directly into the research prompt**. Write it imperatively:

```markdown
MANDATORY FOR NEXT REVISION:
1. Open P1 with: "By 2050, the world must feed 9.7 billion people..."
2. Include Khammam case study: 7,000 farmers, 21% chili yield increase
3. Cite market data: USD 2.4 billion in 2025 at 24.5% CAGR
4. End conclusion with a call-to-action for governments
5. Add at least 3 specific statistics with source citations
```

---

### 🎯 Tip 3 — Max Revisions Strategy

| Max Revisions | Result | Best For |
|---|---|---|
| `1` | Initial draft + 1 critique cycle = v2 final | Quick tests |
| `2` | Two full critique-research-revise cycles ✅ | Most use cases |
| `3+` | Deep iterative refinement | Complex academic writing |

---

### 🎯 Tip 4 — What Each Status Indicator Means

| UI Indicator | Meaning |
|---|---|
| `🟡 Paused — Awaiting Human Review` | AI finished a step, waiting for you |
| `🟢 Running` | AI is currently executing a node |
| `✅ Completed` | Workflow finished — essay is done |
| `Last: X → Next: Y` | X just ran, Y will run when you Resume |
| `Rev 2/2` | Currently on 2nd revision out of 2 max |
| `Steps 15` | 15 total node executions have happened |

---

## 🔧 What's Happening Under the Hood

### Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│  FRONTEND  (React + Vite, port 5173)                 │
│  Graph topology, state tabs, Edit/Resume buttons     │
└───────────────────┬──────────────────────────────────┘
                    │  HTTP fetch calls
┌───────────────────▼──────────────────────────────────┐
│  BACKEND  (FastAPI, port 8000)                       │
│  /api/workflow  /api/history  /api/graph             │
└───────────────────┬──────────────────────────────────┘
                    │  Python + LangGraph SDK
┌───────────────────▼──────────────────────────────────┐
│  LANGGRAPH GRAPH  (the AI pipeline)                  │
│  5 nodes, SQLite checkpointer, interrupt_after=all   │
└──────────────────────────────────────────────────────┘
```

### The 5-Node Pipeline

```
[START]
   |
   v (pauses here)
[planner]           LLM: topic → essay outline (plan)
   |
   v (pauses here)
[research_plan]     LLM: topic → 3 queries → Tavily fetch → content[]
   |
   v (pauses here)
[generate]          LLM: plan + content[] → essay draft
   |
   v  should_continue?
   |-- revision_number > max_revisions --> [END] 🏁
   |
   v (pauses here)
[reflect]           LLM: draft → critique (teacher feedback)
   |
   v (pauses here)
[research_critique]  LLM: critique → 2 queries → Tavily → content[]
   |
   └──────────────────────────────► back to [generate] (loop)
```

### The AgentState Object

Every node reads and writes to one shared memory object:

```python
{
    "task":            str,   # Your topic (never changes)
    "plan":            str,   # Outline — YOU CAN EDIT THIS ✏️
    "draft":           str,   # Essay text — YOU CAN EDIT THIS ✏️
    "critique":        str,   # AI feedback — YOU CAN EDIT THIS ✏️
    "content":         list,  # All research snippets (cumulative)
    "queries":         list,  # Search queries (for UI display)
    "revision_number": int,   # Increments +1 each generate cycle
    "max_revisions":   int,   # Your configured limit
    "lnode":           str,   # Last node run (for UI display)
    "count":           int,   # Total steps executed
}
```

### Key API Calls the UI Makes

| UI Action | API Call | Effect |
|---|---|---|
| Click Start | `POST /api/workflow/start` | Creates thread, runs to first pause |
| Click Resume | `POST /api/workflow/resume` | Continues to next node |
| Click Save (in Edit) | `PATCH /api/workflow/{id}/state` | Overwrites field before next run |
| Load state viewer | `GET /api/workflow/{id}/state` | Fetches full AgentState |
| Load history | `GET /api/history/{id}` | Fetches all checkpoint IDs |
| Time travel | `POST /api/history/{id}/time-travel` | Forks from a past checkpoint |

---

## 📋 Quick Reference Card

```
╔══════════════════════════════════════════════════════════════════╗
║            🧠 HITL WORKFLOW — QUICK REFERENCE CARD             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  1. START       Type topic → Set max_revisions → Submit          ║
║                                                                  ║
║  2. PLANNER ⏸️  Check Plan tab → Clean outline? ✅              ║
║                 Edit plan if needed ← HIGHEST IMPACT            ║
║                 Click Resume ▶️                                   ║
║                                                                  ║
║  3. RESEARCH ⏸️ Check Research tab → Real queries? ✅           ║
║                 If queries = "query1" → DELETE & restart ❌      ║
║                 Click Resume ▶️                                   ║
║                                                                  ║
║  4. GENERATE ⏸️ Check Draft tab → Real prose paragraphs? ✅     ║
║                 Edit draft if desired                            ║
║                 Click Resume ▶️                                   ║
║                                                                  ║
║  5. REFLECT ⏸️  Check Critique tab → Has grade + feedback? ✅   ║
║                 Add YOUR requirements to critique ← HIGH IMPACT ║
║                 Click Resume ▶️                                   ║
║                                                                  ║
║  6. RESEARCH ⏸️ Verify new queries match your critique edits     ║
║     CRITIQUE    Click Resume ▶️                                   ║
║                                                                  ║
║  7. GENERATE    Final draft written                              ║
║                 rev_number > max_revisions → END ✅              ║
║                                                                  ║
║  8. 🏁 DONE     Draft tab = final essay                          ║
║                 Saved as {topic_slug}.txt in project root        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🎓 Conclusion

You've now seen the full picture of a Human-In-The-Loop AI workflow — not just what it does, but *why* each step matters and exactly how to steer it.

| Core Concept | What It Means In Practice |
|---|---|
| 🔍 **Transparency** | Every AI decision is visible before it acts |
| ✏️ **Interactability** | You can change any decision before the next step |
| 💾 **Persistence** | SQLite stores every checkpoint — nothing is ever lost |
| ⏮️ **Time Travel** | Fork from any past point to explore alternatives |
| 🔁 **Iteration** | Multiple cycles make essays progressively better |

This architecture — LangGraph + HITL + checkpointing — is the foundation of modern **agentic AI systems**. The same principles power GitHub Copilot Workspace, Cursor, and enterprise AI pipelines.

> 🚀 **Master this mental model and you understand where AI is heading.**

---

*📅 Guide written based on a live dry-run session. Last verified: August 2026.*
