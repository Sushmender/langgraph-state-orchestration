/**
 * components/history/HistoryTimeline.tsx
 * Right panel — vertical timeline of all checkpoints with fork buttons.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, GitFork, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn, shortId, formatNode } from '../../lib/utils';

const NODE_DOT_COLOR: Record<string, string> = {
  planner:           'bg-[#7a1128]',
  research_plan:     'bg-violet-500',
  generate:          'bg-sky-500',
  reflect:           'bg-amber-500',
  research_critique: 'bg-rose-500',
};

export function HistoryTimeline() {
  const { history, activeThreadId, openTimeTravelModal } = useWorkflowStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!activeThreadId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Clock className="w-10 h-10 text-[#3a2626] mb-3" />
        <p className="text-xs text-[#5a4a48]">Select a thread to view history</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Clock className="w-8 h-8 text-[#3a2626] mb-2 animate-pulse" />
        <p className="text-xs text-[#5a4a48]">No checkpoints yet</p>
        <p className="text-xs text-[#3a2626] mt-1">Run the workflow to see history</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-[#8f7f7c] uppercase tracking-widest">History</h2>
          <span className="text-xs text-[#5a4a48] bg-surface-700 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-4 bottom-4 w-px bg-[#2e1f1f]" />

          <AnimatePresence>
            <div className="space-y-2">
              {history.map((snap, i) => {
                const isExpanded = expandedId === snap.checkpoint_id;
                const dotColor = NODE_DOT_COLOR[snap.last_node ?? ''] ?? 'bg-slate-500';

                return (
                  <motion.div
                    key={snap.checkpoint_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative pl-10"
                  >
                    {/* Dot */}
                    <div className={cn(
                      'absolute left-3.5 top-3.5 w-3 h-3 rounded-full border-2 border-surface-800 z-10',
                      dotColor,
                      i === 0 && 'ring-2 ring-offset-1 ring-offset-surface-800 ring-[rgba(122,17,40,0.4)]'
                    )} />

                    {/* Card */}
                    <div className={cn(
                      'glass rounded-xl border overflow-hidden transition-all duration-200',
                      i === 0 ? 'border-[rgba(122,17,40,0.2)]' : 'border-[rgba(122,17,40,0.08)]'
                    )}>
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/3 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : snap.checkpoint_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {i === 0 && (
                              <span className="text-[9px] font-bold text-[#9c1a37] bg-[#7a1128]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Latest
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#e8e0da] truncate">
                              {formatNode(snap.last_node)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#5a4a48] min-w-0">
                            <span className="flex-shrink-0">Step {snap.step}</span>
                            <span className="flex-shrink-0">·</span>
                            <span className="flex-shrink-0">Rev {snap.revision_number}</span>
                            <span className="flex-shrink-0">·</span>
                            <span className="font-mono text-[10px] truncate">{shortId(snap.checkpoint_id)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); openTimeTravelModal(snap); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold
                              bg-[#7a1128]/10 border border-[rgba(122,17,40,0.2)] text-[#9c1a37]
                              hover:bg-[#7a1128]/20 transition-colors"
                            title="Fork from this checkpoint"
                          >
                            <GitFork className="w-2.5 h-2.5" />
                            Fork
                          </button>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#5a4a48]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#5a4a48]" />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-white/5"
                          >
                            <div className="px-3 py-3 space-y-2">
                              {snap.values.plan && (
                                <div>
                                  <p className="text-[10px] text-[#5a4a48] font-semibold mb-1">Plan</p>
                                  <p className="text-xs text-[#8f7f7c] line-clamp-3">{snap.values.plan}</p>
                                </div>
                              )}
                              {snap.values.draft && (
                                <div>
                                  <p className="text-[10px] text-[#5a4a48] font-semibold mb-1">Draft Preview</p>
                                  <p className="text-xs text-[#8f7f7c] line-clamp-3">{snap.values.draft}</p>
                                </div>
                              )}
                              {snap.next_node && (
                                <p className="text-xs text-amber-400/60">Next: {formatNode(snap.next_node)}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
