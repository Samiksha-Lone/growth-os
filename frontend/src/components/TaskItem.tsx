import { Task } from '../lib/types';
import { fireCelebration } from '../lib/rewards';

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const handleToggle = (e: React.MouseEvent) => {
    if (task.status !== 'Completed') {
      fireCelebration(e.clientX, e.clientY);
    }
    onToggle();
  };

  return (
    <div className="task-preview-item" style={{ borderBottom: '1px solid #2a2a2a', padding: '16px 0', borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div 
          className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`}
          onClick={handleToggle}
        >
          {task.status === 'Completed' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <span style={{ color: task.status === 'Completed' ? '#7d7d7d' : '#fff', textDecoration: task.status === 'Completed' ? 'line-through' : 'none', fontWeight: 500 }}>
          {task.title}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className={`task-tag ${task.category?.toLowerCase() || 'personal'}`}>
          {task.category || 'Personal'}
        </span>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={onEdit}
            style={{ background: 'transparent', color: '#7d7d7d', padding: '4px' }}
            title="Edit Task"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button 
            onClick={onDelete}
            style={{ background: 'transparent', color: '#7d7d7d', padding: '4px' }}
            title="Delete Task"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
