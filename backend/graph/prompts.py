"""
graph/prompts.py
----------------
All system prompt strings extracted as module-level constants.
Keeping them here means the frontend can later call GET /api/graph/config
to read (and potentially override) these without touching node logic.
"""

PLAN_PROMPT = (
    "You are an expert writer tasked with writing a high level outline of a short "
    "3 paragraph essay. Write such an outline for the user provided topic. Give the "
    "three main headers of an outline of the essay along with any relevant notes or "
    "instructions for the sections. Format the outline using standard Markdown, "
    "wrapping the main roman-numeral headers as markdown headers (e.g. '## I. Introduction') "
    "and separating paragraphs with blank lines."
)

RESEARCH_PLAN_PROMPT = (
    "You are a researcher charged with providing information that can be used when "
    "writing the following essay. Generate a list of search queries that will gather "
    "any relevant information. Only generate 3 queries max."
)

WRITER_PROMPT = (
    "You are an essay assistant tasked with writing excellent 3 paragraph essays. "
    "Generate the best essay possible for the user's request and the initial outline. "
    "If the user provides critique, respond with a revised version of your previous "
    "attempts. Utilize all the information below as needed:\n"
    "------\n"
    "{content}"
)

REFLECTION_PROMPT = (
    "You are a teacher grading a 3 paragraph essay submission. Generate critique and "
    "recommendations for the user's submission. Provide detailed recommendations, "
    "including requests for length, depth, style, etc."
)

RESEARCH_CRITIQUE_PROMPT = (
    "You are a researcher charged with providing information that can be used when "
    "making any requested revisions (as outlined below). Generate a list of search "
    "queries that will gather any relevant information. Only generate 2 queries max."
)

# ── Graph node names (used for interrupt_after and UI labels) ──────────────────
NODE_PLANNER = "planner"
NODE_RESEARCH_PLAN = "research_plan"
NODE_GENERATE = "generate"
NODE_REFLECT = "reflect"
NODE_RESEARCH_CRITIQUE = "research_critique"

ALL_NODES = [
    NODE_PLANNER,
    NODE_RESEARCH_PLAN,
    NODE_GENERATE,
    NODE_REFLECT,
    NODE_RESEARCH_CRITIQUE,
]

# Default: pause after EVERY node so the user sees each step
DEFAULT_INTERRUPT_AFTER = ALL_NODES.copy()


# ── Graph topology metadata (used by GET /api/graph/schema) ──────────────────
def get_graph_schema() -> dict:
    """
    Returns a serialisable description of the graph's topology for the
    frontend to render a node/edge visualisation without needing to run
    any LLM calls.

    Lives in prompts.py (not builder.py) intentionally: it's pure static
    data with no LangGraph/LLM imports, so api/routes/graph.py can import
    it without triggering the full builder module load.
    """
    return {
        "nodes": [
            {
                "id": NODE_PLANNER,
                "label": "Planner",
                "description": "Creates a structured essay outline from the topic.",
                "hitl_note": "Pause here to review/modify the plan before research starts.",
            },
            {
                "id": NODE_RESEARCH_PLAN,
                "label": "Research Plan",
                "description": "Generates search queries and fetches research via Tavily.",
                "hitl_note": "Pause here to review what research was gathered.",
            },
            {
                "id": NODE_GENERATE,
                "label": "Generate",
                "description": "Writes or revises the essay draft using the plan + research.",
                "hitl_note": "Pause here to read the draft and optionally edit it.",
            },
            {
                "id": NODE_REFLECT,
                "label": "Reflect",
                "description": "Critiques the current draft and suggests improvements.",
                "hitl_note": "Pause here to review or override the AI critique.",
            },
            {
                "id": NODE_RESEARCH_CRITIQUE,
                "label": "Research Critique",
                "description": "Fetches more research based on the critique.",
                "hitl_note": "Pause here to see what new evidence was pulled in.",
            },
        ],
        "edges": [
            {"from": NODE_PLANNER, "to": NODE_RESEARCH_PLAN, "type": "fixed"},
            {"from": NODE_RESEARCH_PLAN, "to": NODE_GENERATE, "type": "fixed"},
            {
                "from": NODE_GENERATE,
                "to": NODE_REFLECT,
                "type": "conditional",
                "condition": "revision_number <= max_revisions",
            },
            {
                "from": NODE_GENERATE,
                "to": "__end__",
                "type": "conditional",
                "condition": "revision_number > max_revisions",
            },
            {"from": NODE_REFLECT, "to": NODE_RESEARCH_CRITIQUE, "type": "fixed"},
            {"from": NODE_RESEARCH_CRITIQUE, "to": NODE_GENERATE, "type": "fixed"},
        ],
        "entry_point": NODE_PLANNER,
        "all_nodes": ALL_NODES,
        "default_interrupt_after": DEFAULT_INTERRUPT_AFTER,
    }
