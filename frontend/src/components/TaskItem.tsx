import { Task } from '../lib/types';
import { fireCelebration } from '../lib/rewards';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onStart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compactOnMobile?: boolean;
}

export function TaskItem({ task, onToggle, onStart, onEdit, onDelete, compactOnMobile = false }: TaskItemProps) {
  const handleToggle = (e: React.MouseEvent) => {
    if (task.status !== 'Completed') {
      fireCelebration(e.clientX, e.clientY);
    }
    onToggle();
  };

  const isInProgress = task.status === 'In Progress';

  return (
    <div 
      className={`task-preview-item group flex items-center justify-between border-b border-white/5 py-3.5 sm:py-4 transition-all duration-300 last:border-0 ${compactOnMobile ? 'min-w-0 gap-3' : ''} ${isInProgress ? 'border-l-[3px] border-l-accent bg-accent/[0.04] pl-3' : ''}`}
    >
      <div className={`flex items-center gap-3 sm:gap-4 ${compactOnMobile ? 'min-w-0 flex-1' : ''}`}>
        <div 
          className={`task-checkbox ${compactOnMobile ? 'shrink-0' : ''} ${task.status === 'Completed' ? 'checked' : ''} transition-all duration-200`}
          onClick={handleToggle}
        >
          {task.status === 'Completed' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <div className={`flex flex-col ${compactOnMobile ? 'min-w-0' : ''}`}>
          <span className={`${compactOnMobile ? 'break-words ' : ''}text-sm sm:text-[0.95rem] transition-all duration-300 ${task.status === 'Completed' ? 'text-zinc-500 line-through' : 'text-white'} ${isInProgress ? 'font-black text-accent' : 'font-semibold'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            {task.startTime && (
              <span className="text-[0.72rem] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {task.startTime}
              </span>
            )}
            {isInProgress && (
              <span className="text-[0.65rem] text-accent font-black uppercase tracking-[1.5px] animate-pulse">
                Active Session
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={`flex items-center gap-2.5 sm:gap-4 ${compactOnMobile ? 'shrink-0' : ''}`}>
        <span className={`task-tag cursor-default rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider transition-colors duration-200 ${compactOnMobile ? 'shrink-0 px-1.5 text-[0.6rem] sm:px-2 sm:text-[0.65rem]' : ''} ${task.status === 'Completed' ? 'opacity-40' : ''} tag-${task.category?.toLowerCase() || 'personal'}`}>
          {task.category || 'Personal'}
        </span>
        
        <div className={`flex items-center gap-1 transition-opacity duration-200 ${compactOnMobile ? 'opacity-100 sm:opacity-40 sm:group-hover:opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
          {onStart && task.status === 'Pending' && (
            <button 
              onClick={onStart}
              className="p-1.5 text-accent hover:scale-110 active:scale-95 transition-all outline-none rounded-lg hover:bg-accent/10"
              title="Focus Session"
              aria-label="Start Focus Session"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={onEdit}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors outline-none rounded-lg hover:bg-white/5"
            title="Edit"
            aria-label="Edit Task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors outline-none rounded-lg hover:bg-rose-500/10"
            title="Remove"
            aria-label="Delete Task"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
