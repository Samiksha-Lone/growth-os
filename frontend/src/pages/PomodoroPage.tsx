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
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Focus Timer</h2>
        <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600 }}>
          {sessionsDone} session{sessionsDone !== 1 ? 's' : ''} completed today
        </span>
      </div>

      {/* Session selector */}
      <div style={{ display: 'flex', gap: '8px', width: 'fit-content' }}>
        {SESSIONS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => { setSessionIdx(i); }}
            style={{
              padding: '8px 18px', borderRadius: '8px',
              background: sessionIdx === i ? '#1d1d1d' : 'transparent',
              color: sessionIdx === i ? '#fff' : '#555',
              border: sessionIdx === i ? '1px solid #2a2a2a' : '1px solid transparent',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Timer Card */}
      <Card className="primary" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
        {/* SVG Ring Timer */}
        <div style={{ width: '170px', height: '170px', position: 'relative' }}>
          <svg width="170" height="170" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#111" strokeWidth="3" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke={currentSession.label === 'Focus' ? '#3a86ff' : '#06d6a0'}
              strokeWidth="3"
              strokeDasharray="289"
              strokeDashoffset={289 - (289 * progress) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', fontFamily: 'monospace' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
              {currentSession.label}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={toggle}
            style={{ padding: '10px 24px', background: isActive ? '#1a1a1a' : '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', minWidth: '100px', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {isActive ? 'Pause' : timeLeft < totalSeconds ? 'Resume' : 'Start'}
          </Button>
          <Button
            onClick={reset}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', minWidth: '80px', fontSize: '0.9rem' }}
          >
            Reset
          </Button>
        </div>

        {/* Session info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#555', padding: '8px 12px', background: '#0a0a0a', borderRadius: '8px', border: '1px solid #1a1a1a' }}>
            <span>Target: <strong style={{ color: '#fff' }}>{currentSession.duration}:00</strong></span>
            <span>Ends ~ {new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Sessions done indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            {Array.from({ length: Math.max(4, sessionsDone + 1) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i < sessionsDone ? '#3a86ff' : '#1a1a1a',
                  border: i < sessionsDone ? '1px solid #3a86ff' : '1px solid #222',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
            <span style={{ fontSize: '0.65rem', color: '#444', marginLeft: '4px' }}>
              {sessionsDone}/4 sessions
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
