/**
 * components/graph/GraphNode.tsx
 * Custom ReactFlow node for LangGraph HITL nodes.
 * Improvements: wider boxes (150px), larger icon (2xl), larger label (sm),
 * styled hover tooltip instead of browser title.
 */
import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [hovered, setHovered] = useState(false);

  const ICON: Record<string, string> = {
    Planner: '🗺️',
    'Research Plan': '🔍',
    Generate: '✍️',
    Reflect: '🪞',
    'Research Critique': '🔬',
  };

  const tooltipText = d.hitl_note || d.description;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className={cn(
          'relative px-4 py-3 rounded-xl border-2 min-w-[150px] max-w-[160px] text-center',
          'transition-all duration-500 cursor-default select-none',
          d.isActive    && 'node-active border-[#7a1128]',
          d.isCompleted && 'node-completed border-emerald-500',
          d.isNext      && !d.isActive && 'border-amber-500/50 bg-amber-500/5',
          !d.isActive && !d.isCompleted && !d.isNext && 'node-pending border-[#2e1f1f]'
        )}
        animate={d.isActive ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Handle type="target" position={Position.Left}  className="!bg-[#7a1128] !border-[#5e0d1f] !w-2.5 !h-2.5" />
        <Handle type="target" position={Position.Top}   className="!bg-[#7a1128] !border-[#5e0d1f] !w-2.5 !h-2.5" />

        {/* Icon */}
        <div className="text-2xl mb-1.5 leading-none">{ICON[d.label] ?? '⚙️'}</div>

        {/* Label */}
        <div
          className={cn(
            'text-sm font-semibold leading-snug',
            d.isActive    && 'text-[#e8e0da]',
            d.isCompleted && 'text-emerald-200',
            d.isNext      && !d.isActive && 'text-amber-300',
            !d.isActive && !d.isCompleted && !d.isNext && 'text-[#8f7f7c]'
          )}
        >
          {d.label}
        </div>

        {/* Active pulse ring */}
        {d.isActive && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#9c1a37]"
            animate={{ scale: [1, 1.18], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}

        {/* Status dot */}
        {(d.isActive || d.isCompleted) && (
          <div
            className={cn(
              'absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 border-surface-800',
              d.isActive    && 'bg-[#7a1128] animate-pulse',
              d.isCompleted && 'bg-emerald-400'
            )}
          />
        )}

        <Handle type="source" position={Position.Right}  className="!bg-[#7a1128] !border-[#5e0d1f] !w-2.5 !h-2.5" />
        <Handle type="source" position={Position.Bottom} className="!bg-[#7a1128] !border-[#5e0d1f] !w-2.5 !h-2.5" />
      </motion.div>

      {/* Styled hover tooltip */}
      <AnimatePresence>
        {hovered && tooltipText && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div className="bg-[#1c1414] border border-[rgba(122,17,40,0.35)] rounded-xl px-3 py-2
              text-xs text-[#e8e0da] max-w-[220px] text-center shadow-xl leading-relaxed">
              {tooltipText}
            </div>
            {/* Caret */}
            <div className="w-0 h-0 mx-auto border-l-[6px] border-r-[6px] border-t-[6px]
              border-l-transparent border-r-transparent border-t-[#1c1414]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GraphNode.displayName = 'GraphNode';
