/**
 * components/workflow/StartWorkflowForm.tsx
 * Modal form to start a new workflow run.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { useWorkflow } from '../../hooks/useWorkflow';
import { useWorkflowStore } from '../../stores/workflowStore';

const ALL_NODES = ['planner', 'research_plan', 'generate', 'reflect', 'research_critique'];
const NODE_LABELS: Record<string, string> = {
  planner: '🗺️ Planner',
  research_plan: '🔍 Research Plan',
  generate: '✍️ Generate',
  reflect: '🪞 Reflect',
  research_critique: '🔬 Research Critique',
};

interface Props {
  onClose: () => void;
}

export function StartWorkflowForm({ onClose }: Props) {
  const { startWorkflow } = useWorkflow();
  const { appStatus } = useWorkflowStore();
  const [task, setTask] = useState('');
  const [maxRevisions, setMaxRevisions] = useState(2);
  const [interruptAfter, setInterruptAfter] = useState<string[]>(ALL_NODES);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isLoading = appStatus === 'starting';

  const toggleNode = (node: string) => {
    setInterruptAfter((prev) =>
      prev.includes(node) ? prev.filter((n) => n !== node) : [...prev, node]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    await startWorkflow({ task: task.trim(), max_revisions: maxRevisions, interrupt_after: interruptAfter });
    if (!isLoading) onClose();
  };

  const exampleTopics = [
    'The impact of AI on modern healthcare',
    'Climate change and renewable energy solutions',
    'The future of quantum computing',
    'Social media and mental health in Gen Z',
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={!isLoading ? onClose : undefined}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg glass-strong rounded-2xl shadow-2xl shadow-[#7a1128]/20 overflow-hidden"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div>
              <h2 className="text-lg font-bold text-white">New Workflow</h2>
              <p className="text-xs text-slate-400 mt-0.5">Start a new essay-writing run</p>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Task input */}
            <div>
              <label className="block text-xs font-semibold text-[#e8e0da] mb-2">
                Essay Topic <span className="text-[#9c1a37]">*</span>
              </label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g. The impact of artificial intelligence on modern healthcare…"
                rows={3}
                disabled={isLoading}
                className="w-full bg-surface-700/60 border border-[rgba(122,17,40,0.15)] rounded-xl px-4 py-3
                  text-sm text-[#e8e0da] placeholder-[#5a4a48] focus:outline-none
                  focus:border-[rgba(122,17,40,0.5)] focus:ring-1 focus:ring-[rgba(122,17,40,0.3)]
                  disabled:opacity-50 transition-colors"
              />
              {/* Example topics */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exampleTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTask(t)}
                    disabled={isLoading}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#7a1128]/10 border border-[rgba(122,17,40,0.2)]
                      text-[#9c1a37] hover:bg-[#7a1128]/20 transition-colors disabled:opacity-40"
                  >
                    {t.length > 30 ? t.slice(0, 28) + '…' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                Advanced Settings
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4">
                      {/* Max revisions */}
                      <div>
                        <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                          Max Revisions
                          <span className="text-[#9c1a37] font-bold">{maxRevisions}</span>
                        </label>
                        <input
                          type="range" min={1} max={5} value={maxRevisions}
                          onChange={(e) => setMaxRevisions(Number(e.target.value))}
                          disabled={isLoading}
                          className="w-full h-1.5 bg-surface-600 rounded-full appearance-none
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-[#7a1128] cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-slate-600 mt-1">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                        </div>
                      </div>

                      {/* Interrupt nodes */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">
                          Pause at nodes (HITL)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_NODES.map((node) => (
                            <label
                              key={node}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-700/50
                                border border-[rgba(122,17,40,0.1)] cursor-pointer hover:border-[rgba(122,17,40,0.3)] transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={interruptAfter.includes(node)}
                                onChange={() => toggleNode(node)}
                                disabled={isLoading}
                                className="accent-[#7a1128]"
                              />
                              <span className="text-xs text-[#e8e0da]">{NODE_LABELS[node]}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setInterruptAfter(interruptAfter.length > 0 ? [] : ALL_NODES)}
                          className="mt-2 text-xs text-[#9c1a37] hover:text-[#c4858e] transition-colors"
                        >
                          {interruptAfter.length > 0 ? 'Deselect all (autonomous)' : 'Select all'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!task.trim() || isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                bg-[#7a1128] hover:bg-[#9c1a37]
                disabled:bg-[#2e1f1f] disabled:cursor-not-allowed
                text-[#e8e0da] font-semibold text-sm transition-all duration-200
                shadow-lg shadow-[#7a1128]/20 hover:shadow-[#7a1128]/40"
            >
              {isLoading ? (
                <>
                  <div className="flex gap-1">
                    <div className="dot-pulse" />
                    <div className="dot-pulse" />
                    <div className="dot-pulse" />
                  </div>
                  <span>Starting Workflow…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Workflow
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
