import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  progress?: number;
  color?: string;
}

export function StatCard({ title, value, description, progress, color = '#00bfff' }: StatCardProps) {
  const parts = value.split(' / ');
  const mainValue = parts[0];
  const denominator = parts.length > 1 ? ` / ${parts[1]}` : '';

  return (
    <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '24px' }}>
      <p className="stat-card-title" style={{ color: '#a0a0a0', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>{title}</p>
      
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
          {mainValue}
          <span style={{ color: '#555', fontSize: '1.1rem', marginLeft: '4px' }}>{denominator}</span>
        </div>
        
        {/* Indicator Segments from Mockup */}
        <div style={{ display: 'flex', gap: '3px' }}>
           <div style={{ width: '8px', height: '14px', borderRadius: '2px', background: '#333' }}></div>
           <div style={{ width: '8px', height: '14px', borderRadius: '2px', background: '#333' }}></div>
           <div style={{ width: '8px', height: '14px', borderRadius: '2px', background: '#1a1a1a' }}></div>
        </div>
      </div>
      
      {description && (
        <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '4px', fontWeight: 500 }}>{description}</p>
      )}
      
      {progress !== undefined && (
        <div className="progress-container" style={{ marginTop: '16px', background: '#1a1a1a', height: '4px' }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(100, progress)}%`, 
              background: color,
              height: '100%',
              borderRadius: '2px',
              boxShadow: `0 0 10px ${color}22`
            }} 
          />
        </div>
      )}
    </div>
  );
}
