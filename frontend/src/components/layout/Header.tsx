/**
 * components/layout/Header.tsx
 * Top navigation bar with status badge and active thread info.
 */
import { motion } from 'framer-motion';
import { Activity, Cpu, GitBranch } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn, shortId, formatNode } from '../../lib/utils';

const STATUS_CONFIG = {
  idle:      { label: 'Idle',      color: 'text-slate-400',  dot: 'bg-slate-500' },
  starting:  { label: 'Starting…', color: 'text-indigo-400', dot: 'bg-indigo-500 animate-pulse' },
  polling:   { label: 'Running…',  color: 'text-sky-400',    dot: 'bg-sky-500 animate-pulse' },
  paused:    { label: 'Paused',    color: 'text-amber-400',  dot: 'bg-amber-500' },
  resumed:   { label: 'Resumed',   color: 'text-indigo-400', dot: 'bg-indigo-500 animate-pulse' },
  completed: { label: 'Completed', color: 'text-emerald-400',dot: 'bg-emerald-500' },
  error:     { label: 'Error',     color: 'text-red-400',    dot: 'bg-red-500' },
};

export function Header() {
  const { appStatus, activeThreadId, workflowStatus } = useWorkflowStore();
  const cfg = STATUS_CONFIG[appStatus];

  return (
    <header className="glass-strong border-b border-indigo-500/20 px-6 py-3 flex items-center justify-between z-50 relative">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-surface-800" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">LangGraph</h1>
          <p className="text-xs text-indigo-400 leading-none mt-0.5">HITL Explorer</p>
        </div>
      </div>

      {/* Center — active thread info */}
      {activeThreadId && workflowStatus && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex items-center gap-4 text-xs text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span className="font-mono text-indigo-300">{shortId(activeThreadId)}</span>
          </span>
          {workflowStatus.last_node && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-600">Last:</span>
              <span className="text-slate-300">{formatNode(workflowStatus.last_node)}</span>
            </span>
          )}
          {workflowStatus.next_node && (
            <span className="flex items-center gap-1.5">
              <span className="text-slate-600">Next:</span>
              <span className="text-amber-300">{formatNode(workflowStatus.next_node)}</span>
            </span>
          )}
          <span className="text-slate-600">
            Rev {workflowStatus.revision_number}/{workflowStatus.revision_number}
          </span>
        </motion.div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500" />
        <div className={cn('flex items-center gap-2 text-xs font-medium', cfg.color)}>
          <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
          {cfg.label}
        </div>
      </div>
    </header>
  );
}
