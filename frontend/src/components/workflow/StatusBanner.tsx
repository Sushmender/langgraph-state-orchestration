/**
 * components/workflow/StatusBanner.tsx
 * Animated status banner showing current workflow state and action buttons.
 * Includes an embedded compact pipeline mini-strip (replaces separate NodePipeline).
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, AlertCircle, Loader2, ArrowRight, Check } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { formatNode } from '../../lib/utils';
import { cn } from '../../lib/utils';

const PIPELINE = [
  { id: 'planner',           label: 'Planner',    icon: '🗺️' },
  { id: 'research_plan',     label: 'Research',   icon: '🔍' },
  { id: 'generate',          label: 'Generate',   icon: '✍️' },
  { id: 'reflect',           label: 'Reflect',    icon: '🪞' },
  { id: 'research_critique', label: 'Critique',   icon: '🔬' },
];

type NodeStatus = 'pending' | 'active' | 'completed';

function getNodeStatus(
  nodeId: string,
  lastNode: string | null,
  nextNode: string | null,
  appStatus: string
): NodeStatus {
  const order = PIPELINE.map((n) => n.id);
  const lastIdx = order.indexOf(lastNode ?? '');
  const thisIdx = order.indexOf(nodeId);
  if (appStatus === 'completed') return thisIdx <= lastIdx ? 'completed' : 'pending';
  if (nodeId === lastNode) return nextNode ? 'active' : 'completed';
  if (thisIdx < lastIdx) return 'completed';
  if (nodeId === nextNode && (appStatus === 'polling' || appStatus === 'starting')) return 'active';
  return 'pending';
}

/** Compact dot-based inline pipeline strip */
function MiniPipeline() {
  const { workflowStatus, appStatus } = useWorkflowStore();
  const lastNode = workflowStatus?.last_node ?? null;
  const nextNode = workflowStatus?.next_node ?? null;

  return (
    <div className="flex items-center gap-1 mt-2">
      {PIPELINE.map((node, i) => {
        const status = getNodeStatus(node.id, lastNode, nextNode, appStatus);
        return (
          <div key={node.id} className="flex items-center gap-1">
            {/* Dot */}
            <motion.div
              title={node.label}
              className={cn(
                'w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border transition-all duration-500',
                status === 'active'    && 'bg-[#7a1128]/30 border-[#7a1128] text-[#e8e0da]',
                status === 'completed' && 'bg-emerald-500/20 border-emerald-500 text-emerald-300',
                status === 'pending'   && 'bg-[#1c1414] border-[#2e1f1f] text-[#5a4a48]'
              )}
              animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {status === 'completed'
                ? <Check className="w-2.5 h-2.5" />
                : status === 'active' && (appStatus === 'polling' || appStatus === 'starting')
                  ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  : <span>{node.icon}</span>
              }
            </motion.div>
            {/* Connector */}
            {i < PIPELINE.length - 1 && (
              <div className={cn(
                'w-4 h-px rounded-full transition-all duration-700',
                status === 'completed' ? 'bg-emerald-500/50' : 'bg-[#2e1f1f]'
              )} />
            )}
          </div>
        );
      })}
      {/* Node label hint */}
      {lastNode && (
        <span className="ml-2 text-[10px] text-[#5a4a48] font-mono">
          @ {formatNode(lastNode)}
        </span>
      )}
    </div>
  );
}

export function StatusBanner() {
  const { workflowStatus, appStatus, error } = useWorkflowStore();
  const { resumeWorkflow } = useWorkflow();

  const isPolling   = appStatus === 'polling' || appStatus === 'starting';
  const isPaused    = appStatus === 'paused';
  const isCompleted = appStatus === 'completed';
  const isError     = appStatus === 'error';

  return (
    <AnimatePresence mode="wait">

      {/* ── Error ─────────────────────────────────────────────── */}
      {isError && error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-red-500/30 rounded-xl p-4 flex items-start gap-3 mb-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Execution Error</p>
            <p className="text-xs text-red-400/70 mt-0.5 font-mono">{error}</p>
          </div>
        </motion.div>
      )}

      {/* ── Running / polling ─────────────────────────────────── */}
      {isPolling && (
        <motion.div
          key="polling"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-[rgba(122,17,40,0.3)] rounded-xl p-3 mb-3"
        >
          <div className="flex items-center gap-3 mb-1">
            <Loader2 className="w-4 h-4 text-[#9c1a37] animate-spin flex-shrink-0" />
            <p className="text-sm font-semibold text-[#9c1a37]">
              {appStatus === 'starting' ? 'Initialising workflow…' : 'Agent is running…'}
            </p>
            {/* Shimmer progress bar */}
            <div className="flex-1 relative h-1 bg-surface-600 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-[#7a1128] rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: '40%' }}
              />
            </div>
          </div>
          <MiniPipeline />
        </motion.div>
      )}

      {/* ── Paused / interrupted ──────────────────────────────── */}
      {isPaused && workflowStatus && (
        <motion.div
          key="paused"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-amber-500/30 rounded-xl p-3 mb-3"
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
              <MiniPipeline />
            </div>
            <button
              onClick={resumeWorkflow}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold flex-shrink-0',
                'bg-[#7a1128] hover:bg-[#9c1a37]',
                'text-[#e8e0da] shadow-lg shadow-[#7a1128]/25 hover:shadow-[#7a1128]/40',
                'transition-all duration-200 hover:scale-105 active:scale-95'
              )}
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Completed ─────────────────────────────────────────── */}
      {isCompleted && workflowStatus && (
        <motion.div
          key="completed"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass border border-emerald-500/30 rounded-xl p-3 mb-3"
        >
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Workflow Complete!</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {workflowStatus.revision_number} revision(s) · {workflowStatus.step_count} steps
              </p>
            </div>
          </div>
          <MiniPipeline />
        </motion.div>
      )}

    </AnimatePresence>
  );
}
