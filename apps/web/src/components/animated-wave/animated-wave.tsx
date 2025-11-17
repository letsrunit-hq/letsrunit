import React from 'react';
import { motion } from 'framer-motion';

export type AnimatedWaveProps = {
  d: string,
  color: string,
  duration: number,
  delay?: number,
  className?: string,
};

export function AnimatedWave({ d, color, duration, delay = 0, className }: AnimatedWaveProps) {
  return (
    <g className={className}>
      {/* Glow */}
      <motion.path
        d={d}
        stroke={color}
        strokeWidth="10"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
        style={{ filter: 'blur(12px)' }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1, 0],
          opacity: [0, 0.25, 0.25, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      />

      {/* Main line */}
      <motion.path
        d={d}
        stroke={color}
        strokeWidth="2"
        fill="none"
        opacity="0.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1, 0],
          opacity: [0, 0.6, 0.6, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        }}
      />
    </g>
  );
}

export default AnimatedWave;
