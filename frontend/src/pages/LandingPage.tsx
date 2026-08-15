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
    color: 'text-[#9c1a37]',
    bg: 'bg-[#7a1128]/10 border-[#7a1128]/25',
  },
  {
    icon: Clock,
    title: 'Time Travel',
    desc: 'Browse the full checkpoint history and fork from any past state.',
    color: 'text-[#a8626b]',
    bg: 'bg-[#8a3a2e]/10 border-[#8a3a2e]/25',
  },
  {
    icon: Edit3,
    title: 'State Modification',
    desc: 'Edit plan, draft, or critique mid-flight. The graph uses your changes on resume.',
    color: 'text-[#c4858e]',
    bg: 'bg-[#a8626b]/10 border-[#a8626b]/25',
  },
  {
    icon: Network,
    title: 'Multi-Thread',
    desc: 'Run multiple independent workflows simultaneously and switch between them.',
    color: 'text-[#8a9e88]',
    bg: 'bg-[#5c6b5a]/10 border-[#5c6b5a]/25',
  },
];

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-y-auto px-4 py-8">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#7a1128]/8 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#9c1a37]/6 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#5e0d1f]/6 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#7a1128 1px, transparent 1px), linear-gradient(to right, #7a1128 1px, transparent 1px)', backgroundSize: '40px 40px' }}
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
          className="flex items-center justify-center gap-3 mb-5"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#7a1128] flex items-center justify-center shadow-2xl shadow-[#7a1128]/30">
            <GitBranch className="w-7 h-7 text-[#e8e0da]" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold mb-3 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="gradient-text">LangGraph</span>
          <br />
          <span className="text-[#e8e0da]">HITL Explorer</span>
        </motion.h1>

        <motion.p
          className="text-base text-[#8f7f7c] mb-7 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          An interactive playground for exploring <span className="text-[#9c1a37] font-medium">Human-In-The-Loop</span>,{' '}
          <span className="text-[#a8626b] font-medium">Time Travel</span>, and{' '}
          <span className="text-[#c4858e] font-medium">State Modification</span> in LangGraph agentic pipelines.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold
              bg-[#7a1128] hover:bg-[#9c1a37]
              text-[#e8e0da] shadow-2xl shadow-[#7a1128]/30 hover:shadow-[#7a1128]/50
              transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Zap className="w-5 h-5" />
            Start New Workflow
          </button>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold
              glass border border-[rgba(122,17,40,0.35)] text-[#e8e0da] hover:border-[rgba(122,17,40,0.55)]
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
                <p className="text-xs text-[#8f7f7c] leading-relaxed">{f.desc}</p>
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
