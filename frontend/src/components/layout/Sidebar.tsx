/**
 * components/layout/Sidebar.tsx
 * Left sidebar — thread list + new workflow button.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { cn, shortId } from '../../lib/utils';

interface Props {
  onNewWorkflow: () => void;
}

export function Sidebar({ onNewWorkflow }: Props) {
  const { threads, activeThreadId } = useWorkflowStore();
  const { switchThread, deleteThread } = useWorkflow();

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-indigo-500/10 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Threads
          </h2>
          <span className="text-xs text-slate-600 bg-surface-700 px-2 py-0.5 rounded-full">
            {threads.length}
          </span>
        </div>
        <button
          onClick={onNewWorkflow}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
            bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
            text-white text-xs font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25
            hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <AnimatePresence>
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-600">No threads yet</p>
              <p className="text-xs text-slate-700 mt-1">Start a workflow above</p>
            </div>
          ) : (
            threads.map((threadId, i) => (
              <motion.div
                key={threadId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                  activeThreadId === threadId
                    ? 'bg-indigo-500/15 border border-indigo-500/30 glow-indigo'
                    : 'hover:bg-white/5 border border-transparent'
                )}
                onClick={() => switchThread(threadId)}
              >
                {activeThreadId === threadId ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                )}
                <span
                  className={cn(
                    'font-mono text-xs flex-1 truncate',
                    activeThreadId === threadId ? 'text-indigo-300' : 'text-slate-400'
                  )}
                >
                  {shortId(threadId)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteThread(threadId); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20
                    text-slate-600 hover:text-red-400 transition-all"
                  title="Delete thread"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-slate-600 text-center">
          SQLite • Persistent
        </p>
      </div>
    </aside>
  );
}
