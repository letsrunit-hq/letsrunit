import { Screenshot } from '@/components/screenshot';
import type { Project } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import ISO6391 from 'iso-639-1';
import { ExternalLink } from 'lucide-react';
import { Panel } from 'primereact/panel';
import React from 'react';

export type ProjectPanelProps = {
  className?: string;
  project: Project;
};

export function ProjectPanel({ className, project }: ProjectPanelProps) {
  // Derive hostname for display purposes
  const hostname = React.useMemo(() => {
    try {
      return new URL(project.url).hostname;
    } catch {
      return project.url;
    }
  }, [project.url]);

  return (
    <Panel className={cn(className, 'mobile-full')}>
      <div className="flex flex-column md:flex-row gap-4">
        {/* Left column - Screenshot */}
        <div className="w-full md:w-5">
          <Screenshot
            src={project.screenshot}
            alt={`${hostname} screenshot`}
            width={1920}
            height={1280}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Right column - Details */}
        <div className="w-full md:w-7 flex flex-column gap-3">
          <div>
            <div className="text-300">URL</div>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex align-items-center gap-2"
            >
              {hostname}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          {project.description && (
            <div>
              <div className="text-300">Description</div>
              <div>{project.description}</div>
            </div>
          )}
          {project.lang && (
            <div>
              <div className="text-300">Language</div>
              <div>{ISO6391.getName(project.lang) || project.lang}</div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default ProjectPanel;
