import React, { MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, className = '', children, ...rest }: CardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.section 
      className={`card ${className}`} 
      onMouseMove={handleMouseMove}
      initial="initial"
      whileHover="hover"
      style={{ position: 'relative', overflow: 'hidden' }}
      {...rest as any}
    >
      <motion.div
        variants={{
          initial: { opacity: 0 },
          hover: { opacity: 1 }
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(0, 191, 255, 0.06), transparent 80%)`
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {title ? <div className="card-title">{title}</div> : null}
        <div className="card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>{children}</div>
      </div>
    </motion.section>
  );
}
