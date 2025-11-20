import React from 'react';
import { Timeline } from 'primereact/timeline';
import { Skeleton } from 'primereact/skeleton';
import styles from './run-timeline.module.css';

function markerSkeletonTemplate() {
  return (
    <div className={`flex align-items-center justify-content-center ${styles.markerBox}`}>
      <Skeleton shape="circle" width="1rem" height="1rem" />
    </div>
  );
}

function contentSkeletonTemplate() {
  return (
    <div className="flex flex-column gap-2 w-full">
      <div className="flex align-items-baseline gap-2">
        <Skeleton width="6rem" height="1rem" />
        <Skeleton width="60%" height="1rem" />
      </div>
      <Skeleton width="4rem" height="0.75rem" className="mt-1" />
    </div>
  );
}

function cryptoRandomId() {
  // Tiny helper to avoid importing extra deps for a stable key during tests
  return Math.random().toString(36).slice(2);
}

export function RunTimelineSkeleton() {
  const placeholderEvents = Array.from({ length: 4 }, () => ({ id: cryptoRandomId() }));

  return (
    <>
      <div className="mb-4">
        <h2 className="text-color mb-1">Test Steps</h2>
        <Skeleton width="10rem" height="0.875rem" />
      </div>

      <Timeline value={placeholderEvents} marker={markerSkeletonTemplate} content={contentSkeletonTemplate} />

      <div className="mt-4 pt-3 border-top-1 surface-border">
        <div className="flex align-items-center justify-content-between">
          <div className="flex align-items-center gap-2">
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <Skeleton width="5rem" height="0.875rem" />
          </div>
          <div className="flex align-items-center gap-2">
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <Skeleton width="5rem" height="0.875rem" />
          </div>
        </div>
      </div>
    </>
  );
}
