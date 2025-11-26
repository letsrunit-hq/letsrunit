import React from 'react';
import styles from './page.module.css';
import { ProjectFeatures } from '@/components/project-features';
import { ProjectPanel } from '@/components/project-panel';
import { getProject } from '@letsrunit/model';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import type { UUID } from 'node:crypto';
import { Chip } from 'primereact/chip';
import { cn, isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase });

  if (!project) return notFound();

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      <div className="mb-4">
        <div className="flex flex-row align-items-center">
          {project.favicon && <Chip className={cn('tile', project.favicon, 'mr-3')} image={project.favicon}/>}
          <h1 className={styles.title}>{project.title}</h1>
        </div>
      </div>

      <ProjectPanel className="mb-4" project={project} />

      <ProjectFeatures projectId={id} />
    </div>
  );
}
