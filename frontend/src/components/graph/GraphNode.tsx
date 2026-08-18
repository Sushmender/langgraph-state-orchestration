import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';

interface NodeData extends Record<string, unknown> {
  label: string;
  description: string;
  hitl_note: string;
  isActive: boolean;
  isNext: boolean;
  isCompleted: boolean;
}
type GraphNodeType = Node<NodeData, 'hitlNode'>;

// â”€â”€ Dimensions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Node dimensions (uniform for ALL nodes)
const NW = 130, NH = 50;

// â”€â”€ Theme (all inline to avoid Tailwind purge issues) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface Theme { bg: string; border: string; text: string; ring: string }

function getBaseTheme(label: string): Theme {
  if (label === 'Done')
    return { bg: '#1e3a8a', border: '#3b82f6', text: '#bfdbfe', ring: '#60a5fa' };
  if (label === 'Reflect' || label === 'Research Critique')
    return { bg: '#3b1c10', border: '#9a4523', text: '#f0a880', ring: '#c2714f' };
  // Planner, Researcher, Generate
  return { bg: '#0f2d1e', border: '#2d7a50', text: '#6ee7a0', ring: '#3d8c5e' };
}

function resolveTheme(base: Theme, isActive: boolean, isCompleted: boolean, isNext: boolean): Theme {
  if (isActive) return { ...base, border: 'rgba(255,255,255,0.55)', text: '#ffffff' };
  if (isCompleted) return { ...base, border: '#10b981', text: '#6ee7b7' };
  if (isNext && !isActive) return { ...base, border: 'rgba(245,158,11,0.55)', text: '#fbbf24' };
  return base;
}

// â”€â”€ Invisible handle helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// cx/cy = desired center of the handle dot, relative to the node container.
function Hdl({
  id, type, cx, cy,
}: { id: string; type: 'source' | 'target'; cx: number; cy: number }) {
  return (
    <Handle
      id={id}
      type={type}
      position={Position.Top}          // position prop irrelevant for type:'straight'
      style={{
        position: 'absolute',
        top: cy - 4,                  // half of 8px handle
        left: cx - 4,
        width: 8, height: 8,
        transform: 'none',
        opacity: 0,
        minWidth: 0, minHeight: 0,
        border: 'none', background: 'transparent',
      }}
    />
  );
}

// Single rectangle NodeBox — used for every node
function NodeBox({ d }: { d: NodeData }) {
  const base = getBaseTheme(d.label);
  const theme = resolveTheme(base, d.isActive, d.isCompleted, d.isNext);

  return (
    <motion.div
      style={{
        position: 'relative',
        width: NW, height: NH,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8,
        border: `2px solid ${theme.border}`,
        backgroundColor: theme.bg,
        cursor: 'default', userSelect: 'none',
      }}
      animate={d.isActive ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {d.isActive && (
        <motion.div
          style={{
            position: 'absolute', inset: -2, borderRadius: 10,
            border: `2px solid ${base.ring}`, pointerEvents: 'none',
          }}
          animate={{ scale: [1, 1.14], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* 8 invisible handles — all sides for flexible routing. 
          Outward offsets prevent arrow clipping. Bottom handles spread to prevent overlap. */}
      <Hdl id="target-left" type="target" cx={-4} cy={NH / 2} />
      <Hdl id="source-right" type="source" cx={NW + 4} cy={NH / 2} />
      <Hdl id="target-right" type="target" cx={NW + 4} cy={NH / 2} />
      <Hdl id="source-left" type="source" cx={-4} cy={NH / 2} />

      <Hdl id="target-top" type="target" cx={NW / 2} cy={-4} />
      <Hdl id="source-top" type="source" cx={NW / 2} cy={-4} />

      {/* Spread bottom handles: RC hits bottom-left, Reflect leaves from bottom-right */}
      <Hdl id="target-bottom" type="target" cx={NW / 2 - 20} cy={NH + 5} />
      <Hdl id="source-bottom" type="source" cx={NW / 2 + 20} cy={NH + 5} />

      <span style={{
        fontSize: 11,
        fontWeight: 800,
        color: theme.text,
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        textAlign: 'center',
        paddingInline: 6,
        lineHeight: 1.2,
      }}>
        {d.label}
      </span>
    </motion.div>
  );
}

// ————————————————————————————————— Main export ——————————————————————————————————————————————
export const GraphNode = memo(({ data }: NodeProps<GraphNodeType>) => {
  const d = data;
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const tooltipText = d.hitl_note || d.description;

  return (
    <div
      style={{ position: 'relative', pointerEvents: 'all' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <NodeBox d={d} />

      {/* Hover tooltip - following the mouse cursor */}
      <AnimatePresence>
        {hovered && tooltipText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              top: mousePos.y + 15,
              left: mousePos.x + 15,
              zIndex: 50,
              pointerEvents: 'none',
              width: 'max-content',
            }}
          >
            <div style={{
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              color: '#f3f4f6',
              maxWidth: 220,
              textAlign: 'left',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              lineHeight: 1.4,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              {tooltipText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GraphNode.displayName = 'GraphNode';
