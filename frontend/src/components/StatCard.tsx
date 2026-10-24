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
      <p className="stat-card-title text-zinc-300 text-xs sm:text-[0.8rem] mb-2 md:mb-3 font-semibold uppercase tracking-wider">
        {title}
      </p>
      
      <div className="flex items-baseline justify-between w-full mb-1">
        <div className="text-[1.3rem] md:text-[1.6rem] font-bold tracking-tight text-white">
          {mainValue}
          <span className="text-zinc-400 text-[0.85rem] md:text-[1rem] ml-1">{denominator}</span>
        </div>
        
        {/* Indicator Segments */}
        <div className="hidden sm:flex gap-[3px]">
           <div className="w-[8px] h-[14px] rounded-[2px] bg-zinc-700"></div>
           <div className="w-[8px] h-[14px] rounded-[2px] bg-zinc-700"></div>
           <div className="w-[8px] h-[14px] rounded-[2px] bg-zinc-800"></div>
        </div>
      </div>
      
      {description && (
        <p className="text-zinc-400 text-xs md:text-[0.75rem] mt-1 font-medium leading-tight">
          {description}
        </p>
      )}
      
      {progress !== undefined && (
        <div className="progress-container w-full mt-4 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className="progress-fill h-full transition-all duration-300" 
            style={{ 
              width: `${Math.min(100, Math.max(0, progress))}%`, 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}44`
            }} 
          />
        </div>
      )}
    </div>
  );
}
