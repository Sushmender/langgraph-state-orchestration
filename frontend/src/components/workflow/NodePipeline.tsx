/**
 * components/workflow/NodePipeline.tsx
 * Horizontal step progress visualization showing the 5-node pipeline.
 */
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn } from '../../lib/utils';

const PIPELINE = [
  { id: 'planner',          label: 'Planner',          icon: '🗺️' },
  { id: 'research_plan',    label: 'Research',          icon: '🔍' },
  { id: 'generate',         label: 'Generate',          icon: '✍️' },
  { id: 'reflect',          label: 'Reflect',           icon: '🪞' },
  { id: 'research_critique',label: 'Research Crit.',    icon: '🔬' },
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

  if (appStatus === 'completed') {
    return thisIdx <= lastIdx ? 'completed' : 'pending';
  }
  if (nodeId === lastNode) return nextNode ? 'active' : 'completed';
  if (thisIdx < lastIdx) return 'completed';
  if (nodeId === nextNode && (appStatus === 'polling' || appStatus === 'starting')) return 'active';
  return 'pending';
}

export function NodePipeline() {
  const { workflowStatus, appStatus } = useWorkflowStore();
  const lastNode = workflowStatus?.last_node ?? null;
  const nextNode = workflowStatus?.next_node ?? null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-0">
        {PIPELINE.map((node, i) => {
          const status = getNodeStatus(node.id, lastNode, nextNode, appStatus);
          return (
            <div key={node.id} className="flex items-center flex-1 min-w-0">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-xl border-2 flex items-center justify-center text-base transition-all duration-500',
                    status === 'active'    && 'node-active border-[#7a1128]',
                    status === 'completed' && 'node-completed border-emerald-500',
                    status === 'pending'   && 'node-pending border-[#2e1f1f]'
                  )}
                  animate={status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : status === 'active' && (appStatus === 'polling' || appStatus === 'starting') ? (
                    <Loader2 className="w-4 h-4 text-[#9c1a37] animate-spin" />
                  ) : (
                    <span className="text-base leading-none">{node.icon}</span>
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight max-w-[60px] truncate',
                    status === 'active'    && 'text-[#9c1a37]',
                    status === 'completed' && 'text-emerald-300',
                    status === 'pending'   && 'text-[#5a4a48]'
                  )}
                >
                  {node.label}
                </span>
              </div>

              {/* Connector line */}
              {i < PIPELINE.length - 1 && (
                <div className="flex-1 mx-1 mt-[-14px]">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-all duration-700',
                      status === 'completed' ? 'bg-emerald-500/60' : 'bg-[#2e1f1f]'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
