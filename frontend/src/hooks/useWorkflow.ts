/**
 * hooks/useWorkflow.ts
 * Main hook orchestrating all workflow operations with loading states
 * and 2-second polling during LLM execution.
 */
import { useCallback, useEffect, useRef } from 'react';
import { workflowApi } from '../api/workflow';
import { historyApi } from '../api/history';
import { graphApi } from '../api/graph';
import { useWorkflowStore } from '../stores/workflowStore';
import type { StartWorkflowRequest, UpdateStateRequest, TimeTravelRequest } from '../types/api';

export function useWorkflow() {
  const store = useWorkflowStore();
  const pollingRef = useRef<number | null>(null);

  // ── Stop polling ────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ── Poll status every 2s while running ────────────────────────────────────
  const startPolling = useCallback(
    (thread_id: string) => {
      stopPolling();
      pollingRef.current = window.setInterval(async () => {
        try {
          const status = await workflowApi.getStatus(thread_id);
          store.setWorkflowStatus(status);
          if (status.status !== 'running') {
            stopPolling();
            store.setAppStatus(
              status.status === 'completed' ? 'completed' : 'paused'
            );
            // Refresh full state & history on pause/complete
            const [values, hist] = await Promise.all([
              workflowApi.getState(thread_id),
              historyApi.getHistory(thread_id),
            ]);
            store.setStateValues(values);
            store.setHistory(hist.snapshots);
          }
        } catch {
          stopPolling();
        }
      }, 2000);
    },
    [store, stopPolling]
  );

  // ── Load graph schema once ───────────────────────────────────────────────
  const loadGraphSchema = useCallback(async () => {
    try {
      const schema = await graphApi.getSchema();
      store.setGraphSchema(schema);
    } catch {
      /* non-critical */
    }
  }, [store]);

  // ── Load threads list ────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    try {
      const res = await historyApi.listThreads();
      store.setThreads(res.threads);
    } catch {
      /* ignore */
    }
  }, [store]);

  // ── Switch active thread ─────────────────────────────────────────────────
  const switchThread = useCallback(
    async (thread_id: string) => {
      stopPolling();
      store.setActiveThread(thread_id);
      store.setAppStatus('paused');
      store.setError(null);
      try {
        const [status, values, hist] = await Promise.all([
          workflowApi.getStatus(thread_id),
          workflowApi.getState(thread_id),
          historyApi.getHistory(thread_id),
        ]);
        store.setWorkflowStatus(status);
        store.setStateValues(values);
        store.setHistory(hist.snapshots);
        store.setAppStatus(status.status === 'completed' ? 'completed' : 'paused');
      } catch (e: unknown) {
        store.setError((e as Error).message);
        store.setAppStatus('error');
      }
    },
    [store, stopPolling]
  );

  // ── Start workflow ────────────────────────────────────────────────────────
  const startWorkflow = useCallback(
    async (req: StartWorkflowRequest) => {
      stopPolling();
      store.setAppStatus('starting');
      store.setError(null);
      store.setStateValues(null);
      store.setHistory([]);
      try {
        const status = await workflowApi.start(req);
        store.setWorkflowStatus(status);
        store.setActiveThread(status.thread_id);
        store.addThread({ thread_id: status.thread_id, task: req.task });

        if (status.status === 'interrupted') {
          store.setAppStatus('paused');
          const [values, hist] = await Promise.all([
            workflowApi.getState(status.thread_id),
            historyApi.getHistory(status.thread_id),
          ]);
          store.setStateValues(values);
          store.setHistory(hist.snapshots);
        } else if (status.status === 'completed') {
          store.setAppStatus('completed');
          const [values, hist] = await Promise.all([
            workflowApi.getState(status.thread_id),
            historyApi.getHistory(status.thread_id),
          ]);
          store.setStateValues(values);
          store.setHistory(hist.snapshots);
        } else {
          store.setAppStatus('polling');
          startPolling(status.thread_id);
        }
      } catch (e: unknown) {
        store.setError((e as Error).message);
        store.setAppStatus('error');
      }
    },
    [store, stopPolling, startPolling]
  );

  // ── Resume workflow ───────────────────────────────────────────────────────
  const resumeWorkflow = useCallback(async () => {
    const thread_id = store.activeThreadId;
    if (!thread_id) return;
    stopPolling();
    store.setAppStatus('polling');
    store.setError(null);
    try {
      // Fire resume (blocking) then poll while running
      const status = await workflowApi.resume(thread_id);
      store.setWorkflowStatus(status);

      if (status.status === 'interrupted') {
        store.setAppStatus('paused');
        const [values, hist] = await Promise.all([
          workflowApi.getState(thread_id),
          historyApi.getHistory(thread_id),
        ]);
        store.setStateValues(values);
        store.setHistory(hist.snapshots);
      } else if (status.status === 'completed') {
        store.setAppStatus('completed');
        const [values, hist] = await Promise.all([
          workflowApi.getState(thread_id),
          historyApi.getHistory(thread_id),
        ]);
        store.setStateValues(values);
        store.setHistory(hist.snapshots);
      } else {
        startPolling(thread_id);
      }
    } catch (e: unknown) {
      store.setError((e as Error).message);
      store.setAppStatus('error');
    }
  }, [store, stopPolling, startPolling]);

  // ── Accept current draft — skip remaining revisions ───────────────────────────────────
  const acceptWorkflow = useCallback(async () => {
    const thread_id = store.activeThreadId;
    if (!thread_id) return;
    stopPolling();
    store.setAppStatus('polling');
    store.setError(null);
    try {
      const status = await workflowApi.accept(thread_id);
      store.setWorkflowStatus(status);
      store.setAppStatus('completed');
      const [values, hist] = await Promise.all([
        workflowApi.getState(thread_id),
        historyApi.getHistory(thread_id),
      ]);
      store.setStateValues(values);
      store.setHistory(hist.snapshots);
    } catch (e: unknown) {
      store.setError((e as Error).message);
      store.setAppStatus('error');
    }
  }, [store, stopPolling]);

  // ── Update state field ────────────────────────────────────────────────────
  const updateStateField = useCallback(
    async (req: UpdateStateRequest) => {
      const thread_id = store.activeThreadId;
      if (!thread_id) return;
      store.setError(null);
      try {
        const status = await workflowApi.updateState(thread_id, req);
        store.setWorkflowStatus(status);
        const values = await workflowApi.getState(thread_id);
        store.setStateValues(values);
        store.closeEditModal();
      } catch (e: unknown) {
        store.setError((e as Error).message);
      }
    },
    [store]
  );

  // ── Time travel ───────────────────────────────────────────────────────────
  const timeTravel = useCallback(
    async (req: TimeTravelRequest) => {
      const thread_id = store.activeThreadId;
      if (!thread_id) return;
      store.setError(null);
      try {
        const status = await historyApi.timeTravel(thread_id, req);
        store.setWorkflowStatus(status);
        store.setAppStatus('paused');
        const [values, hist] = await Promise.all([
          workflowApi.getState(thread_id),
          historyApi.getHistory(thread_id),
        ]);
        store.setStateValues(values);
        store.setHistory(hist.snapshots);
        store.closeTimeTravelModal();
      } catch (e: unknown) {
        store.setError((e as Error).message);
      }
    },
    [store]
  );

  // ── Delete thread ─────────────────────────────────────────────────────────
  const deleteThread = useCallback(
    async (thread_id: string) => {
      try {
        await historyApi.deleteThread(thread_id);
        store.removeThread(thread_id);
        if (store.activeThreadId === thread_id) {
          store.setActiveThread(null);
          store.setWorkflowStatus(null);
          store.setStateValues(null);
          store.setHistory([]);
          store.setAppStatus('idle');
        }
      } catch (e: unknown) {
        store.setError((e as Error).message);
      }
    },
    [store]
  );

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    store,
    loadGraphSchema,
    loadThreads,
    switchThread,
    startWorkflow,
    resumeWorkflow,
    acceptWorkflow,
    updateStateField,
    timeTravel,
    deleteThread,
  };
}
