/**
 * pages/WorkspacePage.tsx
 * The main 3-column workspace layout:
 *   [Sidebar: Threads] | [Center: Graph + Status + State] | [Right: History]
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { StatusBanner } from '../components/workflow/StatusBanner';
import { NodePipeline } from '../components/workflow/NodePipeline';
import { GraphVisualizer } from '../components/graph/GraphVisualizer';
import { StatePanel } from '../components/state/StatePanel';
import { StateEditModal } from '../components/state/StateEditModal';
import { HistoryTimeline } from '../components/history/HistoryTimeline';
import { TimeTravelModal } from '../components/history/TimeTravelModal';
import { StartWorkflowForm } from '../components/workflow/StartWorkflowForm';
import { useWorkflowStore } from '../stores/workflowStore';

export function WorkspacePage() {
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const { activeThreadId } = useWorkflowStore();

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* ── Left: Sidebar ─────────────────────────────────────────────────── */}
      <motion.div
        animate={{ width: sidebarOpen ? 256 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="overflow-hidden flex-shrink-0"
      >
        <div className="w-64 h-full">
          <Sidebar onNewWorkflow={() => setShowForm(true)} />
        </div>
      </motion.div>

      {/* ── Sidebar toggle ────────────────────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-10 flex items-center justify-center
          bg-surface-700 border border-white/10 rounded-r-lg text-slate-500 hover:text-slate-300
          hover:bg-surface-600 transition-all"
        style={{ left: sidebarOpen ? 256 : 0 }}
      >
        {sidebarOpen ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeftOpen className="w-3 h-3" />}
      </button>

      {/* ── Center: Main content ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col gap-3 p-4 overflow-auto">
          {/* Status banner */}
          <StatusBanner />

          {/* Two-column: Graph Viz + State Panel */}
          <div className="flex gap-3 flex-1 min-h-0">
            {/* Left column: Graph + Pipeline */}
            <div className="flex flex-col gap-3 w-[42%] flex-shrink-0">
              {/* Pipeline progress */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                  Pipeline Progress
                </p>
                <NodePipeline />
              </div>

              {/* ReactFlow graph */}
              <div className="glass rounded-xl flex-1 p-1 min-h-[280px]">
                <div className="h-full relative">
                  <div className="absolute top-3 left-3 z-10">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Graph Topology
                    </p>
                  </div>
                  <GraphVisualizer />
                </div>
              </div>
            </div>

            {/* Right column: State Panel */}
            <div className="flex-1 min-w-0">
              {activeThreadId ? (
                <StatePanel />
              ) : (
                <div className="glass rounded-xl h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="text-4xl mb-3">🤖</div>
                  <h3 className="text-base font-bold text-white mb-2">No Active Thread</h3>
                  <p className="text-sm text-slate-400 mb-5">
                    Start a new workflow or select a thread from the sidebar to begin.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                      bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold
                      shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105"
                  >
                    Start Workflow
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── History toggle ────────────────────────────────────────────────── */}
      <button
        onClick={() => setHistoryOpen((v) => !v)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-10 flex items-center justify-center
          bg-surface-700 border border-white/10 rounded-l-lg text-slate-500 hover:text-slate-300
          hover:bg-surface-600 transition-all"
        style={{ right: historyOpen ? 280 : 0 }}
      >
        {historyOpen ? <PanelRightClose className="w-3 h-3" /> : <PanelRightOpen className="w-3 h-3" />}
      </button>

      {/* ── Right: History timeline ────────────────────────────────────────── */}
      <motion.div
        animate={{ width: historyOpen ? 280 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="overflow-hidden flex-shrink-0 border-l border-indigo-500/10"
      >
        <div className="w-[280px] h-full glass">
          <HistoryTimeline />
        </div>
      </motion.div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showForm && <StartWorkflowForm onClose={() => setShowForm(false)} />}
      <StateEditModal />
      <TimeTravelModal />
    </div>
  );
}
