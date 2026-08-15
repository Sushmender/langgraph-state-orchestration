/**
 * stores/workflowStore.ts
 * Central Zustand store for the entire application state.
 */
import { create } from 'zustand';
import type {
  WorkflowStatus,
  StateValues,
  GraphSchemaResponse,
  StateSnapshot,
  ThreadInfo,
} from '../types/api';

export type AppStatus = 'idle' | 'starting' | 'polling' | 'paused' | 'resumed' | 'completed' | 'error';

interface WorkflowStore {
  // ── Thread management ──────────────────────────────────────────────────────
  threads: ThreadInfo[];
  activeThreadId: string | null;
  setThreads: (threads: ThreadInfo[]) => void;
  setActiveThread: (id: string | null) => void;
  addThread: (thread: ThreadInfo) => void;
  removeThread: (id: string) => void;

  // ── Workflow state ─────────────────────────────────────────────────────────
  workflowStatus: WorkflowStatus | null;
  stateValues: StateValues | null;
  appStatus: AppStatus;
  error: string | null;
  setWorkflowStatus: (status: WorkflowStatus | null) => void;
  setStateValues: (values: StateValues | null) => void;
  setAppStatus: (status: AppStatus) => void;
  setError: (err: string | null) => void;

  // ── Graph schema ───────────────────────────────────────────────────────────
  graphSchema: GraphSchemaResponse | null;
  setGraphSchema: (schema: GraphSchemaResponse) => void;

  // ── History ────────────────────────────────────────────────────────────────
  history: StateSnapshot[];
  setHistory: (snapshots: StateSnapshot[]) => void;

  // ── UI state ───────────────────────────────────────────────────────────────
  activePanel: 'threads' | 'history' | 'graph' | 'state' | null;
  setActivePanel: (panel: 'threads' | 'history' | 'graph' | 'state' | null) => void;
  activeStateTab: string;
  setActiveStateTab: (tab: string) => void;
  isEditModalOpen: boolean;
  editModalField: string | null;
  openEditModal: (field: string) => void;
  closeEditModal: () => void;
  isTimeTravelModalOpen: boolean;
  timeTravelTarget: StateSnapshot | null;
  openTimeTravelModal: (snapshot: StateSnapshot) => void;
  closeTimeTravelModal: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  // Threads
  threads: [],
  activeThreadId: null,
  setThreads: (threads) => set({ threads }),
  setActiveThread: (id) => set({ activeThreadId: id }),
  addThread: (thread) => set((s) => ({ threads: [...s.threads.filter((t) => t.thread_id !== thread.thread_id), thread] })),
  removeThread: (id) =>
    set((s) => ({
      threads: s.threads.filter((t) => t.thread_id !== id),
      activeThreadId: s.activeThreadId === id ? null : s.activeThreadId,
    })),

  // Workflow
  workflowStatus: null,
  stateValues: null,
  appStatus: 'idle',
  error: null,
  setWorkflowStatus: (status) => set({ workflowStatus: status }),
  setStateValues: (values) => set({ stateValues: values }),
  setAppStatus: (appStatus) => set({ appStatus }),
  setError: (error) => set({ error }),

  // Graph
  graphSchema: null,
  setGraphSchema: (schema) => set({ graphSchema: schema }),

  // History
  history: [],
  setHistory: (snapshots) => set({ history: snapshots }),

  // UI
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  activeStateTab: 'plan',
  setActiveStateTab: (tab) => set({ activeStateTab: tab }),
  isEditModalOpen: false,
  editModalField: null,
  openEditModal: (field) => set({ isEditModalOpen: true, editModalField: field }),
  closeEditModal: () => set({ isEditModalOpen: false, editModalField: null }),
  isTimeTravelModalOpen: false,
  timeTravelTarget: null,
  openTimeTravelModal: (snapshot) => set({ isTimeTravelModalOpen: true, timeTravelTarget: snapshot }),
  closeTimeTravelModal: () => set({ isTimeTravelModalOpen: false, timeTravelTarget: null }),
}));
