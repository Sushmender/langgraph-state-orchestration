/**
 * components/state/StateEditModal.tsx
 * HITL state edit modal — inline textarea for editing plan/draft/critique.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';

const FIELD_META: Record<string, { label: string; asNode: string; hint: string; rows: number }> = {
  plan:     { label: 'Plan',     asNode: 'planner',  hint: 'The essay outline. Changes will be used in research & generation.', rows: 10 },
  draft:    { label: 'Draft',    asNode: 'generate', hint: 'The essay draft. Changes will be sent to the reflector.', rows: 16 },
  critique: { label: 'Critique', asNode: 'reflect',  hint: 'The AI critique. Replace with your own feedback.', rows: 8 },
};

export function StateEditModal() {
  const { isEditModalOpen, editModalField, stateValues, closeEditModal, error } = useWorkflowStore();
  const { updateStateField } = useWorkflow();
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const meta = editModalField ? FIELD_META[editModalField] : null;

  useEffect(() => {
    if (editModalField && stateValues) {
      const current = stateValues[editModalField as keyof typeof stateValues];
      setValue(typeof current === 'string' ? current : '');
    }
  }, [editModalField, stateValues]);

  const handleSave = async () => {
    if (!editModalField || !meta) return;
    setIsSaving(true);
    await updateStateField({ key: editModalField, value, as_node: meta.asNode });
    setIsSaving(false);
  };

  if (!isEditModalOpen || !meta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={closeEditModal}
      />
      <motion.div
        className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-2xl shadow-indigo-500/20 overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">Edit {meta.label}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{meta.hint}</p>
          </div>
          <button onClick={closeEditModal} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* as_node badge */}
        <div className="px-6 pt-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-xs text-amber-400/80">
            This update will be attributed to node <code className="font-mono bg-amber-500/10 px-1 rounded">{meta.asNode}</code>
          </p>
        </div>

        {/* Textarea */}
        <div className="px-6 py-4">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={meta.rows}
            className="w-full bg-surface-700/60 border border-white/10 rounded-xl px-4 py-3
              text-sm text-slate-200 placeholder-slate-600 focus:outline-none
              focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
            placeholder={`Enter the new ${meta.label.toLowerCase()}…`}
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-600">{value.length} chars</span>
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={closeEditModal}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400
              hover:bg-white/5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
              disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
