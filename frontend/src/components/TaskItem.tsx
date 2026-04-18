import { Task } from '../lib/types';
import { fireCelebration } from '../lib/rewards';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onStart?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskItem({ task, onToggle, onStart, onEdit, onDelete }: TaskItemProps) {
  const handleToggle = (e: React.MouseEvent) => {
    if (task.status !== 'Completed') {
      fireCelebration(e.clientX, e.clientY);
    }
    onToggle();
  };

  const isInProgress = task.status === 'In Progress';

  return (
    <div 
      className={`task-preview-item group py-4 flex justify-between items-center transition-all duration-300 border-b border-[#1a1a1a] last:border-0 ${isInProgress ? 'border-l-[3px] border-l-[#3a86ff] bg-[#3a86ff]/[0.02] pl-3' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div 
          className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''} transition-all duration-200`}
          onClick={handleToggle}
        >
          {task.status === 'Completed' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <div className="flex flex-col">
          <span className={`text-[0.95rem] transition-all duration-300 ${task.status === 'Completed' ? 'text-secondary/50 line-through' : 'text-white'} ${isInProgress ? 'font-black' : 'font-semibold'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-3 mt-0.5">
            {task.startTime && (
              <span className="text-[0.72rem] text-[#444] font-black uppercase tracking-wider flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {task.startTime}
              </span>
            )}
            {isInProgress && (
              <span className="text-[0.65rem] text-[#3a86ff] font-black uppercase tracking-[1.5px] animate-pulse">
                Active Session
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`task-tag text-[0.65rem] px-2 py-0.5 rounded cursor-default uppercase font-black tracking-wider transition-colors duration-200 ${task.status === 'Completed' ? 'opacity-40' : ''} tag-${task.category?.toLowerCase() || 'personal'}`}>
          {task.category || 'Personal'}
        </span>
        
        <div className="flex gap-1 opacity-20 group-hover:opacity-100 transition-opacity duration-200">
          {onStart && task.status === 'Pending' && (
            <button 
              onClick={onStart}
              className="p-1.5 text-[#3a86ff] hover:scale-110 active:scale-95 transition-all outline-none"
              title="Focus Session"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={onEdit}
            className="p-1.5 text-secondary hover:text-white transition-colors outline-none"
            title="Edit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button 
            onClick={onDelete}
            className="p-1.5 text-secondary hover:text-red-500 transition-colors outline-none"
            title="Remove"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
