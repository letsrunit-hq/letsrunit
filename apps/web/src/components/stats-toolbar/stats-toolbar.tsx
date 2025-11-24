import React from 'react';
import { cn } from '@letsrunit/utils';
import styles from '@/app/projects/[id]/page.module.css';

export type StatsToolbarProps = {
  className?: string;
  totalFeatures: number;
  activeTests: number;
  suggestions: number;
  passRate: string | number; // allow pre-formatted like '75%'
};

export function StatsToolbar({ className, totalFeatures, activeTests, suggestions, passRate }: StatsToolbarProps) {
  const passRateDisplay = typeof passRate === 'number' ? `${passRate}%` : passRate;
  return (
    <div className={cn('mt-5 pt-4 text-center', className)} style={{ borderTop: '1px solid var(--surface-border)' }}>
      <div className="grid grid-nogutter md:col-12">
        <div className="hidden md:block md:col-3">
          <div className={cn(styles.muted, 'mb-2')}>Total Features</div>
          <div className={styles.statValue}>{totalFeatures}</div>
        </div>
        <div className="col-6 md:col-3">
          <div className={cn(styles.muted, 'mb-2')}>Test cases</div>
          <div className={styles.statValue}>{activeTests}</div>
        </div>
        <div className="col-6 md:col-3">
          <div className={cn(styles.muted, 'mb-2')}>Suggestions</div>
          <div className={styles.statValue}>{suggestions}</div>
        </div>
        <div className="col-12 md:col-3">
          <div className={cn(styles.muted, 'mb-2')}>Pass Rate</div>
          <div className={styles.passRate}>{passRateDisplay}</div>
        </div>
      </div>
    </div>
  );
}

export default StatsToolbar;
