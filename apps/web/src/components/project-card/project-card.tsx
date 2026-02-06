'use client';

import { Project } from '@letsrunit/model';
import { cn } from '@letsrunit/utils';
import { Globe, Lightbulb, TestTube, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card } from 'primereact/card';
import React from 'react';
import { Tile } from '../tile/tile';

export interface ProjectCardProps {
  project: Project;
  className?: string;
}

function getPassRateColor(rate = 0) {
  if (rate >= 90) return 'text-green-400';
  if (rate >= 70) return 'text-orange-400';
  return 'text-red-400';
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const header = (
    <div className="flex align-items-start justify-content-between p-4 pb-0">
      <div className="flex align-items-start gap-3">
        {project.favicon && <Tile image={project.favicon} />}

        <div className="min-w-0">
          <h3 className="text-white font-semibold text-lg m-0 mb-1 truncate group-hover:text-orange-400 transition-colors">
            {project.name || project.url.replace(/^https?:\/\/(www\.)?/, '')}
          </h3>
          <div className="flex align-items-center gap-2 text-xs text-zinc-500">
            <Globe width="1rem" height="1rem" />
            <span className="truncate">{project.url}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const content = project.description && (
    <p className="text-zinc-400 text-sm m-0 line-clamp-2 p-0" style={{ minHeight: '2.5rem' }}>
      {project.description}
    </p>
  );

  const footer = (
    <div className="flex align-items-center font-medium' gap-3 pt-0">
      <div className="flex align-items-center gap-2 text-primary font-bold">
        <TestTube className="w-6 h-6" />
        <span>{project.testsCount}</span>
      </div>
      <div className="flex align-items-center gap-2 text-blue-500 font-bold">
        <Lightbulb className="w-6 h-6" />
        <span>{project.suggestionsCount}</span>
      </div>
      <div className={cn(getPassRateColor(project.passRate), 'flex align-items-center gap-2 ml-auto')}>
        <TrendingUp className="w-4 h-4" />
        <span>{project.passRate ? `${project.passRate}%` : '–'}</span>
      </div>
    </div>
  );

  return (
    <Link href={`/projects/${project.id}`} className="no-underline block h-full group">
      <Card
        header={header}
        footer={footer}
        className={cn('h-full transition-all', className)}
        pt={{
          body: { className: 'p-4' },
          content: { className: 'pb-4' },
          footer: { className: 'p-0' },
        }}
      >
        {content}
      </Card>
    </Link>
  );
}

export default ProjectCard;
