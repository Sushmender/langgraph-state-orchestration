/**
 * components/layout/PanelRail.tsx
 * VS Code-style icon rail that controls which panel slides open.
 * Each icon maps to a panel; unavailable panels are dimmed with a tooltip.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { ListTree, Clock, Plus, X } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { Sidebar } from './Sidebar';
import { HistoryTimeline } from '../history/HistoryTimeline';
import { cn } from '../../lib/utils';

type PanelId = 'threads' | 'history';

interface RailItem {
  id: PanelId;
  icon: React.ElementType;
  label: string;
  available: boolean;
  unavailableReason?: string;
}

const PANEL_WIDTH = 280;

interface Props {
  onNewWorkflow: () => void;
}

export function PanelRail({ onNewWorkflow }: Props) {
  const {
    activePanel,
    setActivePanel,
    activeThreadId,
    history,
  } = useWorkflowStore();

  const hasThread = !!activeThreadId;

  const items: RailItem[] = [
    {
      id: 'threads',
      icon: ListTree,
      label: 'Threads',
      available: true,
    },
    {
      id: 'history',
      icon: Clock,
      label: 'History',
      available: hasThread,
      unavailableReason: 'Select a thread first',
    },
  ];

  const toggle = (id: PanelId) => {
    setActivePanel(activePanel === id ? null : id);
  };

  const PanelContent = () => {
    switch (activePanel) {
      case 'threads':
        return (
          <Sidebar onNewWorkflow={() => { onNewWorkflow(); setActivePanel(null); }} />
        );
      case 'history':
        return (
          <div className="flex flex-col h-full">
            <div className="px-4 py-3 pr-10 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-[#8f7f7c] uppercase tracking-widest">Checkpoint History</h2>
              <span className="text-xs text-[#5a4a48] bg-surface-700 px-2 py-0.5 rounded-full">{history.length}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <HistoryTimeline />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-shrink-0">
      {/* ── Icon Rail ────────────────────────────────────────── */}
      <div className="w-12 flex flex-col items-center py-3 gap-1 border-r border-[rgba(122,17,40,0.18)] bg-[#110c0c]/70 z-10">
        {/* New workflow shortcut at top */}
        <button
          onClick={onNewWorkflow}
          title="New Workflow"
          className="w-9 h-9 rounded-xl bg-[#7a1128] hover:bg-[#9c1a37] flex items-center justify-center
            text-[#e8e0da] transition-all hover:scale-110 shadow-lg shadow-[#7a1128]/20 mb-2"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-[rgba(122,17,40,0.2)] mb-1" />

        {/* Panel icon buttons */}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => item.available && toggle(item.id)}
                title={item.available ? item.label : item.unavailableReason}
                className={cn(
                  'relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150',
                  item.available
                    ? isActive
                      ? 'bg-[#7a1128]/30 text-[#e8e0da] border border-[rgba(122,17,40,0.4)]'
                      : 'text-[#5a4a48] hover:text-[#e8e0da] hover:bg-[rgba(122,17,40,0.1)]'
                    : 'text-[#2e1f1f] cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="rail-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#9c1a37] rounded-r-full -ml-px"
                  />
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none
                opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="bg-[#1c1414] border border-[rgba(122,17,40,0.3)] rounded-lg px-2.5 py-1.5
                  text-xs text-[#e8e0da] whitespace-nowrap shadow-xl">
                  {item.available ? item.label : item.unavailableReason}
                  {!item.available && <span className="text-[#5a4a48] ml-1">— unavailable</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Slide-over Panel ─────────────────────────────────── */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            key={activePanel}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: PANEL_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="overflow-hidden flex-shrink-0 border-r border-[rgba(122,17,40,0.18)] relative"
            style={{ minWidth: 0 }}
          >
            <div style={{ width: PANEL_WIDTH }} className="h-full glass flex flex-col">
              {/* Close button */}
              <button
                onClick={() => setActivePanel(null)}
                className="absolute top-2 right-2 z-20 w-6 h-6 rounded-lg flex items-center justify-center
                  text-[#5a4a48] hover:text-[#e8e0da] hover:bg-[rgba(122,17,40,0.15)] transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <PanelContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
