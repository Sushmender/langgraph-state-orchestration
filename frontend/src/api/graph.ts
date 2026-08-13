/**
 * api/graph.ts
 * Typed wrappers for /api/graph/* endpoints.
 */
import { apiClient } from './client';
import type { GraphSchemaResponse, GraphConfigResponse } from '../types/api';

export const graphApi = {
  /** GET /api/graph/schema */
  getSchema: () =>
    apiClient.get<GraphSchemaResponse>('/api/graph/schema').then((r) => r.data),

  /** GET /api/graph/config */
  getConfig: () =>
    apiClient.get<GraphConfigResponse>('/api/graph/config').then((r) => r.data),
};
