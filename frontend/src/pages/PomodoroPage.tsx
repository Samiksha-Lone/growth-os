import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { savePomodoroSession } from '../api/growthos';

const SESSIONS = [
  { label: 'Focus', duration: 25 },
  { label: 'Short Break', duration: 5 },
  { label: 'Long Break', duration: 15 },
];

export default function PomodoroPage() {
  const [sessionIdx, setSessionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SESSIONS[0].duration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: savePomodoroSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    }
  });

  const currentSession = SESSIONS[sessionIdx];
  const totalSeconds = currentSession.duration * 60;

  useEffect(() => {
    setTimeLeft(totalSeconds);
    setIsActive(false);
  }, [sessionIdx, totalSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      if (currentSession.label === 'Focus') {
        setSessionsDone(s => s + 1);
        saveMutation.mutate({
          duration: currentSession.duration,
          timestamp: new Date().toISOString()
        });
        toast.success(`Focus session complete! ${sessionsDone + 1} done today.`);
      } else {
        toast.success('Break over. Back to focus!');
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  const toggle = () => setIsActive(a => !a);
  const reset = () => { setIsActive(false); setTimeLeft(totalSeconds); };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="page-stack !gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="title-main">Focus Timer</h1>
          <span className="text-[0.65rem] text-secondary/30 font-black uppercase tracking-[3px]">{sessionsDone} session{sessionsDone !== 1 ? 's' : ''} completed today</span>
        </div>
        
        {/* Session selector */}
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {SESSIONS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => { setSessionIdx(i); }}
              className={`px-6 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${
                 sessionIdx === i 
                 ? 'bg-[#1a1a1a] text-white shadow-lg' 
                 : 'bg-transparent text-secondary hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-12 primary">
        <div className="flex flex-col items-center w-full gap-12">
          {/* SVG Ring Timer */}
          <div className="w-[200px] h-[200px] relative">
            <svg width="200" height="200" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#0a0a0a" strokeWidth="2.5" />
              <circle
                cx="50" cy="50" r="46" fill="none"
                stroke={currentSession.label === 'Focus' ? 'var(--accent)' : '#06d6a0'}
                strokeWidth="3.5"
                strokeDasharray="290"
                strokeDashoffset={290 - (290 * progress) / 100}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 8px ${currentSession.label === 'Focus' ? 'rgba(58,134,255,0.3)' : 'rgba(6,214,160,0.3)'})` }}
              />
            </svg>
            <div className="absolute w-full text-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
              <div className="text-[3.8rem] font-black text-white tracking-[-4px] font-mono leading-none">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-[4px] mt-4">
                {currentSession.label}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={toggle}
              className={`px-14 py-4 min-w-[180px] font-black text-[0.85rem] text-white rounded-2xl transition-all shadow-2xl uppercase tracking-widest ${isActive ? 'bg-[#0a0a0a] border border-border/20' : 'bg-accent border-none hover:scale-105 active:scale-95'}`}
            >
              {isActive ? 'PAUSE' : timeLeft < totalSeconds ? 'RESUME' : 'START FOCUS'}
            </Button>
            <button
              onClick={reset}
              className="px-10 py-3 bg-transparent border border-border/10 text-secondary/40 text-[0.75rem] rounded-xl font-black uppercase tracking-widest hover:text-white hover:border-border transition-all active:scale-95"
            >
              RESET
            </button>
          </div>

          {/* Session info */}
          <div className="w-full max-w-[520px] px-4 py-4 bg-[#05070a] rounded-3xl border border-border/10 shadow-inner">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-0.5">
                <div className="text-[0.62rem] text-secondary/40 uppercase tracking-[2px] font-black">Finish</div>
                <div className="text-base font-black text-white">{new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[0.62rem] text-secondary/40 uppercase tracking-[2px] font-black">Session</div>
                <div className="text-base font-black text-white">{currentSession.label}</div>
                <div className="text-[0.75rem] text-secondary/50 uppercase tracking-[1px]">{currentSession.duration}:00 min</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[0.62rem] text-secondary/40 uppercase tracking-[2px] font-black">Progress</div>
                <div className="text-base font-black text-white">{Math.round(progress)}%</div>
                <div className="text-[0.75rem] text-secondary/50 uppercase tracking-[1px]">{sessionsDone} session{sessionsDone !== 1 ? 's' : ''} done</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
