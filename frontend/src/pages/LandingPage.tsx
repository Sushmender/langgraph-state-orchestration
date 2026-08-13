/**
 * pages/LandingPage.tsx
 * Hero landing page with animated background and workflow launcher CTA.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Zap, Clock, Edit3, Network, ArrowRight } from 'lucide-react';
import { StartWorkflowForm } from '../components/workflow/StartWorkflowForm';

const FEATURES = [
  {
    icon: Zap,
    title: 'Human-In-The-Loop',
    desc: 'Pause at any node, inspect state, and intervene before the agent continues.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Clock,
    title: 'Time Travel',
    desc: 'Browse the full checkpoint history and fork from any past state.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Edit3,
    title: 'State Modification',
    desc: 'Edit plan, draft, or critique mid-flight. The graph uses your changes on resume.',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    icon: Network,
    title: 'Multi-Thread',
    desc: 'Run multiple independent workflows simultaneously and switch between them.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-16">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-600/8 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <GitBranch className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="gradient-text">LangGraph</span>
          <br />
          <span className="text-white">HITL Explorer</span>
        </motion.h1>

        <motion.p
          className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          An interactive playground for exploring <span className="text-indigo-400 font-medium">Human-In-The-Loop</span>,{' '}
          <span className="text-violet-400 font-medium">Time Travel</span>, and{' '}
          <span className="text-sky-400 font-medium">State Modification</span> in LangGraph agentic pipelines.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold
              bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
              text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50
              transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Zap className="w-5 h-5" />
            Start New Workflow
          </button>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
              glass border border-white/10 text-slate-300 hover:text-white hover:border-indigo-500/30
              transition-all duration-200 hover:scale-105"
          >
            Open Workspace
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className={`glass p-5 rounded-xl border text-left ${f.bg} hover:scale-[1.02] transition-transform cursor-default`}
              >
                <div className={`flex items-center gap-2 mb-2 ${f.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{f.title}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Start form modal */}
      {showForm && <StartWorkflowForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
