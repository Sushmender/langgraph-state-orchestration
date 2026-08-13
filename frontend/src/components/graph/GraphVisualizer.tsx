/**
 * components/graph/GraphVisualizer.tsx
 * ReactFlow canvas showing the 5-node LangGraph pipeline.
 */
import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../../stores/workflowStore';
import { GraphNode } from './GraphNode.tsx';

const nodeTypes = { hitlNode: GraphNode };

const BASE_POSITIONS: Record<string, { x: number; y: number }> = {
  planner:           { x: 60,  y: 120 },
  research_plan:     { x: 240, y: 120 },
  generate:          { x: 420, y: 120 },
  reflect:           { x: 420, y: 260 },
  research_critique: { x: 240, y: 260 },
};

const EDGE_STYLE = { stroke: '#4f46e5', strokeWidth: 2 };
const COND_STYLE = { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '6 3' };

export function GraphVisualizer() {
  const { graphSchema, workflowStatus, appStatus } = useWorkflowStore();

  const nodes: Node[] = useMemo(() => {
    const nodeList = graphSchema?.nodes ?? [
      { id: 'planner',           label: 'Planner',           description: '', hitl_note: '' },
      { id: 'research_plan',     label: 'Research Plan',     description: '', hitl_note: '' },
      { id: 'generate',          label: 'Generate',          description: '', hitl_note: '' },
      { id: 'reflect',           label: 'Reflect',           description: '', hitl_note: '' },
      { id: 'research_critique', label: 'Research Critique', description: '', hitl_note: '' },
    ];

    return nodeList.map((n) => ({
      id: n.id,
      type: 'hitlNode',
      position: BASE_POSITIONS[n.id] ?? { x: 0, y: 0 },
      data: {
        label: n.label,
        description: n.description,
        hitl_note: n.hitl_note,
        isActive: workflowStatus?.last_node === n.id,
        isNext: workflowStatus?.next_node === n.id,
        isCompleted: (() => {
          const order = ['planner','research_plan','generate','reflect','research_critique'];
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
    const edgeList = graphSchema?.edges ?? [
      { from: 'planner',           to: 'research_plan',     type: 'fixed' },
      { from: 'research_plan',     to: 'generate',          type: 'fixed' },
      { from: 'generate',          to: 'reflect',           type: 'conditional', condition: 'revision ≤ max' },
      { from: 'generate',          to: '__end__',           type: 'conditional', condition: 'revision > max' },
      { from: 'reflect',           to: 'research_critique', type: 'fixed' },
      { from: 'research_critique', to: 'generate',          type: 'fixed' },
    ];

    return edgeList
      .filter((e) => e.to !== '__end__')
      .map((e, i) => ({
        id: `e-${i}`,
        source: e.from,
        target: e.to,
        type: 'smoothstep',
        style: e.type === 'conditional' ? COND_STYLE : EDGE_STYLE,
        label: e.condition,
        labelStyle: { fill: '#f59e0b', fontSize: 9, fontFamily: 'JetBrains Mono' },
        labelBgStyle: { fill: 'rgba(15,23,42,0.8)' },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.type === 'conditional' ? '#f59e0b' : '#4f46e5' },
      }));
  }, [graphSchema]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1e293b"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
