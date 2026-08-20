/**
 * components/history/TimeTravelModal.tsx
 * Confirm + optional plain-text state override modal for time-travel forks.
 *
 * Fixes applied:
 *  1. Replaced raw JSON textarea with labelled plain-text fields per state key
 *     (Plan, Draft, Critique). JSON is built automatically — no syntax required.
 *  2. All override fields are cleared every time a new fork target is opened,
 *     so text from a previous fork never bleeds into the next one.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitFork, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { formatNode, shortId } from '../../lib/utils';

/**
 * Fields the user can override in plain text inside the Time Travel modal.
 * NOTE: Draft editing is intentionally excluded — users should edit the draft
 * directly from the Agent State panel (Edit button on the Draft tab).
 */
const OVERRIDE_FIELDS = [
  {
    key: 'plan' as const,
    label: 'Plan',
    placeholder: 'Enter a new research plan to use from this checkpoint…',
    rows: 4,
  },
  {
    key: 'critique' as const,
    label: 'Critique',
    placeholder: 'Enter a new critique to guide the next revision…',
    rows: 3,
  },
];

type OverrideKey = (typeof OVERRIDE_FIELDS)[number]['key'];

export function TimeTravelModal() {
  const { isTimeTravelModalOpen, timeTravelTarget, closeTimeTravelModal, error } =
    useWorkflowStore();
  const { timeTravel } = useWorkflow();

  const [fields, setFields] = useState<Partial<Record<OverrideKey, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);

  // ── Fix 2: reset fields whenever a NEW fork target is selected ──────────────
  useEffect(() => {
    setFields({});
    setShowOverrides(false);
  }, [timeTravelTarget?.checkpoint_id]);

  if (!isTimeTravelModalOpen || !timeTravelTarget) return null;

  const setField = (key: OverrideKey, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleFork = async () => {
    // Fix 1: build overrides object from non-empty plain-text fields — no JSON needed
    const overrides: Record<string, string> = {};
    OVERRIDE_FIELDS.forEach(({ key }) => {
      const val = fields[key]?.trim();
      if (val) overrides[key] = val;
    });

    setIsSaving(true);
    await timeTravel({
      checkpoint_id: timeTravelTarget.checkpoint_id,
      state_overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
    });
    setIsSaving(false);
  };

  const hasAnyOverride = OVERRIDE_FIELDS.some((f) => fields[f.key]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={closeTimeTravelModal}
      />

      <motion.div
        className="relative w-full max-w-md glass-strong rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7a1128]/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#9c1a37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#e8e0da]">Time Travel</h3>
              <p className="text-xs text-[#8f7f7c] mt-0.5">Fork from checkpoint</p>
            </div>
          </div>
          <button
            onClick={closeTimeTravelModal}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Fork target info ─────────────────────────────────────── */}
          <div className="p-4 rounded-xl bg-[#7a1128]/10 border border-[rgba(122,17,40,0.2)]">
            <div className="flex items-center gap-2 mb-2">
              <GitFork className="w-3.5 h-3.5 text-[#9c1a37]" />
              <span className="text-xs font-semibold text-[#9c1a37]">Fork Target</span>
            </div>
            <div className="space-y-1 text-xs text-[#8f7f7c]">
              <div>
                Node:{' '}
                <span className="text-[#e8e0da]">{formatNode(timeTravelTarget.last_node)}</span>
              </div>
              <div>
                Step: <span className="text-[#e8e0da]">{timeTravelTarget.step}</span>
              </div>
              <div>
                Revision:{' '}
                <span className="text-[#e8e0da]">{timeTravelTarget.revision_number}</span>
              </div>
              <div>
                ID:{' '}
                <span className="text-[#e8e0da] font-mono">
                  {shortId(timeTravelTarget.checkpoint_id)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Optional overrides — collapsible ─────────────────────── */}
          <div>
            {/* Section toggle */}
            <button
              type="button"
              onClick={() => setShowOverrides((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold
                text-[#8f7f7c] hover:text-[#e8e0da] transition-colors mb-2"
            >
              <span className="flex items-center gap-2">
                Modify State
                <span className="font-normal text-[#5a4a48]">(optional)</span>
                {hasAnyOverride && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#7a1128]/20
                    text-[#9c1a37] text-[10px] font-bold">
                    edited
                  </span>
                )}
              </span>
              {showOverrides ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <p className="text-xs text-[#5a4a48] mb-3">
              {showOverrides
                ? 'Fill in any field you want to change before resuming. Leave blank to keep the original value.'
                : 'Optionally change the Plan or Critique before resuming. Edit the Draft from the Agent State panel.'}
            </p>

            {/* Expandable plain-text fields */}
            <AnimatePresence>
              {showOverrides && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3"
                >
                  {OVERRIDE_FIELDS.map(({ key, label, placeholder, rows }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-[#e8e0da] mb-1.5">
                        {label}
                      </label>
                      <textarea
                        value={fields[key] ?? ''}
                        onChange={(e) => setField(key, e.target.value)}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full bg-surface-700/60 border border-[rgba(122,17,40,0.15)]
                          rounded-xl px-4 py-3 text-xs text-[#e8e0da] placeholder-[#5a4a48]
                          focus:outline-none focus:border-[rgba(122,17,40,0.5)]
                          focus:ring-1 focus:ring-[rgba(122,17,40,0.3)] transition-colors resize-none"
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error display */}
          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* ── Buttons ──────────────────────────────────────────────── */}
          <div className="flex gap-3">
            <button
              onClick={closeTimeTravelModal}
              className="flex-1 py-2.5 rounded-xl border border-[rgba(122,17,40,0.2)]
                text-[#8f7f7c] hover:bg-[rgba(122,17,40,0.06)] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleFork}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                bg-[#7a1128] hover:bg-[#9c1a37]
                disabled:opacity-50 text-[#e8e0da] text-sm font-bold transition-all"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <GitFork className="w-4 h-4" />
                  {hasAnyOverride ? 'Fork with Changes' : 'Fork Here'}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
