/**
 * components/layout/Sidebar.tsx
 * Left sidebar — thread list + new workflow button.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useRef, useState } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWorkflow } from '../../hooks/useWorkflow';
import { cn, shortId } from '../../lib/utils';

interface Props {
  onNewWorkflow: () => void;
}

function HoverMarquee({ text, active, parentHovered }: { text: string; active: boolean; parentHovered: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const containerWidth = containerRef.current?.clientWidth || 0;
  const textWidth = textRef.current?.scrollWidth || 0;
  const overflowAmount = Math.max(0, textWidth - containerWidth);
  const shouldScroll = overflowAmount > 0;

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-hidden whitespace-nowrap"
      style={{ maskImage: shouldScroll ? 'linear-gradient(to right, black 90%, transparent 100%)' : 'none', WebkitMaskImage: shouldScroll ? 'linear-gradient(to right, black 90%, transparent 100%)' : 'none' }}
    >
      <motion.div
        ref={textRef}
        className={cn(
          'font-mono text-xs inline-block',
          active ? 'text-[#e8e0da]' : 'text-[#8f7f7c]'
        )}
        animate={{ 
          x: parentHovered && shouldScroll ? -overflowAmount - 10 : 0 
        }}
        transition={{ 
          duration: shouldScroll ? Math.max(overflowAmount / 40, 1.5) : 0, 
          ease: "linear" 
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

export function Sidebar({ onNewWorkflow }: Props) {
  const { threads, activeThreadId } = useWorkflowStore();
  const { switchThread, deleteThread } = useWorkflow();

  return (
    <aside className="w-150 flex-shrink-0 glass border-r border-[rgba(122,17,40,0.18)] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 pr-10 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#8f7f7c] uppercase tracking-widest">
            Threads
          </h2>
          <span className="text-xs text-[#5a4a48] bg-surface-700 px-2 py-0.5 rounded-full">
            {threads.length}
          </span>
        </div>
        <button
          onClick={onNewWorkflow}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
            bg-[#7a1128] hover:bg-[#9c1a37]
            text-[#e8e0da] text-xs font-semibold transition-all duration-200 shadow-lg shadow-[#7a1128]/20
            hover:shadow-[#7a1128]/35 hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <AnimatePresence>
          {threads.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-[#3a2626] mx-auto mb-2" />
              <p className="text-xs text-[#5a4a48]">No threads yet</p>
              <p className="text-xs text-[#3a2626] mt-1">Start a workflow above</p>
            </div>
          ) : (
            [...threads].reverse().map((thread, i) => {
              const isActive = activeThreadId === thread.thread_id;
              return (
                <SidebarItem 
                  key={thread.thread_id} 
                  thread={thread} 
                  isActive={isActive} 
                  i={i} 
                  switchThread={switchThread} 
                  deleteThread={deleteThread} 
                />
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs text-[#5a4a48] text-center">
          SQLite • Persistent
        </p>
      </div>
    </aside>
  );
}

function SidebarItem({ thread, isActive, i, switchThread, deleteThread }: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: i * 0.05 }}
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
        isActive
          ? 'bg-[#7a1128]/15 border border-[rgba(122,17,40,0.3)]'
          : 'hover:bg-[rgba(122,17,40,0.05)] border border-transparent'
      )}
      onClick={() => switchThread(thread.thread_id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isActive ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#9c1a37] flex-shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-[#5a4a48] flex-shrink-0" />
      )}
      
      <HoverMarquee 
        text={thread.task ? thread.task : shortId(thread.thread_id)} 
        active={isActive} 
        parentHovered={isHovered} 
      />

      <button
        onClick={(e) => { e.stopPropagation(); deleteThread(thread.thread_id); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20
          text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
        title="Delete thread"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
