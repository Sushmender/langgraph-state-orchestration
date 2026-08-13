/**
 * api/client.ts
 * Base axios instance pointing to the FastAPI backend.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // 2 min — LLM calls can be slow
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.detail ??
      err.response?.data?.error ??
      err.message ??
      'Unknown error';
    return Promise.reject(new Error(msg));
  }
);
