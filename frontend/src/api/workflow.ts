/**
 * api/workflow.ts
 * Typed wrappers for all /api/workflow/* endpoints.
 */
import { apiClient } from './client';
import type {
  StartWorkflowRequest,
  UpdateStateRequest,
  WorkflowStatus,
  StateValues,
  InterruptOptionsResponse,
} from '../types/api';

export const workflowApi = {
  /** POST /api/workflow/start */
  start: (body: StartWorkflowRequest) =>
    apiClient.post<WorkflowStatus>('/api/workflow/start', body).then((r) => r.data),

  /** POST /api/workflow/resume */
  resume: (thread_id: string) =>
    apiClient.post<WorkflowStatus>('/api/workflow/resume', { thread_id }).then((r) => r.data),

  /** GET /api/workflow/{thread_id}/status */
  getStatus: (thread_id: string) =>
    apiClient.get<WorkflowStatus>(`/api/workflow/${thread_id}/status`).then((r) => r.data),

  /** GET /api/workflow/{thread_id}/state */
  getState: (thread_id: string) =>
    apiClient.get<StateValues>(`/api/workflow/${thread_id}/state`).then((r) => r.data),

  /** PATCH /api/workflow/{thread_id}/state */
  updateState: (thread_id: string, body: UpdateStateRequest) =>
    apiClient
      .patch<WorkflowStatus>(`/api/workflow/${thread_id}/state`, body)
      .then((r) => r.data),

  /** GET /api/workflow/interrupt-options */
  getInterruptOptions: () =>
    apiClient.get<InterruptOptionsResponse>('/api/workflow/interrupt-options').then((r) => r.data),
};
