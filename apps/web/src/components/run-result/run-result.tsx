'use client';

import { startExploreRun } from '@/actions/explore';
import { startGenerateRun } from '@/actions/generate';
import { startTestRun } from '@/actions/run';
import { RunTimeline, RunTimelineSkeleton } from '@/components/run-timeline';
import { Screenshot } from '@/components/screenshot';
import { SubtleHeader } from '@/components/subtle-header';
import type { Artifact, Feature, Journal, Project, Run } from '@letsrunit/model';
import { AreaGrid, AreaSlot } from 'areagrid';
import ISO6391 from 'iso-639-1';
import { Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import React, { useEffect } from 'react';
import RunHeader from '../run-header/run-header';
import styles from './run-result.module.css';

export interface JournalProps {
  project?: Project;
  feature?: Feature | null;
  run: Run;
  journal?: Journal;
  loading?: boolean;
  children?: React.ReactNode;
}

export function RunResult({ project, feature, run, journal, loading, children }: JournalProps) {
  const [screenshot, setScreenshot] = React.useState<Artifact | null>(null);
  const [retrying, setRetrying] = React.useState(false);
  const router = useRouter();

  const onRetry = async () => {
    setRetrying(true);
    try {
      let runId: string;
      switch (run.type) {
        case 'explore':
          runId = await startExploreRun(run.target, { projectId: run.projectId });
          break;
        case 'generate':
          runId = await startGenerateRun(run.featureId!);
          break;
        case 'test':
          runId = await startTestRun(run.featureId!);
          break;
      }
      router.push(`/runs/${runId}`);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (run.status !== 'running') return;
    const entry = journal?.entries.findLast((e) => e.screenshot);
    if (entry) setScreenshot(entry.screenshot!);
  }, [run.status, journal?.entries]);

  return (
    <AreaGrid
      areas={{
        base: `
          "header"
          "screenshot"
          "timeline"
          "project"
          "children"
        `,
        lg: `
          "header timeline"
          "screenshot timeline"
          "project timeline"
          "children timeline"
        `,
      }}
      columns={{
        base: '1fr',
        lg: '2fr 1fr',
      }}
      breakpoints={{
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        '2xl': '1440px',
      }}
      gap="0.25rem 2rem"
    >
      <AreaSlot name="header">
        <RunHeader run={run} journal={journal} feature={feature} />
      </AreaSlot>

      <AreaSlot name="screenshot">
        <Screenshot src={screenshot?.url} alt={screenshot?.name} width={1920} height={1080} />
      </AreaSlot>

      <AreaSlot name="project">
        {run.type === 'explore' && project?.description && (
          <div>
            <SubtleHeader className="mt-6 mb-3">Project info</SubtleHeader>
            <h4 className="mb-1">
              {project!.name}
              {project.lang && (
                <Tag
                  value={ISO6391.getName(project.lang) || project.lang}
                  icon={<Languages width={14} />}
                  rounded
                  className="ml-3 text-sm vertical-align-bottom"
                  severity="secondary"
                />
              )}
            </h4>
            {project!.description}
          </div>
        )}
      </AreaSlot>

      <AreaSlot name="children">{children}</AreaSlot>

      <AreaSlot name="timeline">
        <div className={styles.timeline}>
          {loading && <RunTimelineSkeleton />}
          {!loading && (
            <RunTimeline
              className="mt-2 lg:mt-0"
              type={run.type}
              status={run.status}
              entries={journal?.entries ?? []}
              onSelect={(entry) => setScreenshot(entry.screenshot ?? null)}
            />
          )}
          {run.type === 'explore' && run.status === 'passed' && project && (
            <Button label="Continue" className="w-full mt-6" onClick={() => router.push(`/projects/${project.id}`)} />
          )}
          {(run.status === 'failed' || run.status === 'error') && (
            <Button
              label="Retry"
              className="w-full mt-6"
              onClick={onRetry}
              loading={retrying}
              severity="secondary"
              outlined
            />
          )}
        </div>
      </AreaSlot>
    </AreaGrid>
  );
}

export default RunResult;
