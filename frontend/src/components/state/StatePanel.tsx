/**
 * components/state/StatePanel.tsx
 * Tabbed panel for viewing all AgentState fields.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, Search, MessageSquare, Code2, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'plan',     label: 'Plan',     icon: FileText,      field: 'plan'     },
  { id: 'draft',    label: 'Draft',    icon: BookOpen,      field: 'draft'    },
  { id: 'research', label: 'Research', icon: Search,        field: 'content'  },
  { id: 'critique', label: 'Critique', icon: MessageSquare, field: 'critique' },
  { id: 'raw',      label: 'Raw JSON', icon: Code2,         field: null       },
];

// Fields that are editable + their as_node mapping
const EDITABLE_FIELDS: Record<string, string> = {
  plan:     'planner',
  draft:    'generate',
  critique: 'reflect',
};

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center">
      <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center mb-2">
        <FileText className="w-5 h-5 text-slate-600" />
      </div>
      <p className="text-xs text-slate-600">{label} not generated yet</p>
    </div>
  );
}

export function StatePanel() {
  const { stateValues, appStatus, activeStateTab, setActiveStateTab, openEditModal } = useWorkflowStore();
  const [activeTab, setActiveTab] = useState(activeStateTab);

  const handleTab = (tab: string) => {
    setActiveTab(tab);
    setActiveStateTab(tab);
  };

  const isPaused = appStatus === 'paused';

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/5 bg-surface-800/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all relative',
                isActive ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="state-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'raw' ? (
              /* Raw JSON */
              <div className="relative">
                <pre className="text-xs font-mono text-slate-300 bg-surface-700/50 rounded-xl p-4 overflow-auto whitespace-pre-wrap break-words max-h-96">
                  {JSON.stringify(stateValues, null, 2) ?? 'No state loaded'}
                </pre>
              </div>
            ) : activeTab === 'research' ? (
              /* Research content */
              <div className="space-y-3">
                {stateValues?.queries && stateValues.queries.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">Search Queries</p>
                    <div className="flex flex-wrap gap-2">
                      {stateValues.queries.map((q, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {stateValues?.content && stateValues.content.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 mb-2">
                      Research Snippets ({stateValues.content.length})
                    </p>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {stateValues.content.map((c, i) => (
                        <div key={i} className="p-3 rounded-lg bg-surface-700/50 border border-white/5">
                          <p className="text-xs text-slate-400 leading-relaxed">{c.slice(0, 300)}{c.length > 300 ? '…' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState label="Research content" />
                )}
              </div>
            ) : (
              /* Plan / Draft / Critique — markdown + edit button */
              (() => {
                const tabCfg = TABS.find((t) => t.id === activeTab)!;
                const content = stateValues?.[tabCfg.field as keyof typeof stateValues] as string | null;
                const canEdit = isPaused && !!EDITABLE_FIELDS[tabCfg.field ?? ''];

                return (
                  <div className="relative group">
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(tabCfg.field!)}
                        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5
                          rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300
                          text-xs font-medium hover:bg-indigo-500/30 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                    {content ? (
                      <div className="prose prose-sm max-w-none prose-dark">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      </div>
                    ) : (
                      <EmptyState label={tabCfg.label} />
                    )}
                  </div>
                );
              })()
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer metadata */}
      {stateValues && (
        <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-xs text-slate-600">
          {stateValues.task && (
            <span className="truncate flex-1">📝 {stateValues.task}</span>
          )}
          <span>Rev {stateValues.revision_number ?? 0}/{stateValues.max_revisions ?? '—'}</span>
          <span>Steps {stateValues.count ?? 0}</span>
        </div>
      )}
    </div>
  );
}
