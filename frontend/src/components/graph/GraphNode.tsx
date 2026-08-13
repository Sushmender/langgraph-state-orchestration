/**
 * components/graph/GraphNode.tsx
 * Custom ReactFlow node for LangGraph HITL nodes.
 */
import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NodeData extends Record<string, unknown> {
  label: string;
  description: string;
  hitl_note: string;
  isActive: boolean;
  isNext: boolean;
  isCompleted: boolean;
}

type GraphNodeType = Node<NodeData, 'hitlNode'>;

export const GraphNode = memo(({ data }: NodeProps<GraphNodeType>) => {
  const d = data;

  const ICON: Record<string, string> = {
    Planner: '🗺️',
    'Research Plan': '🔍',
    Generate: '✍️',
    Reflect: '🪞',
    'Research Critique': '🔬',
  };

  return (
    <motion.div
      className={cn(
        'relative px-3 py-2.5 rounded-xl border-2 min-w-[110px] max-w-[130px] text-center',
        'transition-all duration-500 cursor-default',
        d.isActive    && 'node-active border-indigo-500',
        d.isCompleted && 'node-completed border-emerald-500',
        d.isNext      && !d.isActive && 'border-amber-500/50 bg-amber-500/5',
        !d.isActive && !d.isCompleted && !d.isNext && 'node-pending border-slate-600'
      )}
      animate={d.isActive ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      title={d.hitl_note || d.description}
    >
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !border-indigo-700 !w-2 !h-2" />
      <Handle type="target" position={Position.Top}  className="!bg-indigo-500 !border-indigo-700 !w-2 !h-2" />

      <div className="text-xl mb-1">{ICON[d.label] ?? '⚙️'}</div>
      <div
        className={cn(
          'text-xs font-semibold leading-tight',
          d.isActive    && 'text-indigo-200',
          d.isCompleted && 'text-emerald-200',
          d.isNext      && !d.isActive && 'text-amber-300',
          !d.isActive && !d.isCompleted && !d.isNext && 'text-slate-500'
        )}
      >
        {d.label}
      </div>

      {/* Active pulse ring */}
      {d.isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-indigo-400"
          animate={{ scale: [1, 1.15], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Status dot */}
      {(d.isActive || d.isCompleted) && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-surface-800',
            d.isActive    && 'bg-indigo-400 animate-pulse',
            d.isCompleted && 'bg-emerald-400'
          )}
        />
      )}

      <Handle type="source" position={Position.Right}  className="!bg-indigo-500 !border-indigo-700 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !border-indigo-700 !w-2 !h-2" />
    </motion.div>
  );
});

GraphNode.displayName = 'GraphNode';
