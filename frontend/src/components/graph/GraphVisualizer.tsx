import { useMemo } from 'react';
import {
  ReactFlow, Background, Controls, BackgroundVariant,
  type Node, type Edge, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GraphNode } from './GraphNode.tsx';

const nodeTypes = { hitlNode: GraphNode };

// Node positions (all rectangles: 130x50 px)
// The triangle LOOP (Generate/Reflect/ResearchCritique) is formed by edge routing:
//   generate(bottom) -> reflect(top)   : diagonal down-right
//   reflect(left)    -> rc(right)      : horizontal left
//   rc(top)          -> generate(bottom): diagonal up-right
const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
  planner: { x: 20, y: 80 },
  researcher: { x: 250, y: 80 },
  generate: { x: 130, y: 200 },
  done: { x: 420, y: 200 },
  reflect: { x: 300, y: 375 },
  research_critique: { x: 0, y: 375 },
};

// Edge handle routing — key: "sourceId->targetId"
const HANDLE_MAP: Record<string, { sh: string; th: string }> = {
  'planner->researcher': { sh: 'source-right', th: 'target-left' },
  'researcher->generate': { sh: 'source-right', th: 'target-top' },
  'generate->done': { sh: 'source-right', th: 'target-left' },
  'generate->reflect': { sh: 'source-bottom', th: 'target-top' },
  'reflect->research_critique': { sh: 'source-left', th: 'target-right' },
  'research_critique->generate': { sh: 'source-top', th: 'target-bottom' },
};

// Edge stroke colours
const GREEN_STYLE = { stroke: '#3d8c5e', strokeWidth: 1.8 };
const BROWN_STYLE = { stroke: '#9a4523', strokeWidth: 1.8 };
const DONE_STYLE = { stroke: '#3b82f6', strokeWidth: 1.8 };
const COND_STYLE = { stroke: '#f59e0b', strokeWidth: 1.8, strokeDasharray: '5 3' };

// Condition label normaliser — keyed by "from→to"
const COND_LABELS: Record<string, string> = {
  'generate→reflect': 'max revision',
  'research_critique→generate': 'revise',
};
function normalizeLabel(from: string, to: string): string | undefined {
  return COND_LABELS[`${from}→${to}`];
}

export function GraphVisualizer() {
  const { graphSchema, workflowStatus, appStatus } = useWorkflowStore();

  const nodes: Node[] = useMemo(() => {
    const rawList = graphSchema?.nodes ?? [
      { id: 'planner', label: 'Planner', description: '', hitl_note: '' },
      { id: 'researcher', label: 'Researcher', description: '', hitl_note: '' },
      { id: 'generate', label: 'Generate', description: '', hitl_note: '' },
      { id: 'done', label: 'Done', description: 'Workflow complete', hitl_note: '' },
      { id: 'reflect', label: 'Reflect', description: '', hitl_note: '' },
      { id: 'research_critique', label: 'Research Critique', description: '', hitl_note: '' },
    ];

    // Alias research_plan → researcher for backends that still use the old id
    const nodeList = rawList.map((n) =>
      n.id === 'research_plan' ? { ...n, id: 'researcher', label: 'Researcher' } : n
    );

    // Always ensure a 'done' node exists
    if (!nodeList.some((n) => n.id === 'done')) {
      nodeList.push({ id: 'done', label: 'Done', description: 'Workflow complete', hitl_note: '' });
    }

    const order = ['planner', 'researcher', 'generate', 'reflect', 'research_critique', 'done'];

    return nodeList.map((n) => ({
      id: n.id,
      type: 'hitlNode',
      position: BASE_POSITIONS[n.id] ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        description: n.description,
        hitl_note: n.hitl_note,
        isActive: appStatus === 'completed' ? n.id === 'done' : workflowStatus?.last_node === n.id,
        isNext: workflowStatus?.next_node === n.id,
        isCompleted: (() => {
          const lastIdx = order.indexOf(workflowStatus?.last_node ?? '');
          const thisIdx = order.indexOf(n.id);
          return appStatus === 'completed'
            ? thisIdx <= lastIdx
            : thisIdx < lastIdx;
        })(),
      },
      draggable: false,
    }));
  }, [graphSchema, workflowStatus, appStatus]);

  const edges: Edge[] = useMemo(() => {
    const rawEdges = graphSchema?.edges ?? [
      { from: 'planner', to: 'researcher', type: 'fixed' },
      { from: 'researcher', to: 'generate', type: 'fixed' },
      { from: 'generate', to: 'done', type: 'fixed' },
      { from: 'generate', to: 'reflect', type: 'conditional', condition: 'max_revision' },
      { from: 'reflect', to: 'research_critique', type: 'fixed' },
      { from: 'research_critique', to: 'generate', type: 'conditional', condition: 'revise' },
    ];

    // Normalise ids from older backend schemas
    const edgeList = rawEdges.map((e) => ({
      ...e,
      from: e.from === 'research_plan' ? 'researcher' : e.from,
      to: e.to === '__end__' ? 'done' :
        e.to === 'research_plan' ? 'researcher' : e.to,
    }));

    return edgeList.map((e, i) => {
      const isDone = e.to === 'done';
      const isCond = !isDone && e.type === 'conditional';

      const brownPair = ['reflect', 'research_critique'];
      const style = isDone
        ? DONE_STYLE
        : isCond
          ? COND_STYLE
          : brownPair.includes(e.to) || brownPair.includes(e.from)
            ? BROWN_STYLE
            : GREEN_STYLE;

      const handles = HANDLE_MAP[`${e.from}->${e.to}`]
        ?? { sh: 'source-right', th: 'target-left' };

      const condLabel = isCond ? normalizeLabel(e.from, e.to) : undefined;

      return {
        id: `e-${i}`,
        source: e.from,
        target: e.to,
        sourceHandle: handles.sh,
        targetHandle: handles.th,
        type: 'straight',
        style,
        label: condLabel,
        labelStyle: {
          fill: '#ffffff',
          fontSize: 11,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
        },
        labelBgStyle: {
          fill: isCond ? 'rgba(40,25,0,0.94)' : 'rgba(10,20,10,0.94)',
          rx: 5,
        },
        labelBgPadding: [8, 5] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDone ? '#3b82f6' : isCond ? '#f59e0b' : style.stroke,
          width: 16,
          height: 16,
        },
      };
    });
  }, [graphSchema]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.38 }}
        defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
        minZoom={0.4}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.1} color="#1a1a1a" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
