/**
 * api/history.ts
 * Typed wrappers for history, time-travel, and thread management endpoints.
 */
import { apiClient } from './client';
import type {
  HistoryResponse,
  StateSnapshot,
  TimeTravelRequest,
  ThreadListResponse,
  WorkflowStatus,
} from '../types/api';

export const historyApi = {
  /** GET /api/history/{thread_id} */
  getHistory: (thread_id: string) =>
    apiClient.get<HistoryResponse>(`/api/history/${thread_id}`).then((r) => r.data),

  /** GET /api/history/{thread_id}/snapshot/{checkpoint_id} */
  getSnapshot: (thread_id: string, checkpoint_id: string) =>
    apiClient
      .get<StateSnapshot>(`/api/history/${thread_id}/snapshot/${checkpoint_id}`)
      .then((r) => r.data),

  /** POST /api/history/{thread_id}/time-travel */
  timeTravel: (thread_id: string, body: TimeTravelRequest) =>
    apiClient
      .post<WorkflowStatus>(`/api/history/${thread_id}/time-travel`, body)
      .then((r) => r.data),

  /** GET /api/threads */
  listThreads: () =>
    apiClient.get<ThreadListResponse>('/api/threads').then((r) => r.data),

  /** DELETE /api/threads/{thread_id} */
  deleteThread: (thread_id: string) =>
    apiClient.delete(`/api/threads/${thread_id}`).then((r) => r.data),
};
