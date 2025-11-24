import React from 'react';
import { Panel } from 'primereact/panel';

export type ProjectPanelProps = {
  className?: string;
  children?: React.ReactNode;
};

export function ProjectPanel({ className, children }: ProjectPanelProps) {
  return (
    <Panel className={className} pt={{ content: { className: 'p-0' } }}>
      <div className="grid gap-3 md:gap-4">
        {/* Left column - Screenshot */}
        <div className="col-12 md:col-5">
          <div className="surface-900 border-1 surface-border border-round overflow-hidden" style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            {/* Placeholder preview area; theme handles colors */}
          </div>
        </div>

        {/* Right column - Details */}
        <div className="col-12 md:col-7 flex flex-column gap-3">
          <div>
            <div className="text-500">URL</div>
            <a href="https://ecommerce.example.com" className="inline-flex align-items-center gap-2">
              ecommerce.example.com
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div>
            <div className="text-500">Description</div>
            <div>Full-stack e-commerce platform with BDD testing</div>
          </div>
          <div>
            <div className="text-500">Language</div>
            <div>Dutch</div>
          </div>
          {children}
        </div>
      </div>
    </Panel>
  );
}

export default ProjectPanel;
