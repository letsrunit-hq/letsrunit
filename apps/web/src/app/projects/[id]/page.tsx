import { ProjectFeatures } from '@/components/project-features';
import { ProjectPanel } from '@/components/project-panel';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import { getProject, listFeatures } from '@letsrunit/model';
import { cn, isUUID } from '@letsrunit/utils';
import { History, Play, Settings } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { UUID } from 'node:crypto';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import React from 'react';
import styles from './page.module.css';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase });

  if (!project) return notFound();

  const features = await listFeatures(id, { supabase });

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      <div className="mb-4">
        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between">
          <div className="flex flex-row align-items-center mb-3 md:mb-0">
            {project.favicon && <Chip className={cn('tile', project.favicon, 'mr-3')} image={project.favicon} />}
            <h1 className={styles.title}>{project.title}</h1>
          </div>
          <div className="flex flex-row gap-2 justify-content-end">
            <Button
              aria-label="Run all"
              label="Run all"
              icon={<Play key="icon" size={16} className="mr-2" />}
              severity="secondary"
            />
            <Button aria-label="Run history" icon={<History key="icon" size={24} />} severity="secondary" />
            <Button aria-label="Settings" icon={<Settings key="icon" size={24} />} severity="secondary" />
          </div>
        </div>
      </div>

      <ProjectPanel className="mb-4" project={project} />

      <ProjectFeatures projectId={id} baseUrl={project.url} features={features} />
    </div>
  );
}
