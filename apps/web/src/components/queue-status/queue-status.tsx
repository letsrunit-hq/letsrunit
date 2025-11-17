import { motion } from 'motion/react';
import React from 'react';
import { Card } from 'primereact/card';
import './queue-status.css';

export function QueueStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
      style={{ maxWidth: '28rem', position: 'relative', zIndex: 100 }}
    >
      <Card className="queue-status-card border-round-xl shadow-4 p-4">
        <div className="flex flex-column align-items-center text-center gap-3">
          <div className="relative">
            <motion.div
              className="absolute top-0 left-0 w-full h-full border-round-xl"
              style={{
                background: 'var(--primary-color)',
                filter: 'blur(16px)',
                opacity: 0.2,
              }}
              animate={{
                scale: [1.1, 1.3, 1.1],
                opacity: [0.3, 0.75, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <div
              className="relative border-round-xl flex align-items-center justify-content-center"
              style={{
                padding: '1rem',
                background: 'linear-gradient(135deg, var(--primary-color), var(--primary-700))',
                color: 'var(--primary-color-text)',
              }}
            >
              <i className="pi pi-cog" style={{ fontSize: '2rem' }} aria-hidden="true" />
            </div>
          </div>

          <div>
            <h1 className="m-0 mb-2 text-color">Request Queued</h1>
            <p className="m-0 text-color-secondary">Your request is being processed</p>
          </div>

          <div className="queue-status-panel w-full border-1 border-round-lg p-4">
            <div className="mb-2 text-500">Estimated Wait Time</div>
            <div className="text-color">&lt; 1 minute</div>
          </div>
        </div>
      </Card>

      {/* Animated dots */}
      <div className="mt-4 flex align-items-center justify-content-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="border-round"
            style={{ width: '0.375rem', height: '0.375rem', background: 'var(--primary-color)' }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default QueueStatus;
