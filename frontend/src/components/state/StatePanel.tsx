import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, Search, MessageSquare, Code2, Edit3, Download } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWorkflowStore } from '../../stores/workflowStore';
import { cn } from '../../lib/utils';

/* ── Tab config ─────────────────────────────────────────────────────────── */
const CONTENT_TABS = [
  { id: 'plan', label: 'Plan', icon: FileText, field: 'plan' },
  { id: 'draft', label: 'Draft', icon: BookOpen, field: 'draft' },
  { id: 'research', label: 'Research', icon: Search, field: 'content' },
  { id: 'critique', label: 'Critique', icon: MessageSquare, field: 'critique' },
];
const RAW_TAB = { id: 'raw', label: 'Raw JSON', icon: Code2, field: null };
const TABS = [...CONTENT_TABS, RAW_TAB];

/* ── Editable fields ─────────────────────────────────────────────────────── */
const EDITABLE_FIELDS: Record<string, string> = {
  plan: 'planner',
  draft: 'generate',
  critique: 'reflect',
};

/* ── Revision stepper dots ───────────────────────────────────────────────── */
/**
 * revision_number = drafts generated so far (may exceed max_revisions at END).
 * max_revisions   = configured upper limit.
 * "Rev 3/2" is NOT a bug per se: the backend increments revision_number after
 * the last draft, then checks > max and exits. We clamp the filled dots so
 * they never overflow the total, and label it unambiguously.
 */
function RevisionStepper({ current, max }: { current: number; max: number }) {
  const filled = Math.min(current, max);
  const total = Math.max(max, 1);
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-[#5a4a48] mr-0.5">
        Revision {filled} of {total}
      </span>
      <span className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              i < filled
                ? 'bg-[#9c1a37]'
                : 'border border-[#5a4a48] bg-transparent'
            )}
          />
        ))}
      </span>
    </span>
  );
}

/* ── Markdown Renderer Components ────────────────────────────────────────── */
const MarkdownComponents: Components = {
  p: ({ node, children, ...props }) => {
    let isSection = false;
    const firstChild = node?.children?.[0];
    if (firstChild?.type === 'element' && firstChild.tagName === 'strong') {
      const textNode = firstChild.children?.[0];
      if (textNode?.type === 'text') {
        if (/^(overall assessment|strengths|weaknesses|recommendations|challenges|applications)/i.test(textNode.value)) {
          isSection = true;
        }
      }
    }
    return (
      <p className={cn("mb-4", isSection && "mt-6")} {...props}>
        {children}
      </p>
    );
  },
  ul: ({ children, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props}>{children}</ul>,
  ol: ({ children, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props}>{children}</ol>,
  li: ({ children, ...props }) => <li {...props}>{children}</li>,
  h1: ({ children, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-[#e8e0da]" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 text-[#e8e0da]" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-lg font-bold mt-5 mb-2 text-[#e8e0da]" {...props}>{children}</h3>,
  h4: ({ children, ...props }) => <h4 className="text-base font-bold mt-5 mb-2 text-[#e8e0da]" {...props}>{children}</h4>,
};

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-center">
      <div className="w-10 h-10 rounded-xl bg-[#231a1a] flex items-center justify-center mb-2">
        <FileText className="w-5 h-5 text-[#5a4a48]" />
      </div>
      <p className="text-xs text-[#5a4a48]">{label} not generated yet</p>
    </div>
  );
}

export function StatePanel() {
  const { stateValues, appStatus, activeStateTab, setActiveStateTab, openEditModal } =
    useWorkflowStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTab = activeStateTab;
  const handleTab = (tab: string) => setActiveStateTab(tab);

  const isPaused = appStatus === 'paused';

  // Determine if current tab is editable
  const currentTabCfg = TABS.find((t) => t.id === activeTab);
  const canEditCurrentTab = isPaused && !!EDITABLE_FIELDS[currentTabCfg?.field ?? ''];

  const handleDownloadDraft = () => {
    if (!stateValues?.draft) return;
    const blob = new Blob([stateValues.draft as string], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = stateValues.task
      ? `${(stateValues.task as string).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
      : 'final_draft.txt';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden">
      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-[rgba(122,17,40,0.12)] bg-[#1c1414]/60">

        {/* Content tabs (Plan / Draft / Research / Critique) */}
        <div className="flex">
          {CONTENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative',
                  isActive
                    ? 'text-[#c8a96e]'           /* amber for active content tab */
                    : 'text-[#8f7f7c] hover:text-[#e8e0da]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="state-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c8a96e]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Thin vertical divider before Raw JSON */}
        <div className="w-px self-stretch my-2 bg-[rgba(122,17,40,0.25)] flex-shrink-0" />

        {/* Raw JSON — visually de-emphasised dev/debug tab */}
        <button
          onClick={() => handleTab(RAW_TAB.id)}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative',
            activeTab === RAW_TAB.id
              ? 'text-[#8f7f7c]'
              : 'text-[#4a3e3c] hover:text-[#8f7f7c]'
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{RAW_TAB.label}</span>
          {activeTab === RAW_TAB.id && (
            <motion.div
              layoutId="state-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5a4a48]"
            />
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Download Final Draft button */}
        {appStatus === 'completed' && stateValues?.draft && (
          <button
            onClick={handleDownloadDraft}
            title="Download Final Draft"
            className="flex items-center justify-center w-8 h-8 mr-2 rounded-lg
              bg-[#c8a96e]/10 border border-[rgba(200,169,110,0.3)] text-[#c8a96e]
              hover:bg-[#c8a96e]/20 transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Edit button */}
        {canEditCurrentTab && (
          <button
            onClick={() => openEditModal(currentTabCfg!.field!)}
            className="flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-lg
              bg-[#7a1128]/20 border border-[rgba(122,17,40,0.3)] text-[#9c1a37]
              text-xs font-medium hover:bg-[#7a1128]/35 transition-all flex-shrink-0"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {/* ── Scrollable content + bottom fade ─────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {/* CSS-only gradient fade at the bottom edge — pointer-events:none */}
        <div
          className="absolute bottom-0 left-0 right-0 h-10 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(28,20,20,0.92))',
          }}
        />

        <div ref={scrollRef} className="h-full overflow-y-auto p-4">
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
                  <pre className="text-xs font-mono text-[#e8e0da] bg-[#231a1a]/70 rounded-xl p-4 overflow-auto whitespace-pre-wrap break-words max-h-96">
                    {JSON.stringify(stateValues, null, 2) ?? 'No state loaded'}
                  </pre>
                </div>

              ) : activeTab === 'research' ? (
                /* Research content */
                <div className="space-y-3">
                  {stateValues?.queries && stateValues.queries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#8f7f7c] mb-2">Search Queries</p>
                      <div className="flex flex-wrap gap-2">
                        {stateValues.queries.map((q, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[#7a1128]/10 border border-[rgba(122,17,40,0.2)] text-[#9c1a37]"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {stateValues?.content && stateValues.content.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-[#8f7f7c] mb-2">
                        Research Snippets ({stateValues.content.length})
                      </p>
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {stateValues.content.map((c, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-[#231a1a]/70 border border-[rgba(122,17,40,0.1)]"
                          >
                            <p className="text-xs text-[#8f7f7c] leading-relaxed whitespace-pre-wrap">
                              {c.slice(0, 300)}{c.length > 300 ? '…' : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState label="Research content" />
                  )}
                </div>

              ) : (
                /* Plan / Draft / Critique — ReactMarkdown */
                (() => {
                  const tabCfg = TABS.find((t) => t.id === activeTab)!;
                  const content = stateValues?.[tabCfg.field as keyof typeof stateValues] as string | null;
                  return content ? (
                    <div className="prose prose-sm max-w-none prose-dark">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
                        {content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <EmptyState label={tabCfg.label} />
                  );
                })()
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Footer metadata ────────────────────────────────────────────────── */}
      {stateValues && (
        <div className="border-t border-[rgba(122,17,40,0.12)] px-4 py-2 flex items-center gap-4 text-xs text-[#5a4a48]">
          {stateValues.task && (
            <span className="truncate flex-1">📝 {stateValues.task}</span>
          )}
          {stateValues.max_revisions != null ? (
            <RevisionStepper
              current={stateValues.revision_number ?? 0}
              max={stateValues.max_revisions}
            />
          ) : (
            <span>Rev {stateValues.revision_number ?? 0}</span>
          )}
          <span>Steps {stateValues.count ?? 0}</span>
        </div>
      )}
    </div>
  );
}
