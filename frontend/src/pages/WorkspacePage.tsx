/**
 * pages/WorkspacePage.tsx
 * Progressive-disclosure workspace.
 *
 * Layout:
 *   [PanelRail: 48px icon-rail + slide-over] | [Center: context-aware main stage]
 *
 * Center stage adapts to appStatus:
 *   idle      → Contextual onboarding card (step-by-step guide)
 *   starting  → Graph + animated status bar
 *   polling   → Graph + animated status bar
 *   paused    → Graph (left) + State editor (right) — the HITL moment
 *   completed → Graph (all green) + completion summary
 *   error     → Error card + retry
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ListTree, Play, Network, GitFork, LayoutTemplate, Database } from 'lucide-react';
import { PanelRail } from '../components/layout/PanelRail';
import { StatusBanner } from '../components/workflow/StatusBanner';
import { GraphVisualizer } from '../components/graph/GraphVisualizer';
import { StatePanel } from '../components/state/StatePanel';
import { StateEditModal } from '../components/state/StateEditModal';
import { TimeTravelModal } from '../components/history/TimeTravelModal';
import { StartWorkflowForm } from '../components/workflow/StartWorkflowForm';
import { useWorkflowStore } from '../stores/workflowStore';
import { cn } from '../lib/utils';

type CenterView = 'graph' | 'state';

/** Toggle pill — Graph / Agent State */
function ViewToggle({ value, onChange }: { value: CenterView; onChange: (v: CenterView) => void }) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#1c1414] border border-[rgba(122,17,40,0.2)] shadow-inner">
      {(['graph', 'state'] as CenterView[]).map((v) => {
        const isActive = value === v;
        const Icon = v === 'graph' ? LayoutTemplate : Database;
        const label = v === 'graph' ? 'Graph' : 'Agent State';
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
              isActive
                ? 'bg-[#7a1128] text-[#e8e0da] shadow-lg shadow-[#7a1128]/25'
                : 'text-[#5a4a48] hover:text-[#e8e0da] hover:bg-[rgba(122,17,40,0.1)]'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Step guide card shown on idle ─────────────────────────────────────────── */
const STEPS = [
  {
    n: '01',
    icon: ListTree,
    color: 'text-[#9c1a37]',
    bg: 'bg-[#7a1128]/10 border-[#7a1128]/25',
    title: 'Open the Threads panel',
    desc: 'Click the list icon on the left rail to see existing threads or start fresh.',
  },
  {
    n: '02',
    icon: Play,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/25',
    title: 'Start or resume a workflow',
    desc: 'Hit ＋ to launch a new workflow, or pick an existing thread to continue.',
  },
  {
    n: '03',
    icon: Network,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/25',
    title: 'Watch the graph execute',
    desc: 'Each agent node lights up as it runs. Open Graph Topology for a live view.',
  },
  {
    n: '04',
    icon: GitFork,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/25',
    title: 'Intervene at any pause',
    desc: 'When the workflow pauses for review, edit state or time-travel to any checkpoint.',
  },
];

function IdleGuide({ onNewWorkflow }: { onNewWorkflow: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-full px-8 py-12 max-w-2xl mx-auto w-full"
    >
      {/* Hero */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-16 h-16 rounded-2xl bg-[#7a1128] flex items-center justify-center shadow-2xl shadow-[#7a1128]/30 mb-6"
      >
        <Zap className="w-8 h-8 text-[#e8e0da]" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-extrabold text-[#e8e0da] mb-2 text-center"
      >
        Ready to explore HITL?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-[#8f7f7c] mb-10 text-center max-w-md"
      >
        Follow the steps below to run your first Human-In-The-Loop workflow.
      </motion.p>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              className={`glass border rounded-xl p-4 ${step.bg} flex items-start gap-3`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1c1414]/60`}>
                <Icon className={`w-4 h-4 ${step.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold text-[#5a4a48] tracking-widest">STEP {step.n}</span>
                </div>
                <p className="text-sm font-semibold text-[#e8e0da] leading-snug mb-1">{step.title}</p>
                <p className="text-xs text-[#8f7f7c] leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        onClick={onNewWorkflow}
        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold
          bg-[#7a1128] hover:bg-[#9c1a37] text-[#e8e0da]
          shadow-2xl shadow-[#7a1128]/30 hover:shadow-[#7a1128]/50
          transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <Zap className="w-4 h-4" />
        Start New Workflow
      </motion.button>
    </motion.div>
  );
}

/* ── Main workspace page ──────────────────────────────────────────────────── */
export function WorkspacePage() {
  const [showForm, setShowForm] = useState(false);
  const [centerView, setCenterView] = useState<CenterView>('graph');
  const { activeThreadId, appStatus, threads, setActivePanel } = useWorkflowStore();

  // Smart default: auto-open threads panel if existing threads present
  useEffect(() => {
    if (threads.length > 0) {
      setActivePanel('threads');
    }
  // only on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset view to graph when thread or status changes
  useEffect(() => {
    setCenterView('graph');
  }, [activeThreadId, appStatus]);

  const isIdle      = appStatus === 'idle' && !activeThreadId;
  const isRunning   = appStatus === 'polling' || appStatus === 'starting';
  const isPaused    = appStatus === 'paused';
  const isCompleted = appStatus === 'completed';
  const isError     = appStatus === 'error';

  // States where the Graph ↔ State toggle should appear
  const showToggle = isCompleted || isRunning || (!isIdle && appStatus === 'idle' && !!activeThreadId);

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* ── Left: Panel Rail ──────────────────────────────────────────────── */}
      <PanelRail onNewWorkflow={() => setShowForm(true)} />

      {/* ── Center: Context-aware main stage ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Status banner + toggle row — shown when not idle */}
        {!isIdle && (
          <div className="px-4 pt-3 pb-0">
            <StatusBanner />
            {/* Graph ↔ State toggle */}
            {showToggle && (
              <div className="flex justify-center mt-2 mb-1">
                <ViewToggle value={centerView} onChange={setCenterView} />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ── IDLE: Contextual step guide ─────────────────────────── */}
            {isIdle && (
              <motion.div
                key="idle"
                className="h-full overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <IdleGuide onNewWorkflow={() => setShowForm(true)} />
              </motion.div>
            )}

            {/* ── RUNNING: Full-canvas graph ──────────────────────────── */}
            {isRunning && (
              <motion.div
                key="running"
                className="h-full p-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-full glass rounded-xl overflow-hidden">
                  <AnimatePresence mode="wait">
                    {centerView === 'graph' ? (
                      <motion.div key="run-graph" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GraphVisualizer />
                      </motion.div>
                    ) : (
                      <motion.div key="run-state" className="h-full overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StatePanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── PAUSED: Graph (55%) + State editor (45%) ────────────── */}
            {isPaused && (
              <motion.div
                key="paused"
                className="h-full flex gap-3 p-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {/* Graph */}
                <div className="glass rounded-xl overflow-hidden flex-shrink-0 relative" style={{ width: '52%' }}>
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[10px] font-bold text-[#8f7f7c] uppercase tracking-widest
                      bg-[#1c1414]/80 px-2 py-1 rounded-lg border border-[rgba(122,17,40,0.15)]">
                      Graph Topology
                    </span>
                  </div>
                  <GraphVisualizer />
                </div>

                {/* State editor */}
                <div className="flex-1 min-w-0 flex flex-col gap-0">
                  {/* Callout */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <p className="text-xs font-semibold text-amber-300">
                      Human review required — inspect &amp; edit state, then resume.
                    </p>
                  </div>
                  <div className="flex-1 min-h-0">
                    <StatePanel />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── COMPLETED: Graph ↔ State toggle ─────────────────────── */}
            {isCompleted && (
              <motion.div
                key="completed"
                className="h-full p-3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="h-full glass rounded-xl overflow-hidden">
                  <AnimatePresence mode="wait">
                    {centerView === 'graph' ? (
                      <motion.div key="c-graph" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GraphVisualizer />
                      </motion.div>
                    ) : (
                      <motion.div key="c-state" className="h-full overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StatePanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── ERROR: same as idle but with banner above ───────────── */}
            {isError && !isIdle && (
              <motion.div
                key="error-idle"
                className="h-full overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <IdleGuide onNewWorkflow={() => setShowForm(true)} />
              </motion.div>
            )}

            {/* ── Thread selected but idle (switched to old thread) ────── */}
            {!isIdle && appStatus === 'idle' && activeThreadId && (
              <motion.div
                key="thread-idle"
                className="h-full p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="h-full glass rounded-xl overflow-hidden">
                  <AnimatePresence mode="wait">
                    {centerView === 'graph' ? (
                      <motion.div key="ti-graph" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <GraphVisualizer />
                      </motion.div>
                    ) : (
                      <motion.div key="ti-state" className="h-full overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <StatePanel />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {showForm && <StartWorkflowForm onClose={() => setShowForm(false)} />}
      <StateEditModal />
      <TimeTravelModal />
    </div>
  );
}
