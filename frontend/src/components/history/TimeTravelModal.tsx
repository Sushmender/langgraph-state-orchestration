/**
 * components/history/TimeTravelModal.tsx
 * Confirm + optional state override modal for time-travel forks.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GitFork, Clock } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { formatNode, shortId } from '../../lib/utils';

export function TimeTravelModal() {
  const { isTimeTravelModalOpen, timeTravelTarget, closeTimeTravelModal, error } = useWorkflowStore();
  const { timeTravel } = useWorkflow();
  const [overridesJson, setOverridesJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isTimeTravelModalOpen || !timeTravelTarget) return null;

  const handleFork = async () => {
    let overrides: Record<string, unknown> | undefined = undefined;
    if (overridesJson.trim()) {
      try {
        overrides = JSON.parse(overridesJson);
        setJsonError('');
      } catch {
        setJsonError('Invalid JSON');
        return;
      }
    }
    setIsSaving(true);
    await timeTravel({ checkpoint_id: timeTravelTarget.checkpoint_id, state_overrides: overrides });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={closeTimeTravelModal}
      />
      <motion.div
        className="relative w-full max-w-md glass-strong rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Time Travel</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fork from checkpoint</p>
            </div>
          </div>
          <button onClick={closeTimeTravelModal} className="p-2 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target info */}
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <GitFork className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-300">Fork Target</span>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <div>Node: <span className="text-slate-200">{formatNode(timeTravelTarget.last_node)}</span></div>
              <div>Step: <span className="text-slate-200">{timeTravelTarget.step}</span></div>
              <div>Revision: <span className="text-slate-200">{timeTravelTarget.revision_number}</span></div>
              <div>ID: <span className="text-slate-200 font-mono">{shortId(timeTravelTarget.checkpoint_id)}</span></div>
            </div>
          </div>

          {/* State overrides */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              State Overrides <span className="text-slate-600 font-normal">(optional JSON)</span>
            </label>
            <textarea
              value={overridesJson}
              onChange={(e) => { setOverridesJson(e.target.value); setJsonError(''); }}
              placeholder={'{\n  "plan": "My new plan…"\n}'}
              rows={4}
              className="w-full bg-surface-700/60 border border-white/10 rounded-xl px-4 py-3
                text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none
                focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
            />
            {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            <p className="text-xs text-slate-600 mt-1.5">
              Optionally modify state values at this checkpoint before resuming.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={closeTimeTravelModal}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFork}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
                disabled:opacity-50 text-white text-sm font-bold transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><GitFork className="w-4 h-4" /> Fork Here</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
