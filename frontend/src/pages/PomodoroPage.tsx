import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { savePomodoroSession } from '../api/growthos';

const defaultSeconds = 25 * 60;

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      pushToast('Session complete!');
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, pushToast]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Focus Timer</h2>
      </div>

      <Card className="primary" style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', position: 'relative', overflow: 'hidden' }}>
        {/* Glow Background */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'rgba(58, 134, 255, 0.08)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div className="timer-display" style={{ width: '240px', height: '240px', position: 'relative' }}>
          <svg width="240" height="240" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
             <circle cx="50" cy="50" r="46" fill="none" stroke="#0a0a0a" strokeWidth="2" />
             <circle 
               cx="50" cy="50" r="46" fill="none" stroke="#2a2a2a" strokeWidth="2" 
               strokeDasharray="2.5 1.5"
             />
             <circle 
               cx="50" cy="50" r="46" fill="none" stroke="#3a86ff" strokeWidth="3" 
               strokeDasharray="289" strokeDashoffset={289 - (289 * progress) / 100}
               strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }}
             />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
             <div style={{ fontSize: '3.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', fontFamily: 'monospace' }}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
             </div>
             <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Deep Work</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
           <Button onClick={toggle} style={{ padding: '10px 24px', background: isActive ? '#0f0f0f' : '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', minWidth: '110px' }}>
             {isActive ? 'Pause' : 'Start'}
           </Button>
           <Button onClick={reset} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid #1a1a1a', color: '#444', minWidth: '110px' }}>
             Reset
           </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', width: '280px', zIndex: 1 }}>
           <div className="compact-card" style={{ border: '1px solid #1a1a1a', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#7d7d7d' }}>
                 <span>Target: <strong>25:00</strong></span>
                 <span style={{ color: '#444' }}>Ends ~ {new Date(Date.now() + timeLeft * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
           </div>
           <Button style={{ padding: '12px', background: '#3a86ff10', color: '#3a86ff', border: '1px solid #3a86ff20', fontSize: '0.8rem', fontWeight: 700 }}>
             LOG SESSION
           </Button>
        </div>
      </Card>
    </div>
  );
}
