/**
 * api.ts
 * TypeScript interfaces that mirror every Pydantic schema in the backend.
 * Keep in sync with backend/api/schemas.py
 */

// ─── Request Types ───────────────────────────────────────────────────────────

export interface StartWorkflowRequest {
  task: string;
  max_revisions?: number; // 1-5, default 2
  interrupt_after?: string[]; // node names to pause at
}

export interface ResumeWorkflowRequest {
  thread_id: string;
}

export interface UpdateStateRequest {
  key: string;   // e.g. "plan", "draft", "critique"
  value: unknown; // new value
  as_node: string; // e.g. "planner", "generate", "reflect"
}

export interface TimeTravelRequest {
  checkpoint_id: string;
  state_overrides?: Record<string, unknown>;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export type WorkflowStatusType = 'running' | 'interrupted' | 'completed' | 'error';

export interface WorkflowStatus {
  thread_id: string;
  last_node: string | null;
  next_node: string | null;
  revision_number: number;
  step_count: number;
  status: WorkflowStatusType;
  message: string | null;
}

export interface StateValues {
  task: string | null;
  lnode: string | null;
  plan: string | null;
  draft: string | null;
  critique: string | null;
  content: string[] | null;
  queries: string[] | null;
  revision_number: number | null;
  max_revisions: number | null;
  count: number | null;
}

export interface StateSnapshot {
  checkpoint_id: string;
  thread_id: string;
  step: number;
  last_node: string | null;
  next_node: string | null;
  revision_number: number;
  step_count: number;
  values: StateValues;
}

export interface HistoryResponse {
  thread_id: string;
  total_snapshots: number;
  snapshots: StateSnapshot[];
}

export interface GraphNode {
  id: string;
  label: string;
  description: string;
  hitl_note: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'fixed' | 'conditional';
  condition?: string;
}

export interface GraphSchemaResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  entry_point: string;
  all_nodes: string[];
  default_interrupt_after: string[];
}

export interface GraphConfigResponse {
  all_nodes: string[];
  default_interrupt_after: string[];
  default_max_revisions: number;
  max_revisions_cap: number;
  llm_model: string;
  llm_provider: string;
  search_provider: string;
  description: string;
  concept_explanations: {
    hitl: string;
    time_travel: string;
    state_modification: string;
    multi_thread: string;
  };
}

export interface ThreadListResponse {
  threads: string[];
  total: number;
}

export interface InterruptOptionsResponse {
  all_nodes: string[];
  default_interrupt_after: string[];
  description: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}

// ─── Graph node names ─────────────────────────────────────────────────────────

export const NODE_NAMES = {
  PLANNER: 'planner',
  RESEARCH_PLAN: 'research_plan',
  GENERATE: 'generate',
  REFLECT: 'reflect',
  RESEARCH_CRITIQUE: 'research_critique',
} as const;

export type NodeName = (typeof NODE_NAMES)[keyof typeof NODE_NAMES];

// Node display metadata (mirrors backend)
export const NODE_META: Record<string, { label: string; color: string; icon: string }> = {
  planner: { label: 'Planner', color: 'indigo', icon: '🗺️' },
  research_plan: { label: 'Research Plan', color: 'violet', icon: '🔍' },
  generate: { label: 'Generate', color: 'sky', icon: '✍️' },
  reflect: { label: 'Reflect', color: 'amber', icon: '🪞' },
  research_critique: { label: 'Research Critique', color: 'rose', icon: '🔬' },
};
