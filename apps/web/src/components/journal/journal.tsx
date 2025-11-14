'use client';

import React from 'react';
import { Galleria } from 'primereact/galleria';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
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
      return { icon: 'pi pi-book' };
    case 'debug':
      return { icon: 'pi pi-info-circle' };
    case 'info':
    default:
      return { icon: 'pi pi-circle' };
  }
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
}

export function Journal({ data }: JournalProps) {
  const screenshots = React.useMemo(() => {
    return data.entries
      .map((entry) => entry.artifacts)
      .flat()
      .map((image) => ({ itemImageSrc: image.url, alt: image.name || 'screenshot' }));
  }, [data.entries]);

  const [showGallery, setShowGallery] = React.useState(() => !isMobile());

  React.useEffect(() => {
    setShowGallery(!isMobile());
  }, []);

  return (
    <div className="grid">
      {/* Left: Screenshots (hidden on mobile) */}
      {showGallery && (
        <div className="col-12 md:col-7">
          <Card>
            {screenshots.length > 0 ? (
              <Galleria
                value={screenshots}
                numVisible={4}
                circular
                autoPlay
                transitionInterval={4000}
                showThumbnails
                showIndicators
                style={{ maxWidth: '100%' }}
              />
            ) : (
              <div className="text-500">No screenshots yet.</div>
            )}
          </Card>
        </div>
      )}

      {/* Right: Journal entries */}
      <div className={showGallery ? 'col-12 md:col-5' : 'col-12'}>
        <Card title="Journal">
          <ul aria-label="journal-entries" className="list-none p-0 m-0">
            {data.entries.map((e) => {
              const st = statusIcon(e.type);
              return (
                <li key={e.id} className="flex gap-3 align-items-start py-2">
                  <i className={`${st.icon} text-lg`} aria-hidden />
                  <div className="flex flex-column gap-1 w-full">
                    <div className="flex align-items-center gap-2">
                      <span className="font-medium">{e.message}</span>
                      {st.severity && <Tag value={e.type} severity={st.severity} rounded />}
                    </div>
                    {e.artifacts && e.artifacts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {e.artifacts.map((a) => (
                          <a
                            key={a.url}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex align-items-center gap-2"
                          >
                            <i className="pi pi-image" aria-hidden />
                            <span className="text-sm">{a.name || 'screenshot'}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    <Divider className="my-2" />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default Journal;
