/**
 * components/layout/Header.tsx
 * Top navigation bar with status badge and active thread info.
 */
import { motion } from 'framer-motion';
import { Activity, Cpu, GitBranch } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn, formatNode } from '../../lib/utils';

const STATUS_CONFIG = {
  idle: { label: 'Idle', color: 'text-[#5a4a48]', dot: 'bg-[#3a2626]' },
  starting: { label: 'Starting…', color: 'text-[#9c1a37]', dot: 'bg-[#7a1128] animate-pulse' },
  polling: { label: 'Running…', color: 'text-[#9c1a37]', dot: 'bg-[#7a1128] animate-pulse' },
  paused: { label: 'Paused', color: 'text-amber-400', dot: 'bg-amber-500' },
  resumed: { label: 'Resumed', color: 'text-[#9c1a37]', dot: 'bg-[#7a1128] animate-pulse' },
  completed: { label: 'Completed', color: 'text-emerald-400', dot: 'bg-emerald-500' },
  error: { label: 'Error', color: 'text-red-400', dot: 'bg-red-500' },
};

export function Header() {
  const { appStatus, activeThreadId, workflowStatus, stateValues, threads } = useWorkflowStore();
  const cfg = STATUS_CONFIG[appStatus];

  const activeThread = threads.find(t => t.thread_id === activeThreadId);
  const taskName = stateValues?.task || activeThread?.task || activeThreadId;

  return (
    <header className="glass-strong border-b border-[rgba(122,17,40,0.18)] px-6 py-3 flex items-center justify-between z-50 relative">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-[#7a1128] flex items-center justify-center shadow-lg">
            <GitBranch className="w-5 h-5 text-[#e8e0da]" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-800" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#e8e0da] leading-none">LangGraph</h1>
          <p className="text-xs text-[#9c1a37] leading-none mt-0.5">HITL Explorer</p>
        </div>
      </div>

      {/* Center — active thread info */}
      {activeThreadId && workflowStatus && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-4 text-xs text-[#e8e0da]"
        >
          <span className="flex items-center gap-1.5 max-w-[400px] truncate" title={taskName || undefined}>
            <Cpu className="w-3 h-3 text-[#9c1a37] flex-shrink-0" />
            <span className="font-mono text-[#9c1a37] truncate">{taskName}</span>
          </span>
          {workflowStatus.last_node && (
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[#8f7f7c]">Last:</span>
              <span className="text-[#e8e0da]">{formatNode(workflowStatus.last_node)}</span>
            </span>
          )}
          {workflowStatus.next_node && (
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[#8f7f7c]">Next:</span>
              <span className="text-amber-300">{formatNode(workflowStatus.next_node)}</span>
            </span>
          )}
          <span className="text-[#8f7f7c] flex-shrink-0">
            Rev {workflowStatus.revision_number}/{stateValues?.max_revisions ?? workflowStatus.revision_number}
          </span>
        </motion.div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#5a4a48]" />
        <div className={cn('flex items-center gap-2 text-xs font-medium', cfg.color)}>
          <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
          {cfg.label}
        </div>
      </div>
    </header>
  );
}
