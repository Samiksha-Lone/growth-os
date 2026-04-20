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
    <div className="stat-card flex flex-col items-start !p-4 md:!p-6">
      <p className="stat-card-title text-[#a0a0a0] text-[0.7rem] md:text-[0.8rem] mb-2 md:mb-3 font-semibold uppercase tracking-wider">{title}</p>
      
      <div className="flex items-baseline justify-between w-full mb-1">
        <div className="text-[1.3rem] md:text-[1.6rem] font-bold tracking-tight text-white">
          {mainValue}
          <span className="text-[#555] text-[0.9rem] md:text-[1.1rem] ml-1">{denominator}</span>
        </div>
        
        {/* Indicator Segments from Mockup */}
        <div className="hidden sm:flex gap-[3px]">
           <div className="w-[8px] h-[14px] rounded-[2px] background: #333' bg-[#333]"></div>
           <div className="w-[8px] h-[14px] rounded-[2px] background: #333' bg-[#333]"></div>
           <div className="w-[8px] h-[14px] rounded-[2px] background: #1a1a1a' bg-[#1a1a1a]"></div>
        </div>
      </div>
      
      {description && (
        <p className="text-[#555] text-[0.7rem] md:text-[0.75rem] mt-1 font-medium leading-tight">{description}</p>
      )}
      
      {progress !== undefined && (
        <div className="progress-container w-full mt-4 bg-[#1a1a1a] h-1 md:h-1.5 rounded-full overflow-hidden">
          <div 
            className="progress-fill h-full transition-all duration-300" 
            style={{ 
              width: `${Math.min(100, progress)}%`, 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}44`
            }} 
          />
        </div>
      )}
    </div>
  );
}
