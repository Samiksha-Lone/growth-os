import confetti from 'canvas-confetti';

export function fireCelebration(x: number, y: number) {
  const count = 100;
  const defaults = {
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    colors: ['#00bfff', '#ffffff', '#2a2a2a'],
    ticks: 150
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 35,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
