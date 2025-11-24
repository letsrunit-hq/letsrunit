import React from 'react';
import styles from './page.module.css';
import FeaturesList from '@/components/features-list';
import { StatsToolbar } from '@/components/stats-toolbar';
import ProjectPanel from '@/components/project-panel/project-panel';
import { getProject, listFeatures } from '@letsrunit/model';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import type { UUID } from 'node:crypto';
import { Chip } from 'primereact/chip';
import { cn } from '@letsrunit/utils';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase });
  const features = await listFeatures(id, { supabase });

  const totalFeatures = features.length;
  const suggestions = features.filter((f) => f.body == null).length;
  const activeTests = features.filter((f) => f.body != null).length;

  // Translate model run statuses to UI pass/fail counts
  const passed = features.filter((f) => f.lastRun?.status === 'passed').length;
  const failed = features.filter(
    (f) => f.lastRun && (f.lastRun.status === 'failed' || f.lastRun.status === 'error'),
  ).length;
  const considered = passed + failed;
  const passRate = considered > 0 ? Math.round((passed / considered) * 100) : 0;

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      <div className="mb-4">
        <div className="flex flex-row align-items-center">
          {project.favicon && <Chip className={cn('tile', project.favicon, 'mr-3')} image={project.favicon}/>}
          <h1 className={styles.title}>{project.title}</h1>
        </div>
      </div>

      <ProjectPanel className="mb-4" project={project} />

      <FeaturesList features={features} />

      <StatsToolbar
        totalFeatures={totalFeatures}
        activeTests={activeTests}
        suggestions={suggestions}
        passRate={passRate}
      />
    </div>
  );
}
