'use client';

import React from 'react';
import { Timeline } from 'primereact/timeline';
import { Tag } from 'primereact/tag';
import type { Journal, JournalEntry } from '@letsrunit/model';

export interface JournalProps {
  data: Journal;
}

function statusIcon(type: JournalEntry['type']): { icon: string; severity?: 'success' | 'danger' | 'info' } {
  switch (type) {
    case 'success':
      return { icon: 'pi pi-check', severity: 'success' };
    case 'failure':
    case 'error':
      return { icon: 'pi pi-times', severity: 'danger' };
    case 'prepare':
      return { icon: 'pi pi-spinner pi-spin', severity: 'info' };
    case 'warn':
      return { icon: 'pi pi-exclamation-triangle', severity: 'info' };
    case 'title':
      return { icon: 'pi pi-circle-fill' };
    case 'debug':
      return { icon: 'pi pi-info-circle' };
    case 'info':
    default:
      return { icon: 'pi pi-circle' };
  }
}

export function Journal({ data }: JournalProps) {
  return (
    <div aria-label="journal-entries">
      <Timeline
        value={data.entries}
        align="left"
        marker={(item: JournalEntry) => {
          const st = statusIcon(item.type);
          return (
            <span className="flex align-items-center justify-content-center w-2rem h-2rem border-circle bg-primary-50">
              <i className={`${st.icon} text-primary`} aria-hidden />
            </span>
          );
        }}
        content={(item: JournalEntry) => {
          const st = statusIcon(item.type);
          return (
            <div className="flex align-items-center gap-2 py-2">
              <span className="font-medium">{item.message}</span>
              {st.severity && <Tag value={item.type} severity={st.severity} rounded />}
            </div>
          );
        }}
      />
    </div>
  );
}

export default Journal;
