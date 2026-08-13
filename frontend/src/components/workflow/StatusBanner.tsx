/**
 * components/workflow/StatusBanner.tsx
 * Animated status banner showing current workflow state and action buttons.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { formatNode } from '../../lib/utils';
import { cn } from '../../lib/utils';

export function StatusBanner() {
  const { workflowStatus, appStatus, error } = useWorkflowStore();
  const { resumeWorkflow } = useWorkflow();

  const isPolling = appStatus === 'polling' || appStatus === 'starting';
  const isPaused = appStatus === 'paused';
  const isCompleted = appStatus === 'completed';
  const isError = appStatus === 'error';

  return (
    <AnimatePresence mode="wait">
      {/* Error */}
      {isError && error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-red-500/30 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Execution Error</p>
            <p className="text-xs text-red-400/70 mt-0.5 font-mono">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Running / polling */}
      {isPolling && (
        <motion.div
          key="polling"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-indigo-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <p className="text-sm font-semibold text-indigo-300">
              {appStatus === 'starting' ? 'Initializing workflow…' : 'Agent is running…'}
            </p>
          </div>
          {/* Progress animation */}
          <div className="relative h-1.5 bg-surface-600 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-purple-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '40%' }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Polling status every 2s…</p>
        </motion.div>
      )}

      {/* Paused / interrupted */}
      {isPaused && workflowStatus && (
        <motion.div
          key="paused"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-amber-500/30 rounded-xl p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-sm font-semibold text-amber-300">
                  Paused — Awaiting Human Review
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Last: <span className="text-slate-200">{formatNode(workflowStatus.last_node)}</span></span>
                {workflowStatus.next_node && (
                  <>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>Next: <span className="text-amber-300">{formatNode(workflowStatus.next_node)}</span></span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Inspect & edit state below, then resume when ready.
              </p>
            </div>
            <button
              onClick={resumeWorkflow}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold',
                'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
                'text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
                'transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0'
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          </div>
        </motion.div>
      )}

      {/* Completed */}
      {isCompleted && workflowStatus && (
        <motion.div
          key="completed"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Workflow Complete!</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {workflowStatus.revision_number} revision(s) • {workflowStatus.step_count} steps
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
