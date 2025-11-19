'use client';

import React, { JSX } from 'react';
import { motion } from 'motion/react';
import styles from './animated-background.module.css';
import AnimatedWave from '../animated-wave/animated-wave';

interface AnimatedBackgroundProps {
  waiting?: boolean;
}

export function AnimatedBackground({ waiting }: AnimatedBackgroundProps): JSX.Element {
  return (
    <div className={styles.container}>
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Glowing filters */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Grid pattern */}
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>

        {/* Grid background */}
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Animated lines */}
        { waiting && <>
          <AnimatedWave d="M 0 200 Q 400 100 800 200 T 1600 200" color="#f59e0b" duration={4} />
          <AnimatedWave d="M 0 400 Q 600 300 1200 400 T 2400 400" color="#fb923c" duration={5} delay={1} />
          <AnimatedWave d="M 0 600 Q 500 500 1000 600 T 2000 600" color="#fbbf24" duration={4.5} delay={2} />
        </> }

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.circle
            key={i}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r={Math.random() * 3 + 1}
            fill={i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#fb923c' : '#fbbf24'}
            opacity="0.4"
            filter="url(#glow)"
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}

        {/* Scanning line */}
        <motion.line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.3"
          filter="url(#glow)"
          animate={{
            y1: ['0%', '100%'],
            y2: ['0%', '100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    </div>
  );
}
