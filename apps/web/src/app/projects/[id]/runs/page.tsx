import { RunHistory } from '@/components/run-history';
import { SubtleHeader } from '@/components/subtle-header';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import { getProject, listRuns, maybe } from '@letsrunit/model';
import { cn, isUUID } from '@letsrunit/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { UUID } from 'node:crypto';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import React from 'react';
import styles from '../page.module.css';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase }).catch(maybe);

  if (!project) return notFound();

  const runs = await listRuns({ projectId: id }, { supabase });

  return (
    <div className={`${styles.container} p-4 md:p-6 lg:p-7`}>
      <div className="mb-4">
        <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between">
          <div className="flex flex-row align-items-center mb-3 md:mb-0">
            <Link href={`/projects/${id}`} passHref>
              <Button className="mr-4" aria-label="Run history" text icon={<ArrowLeft key="icon" size={24} />} severity="secondary" />
            </Link>
            {project.favicon && <Chip className={cn('tile', project.favicon, 'mr-3')} image={project.favicon} />}
            <h1 className={styles.title}>{project.name}</h1>
          </div>
          <div className="flex flex-row gap-2 justify-content-end">
          </div>
        </div>
      </div>

      <SubtleHeader className="mb-3">Run History</SubtleHeader>
      <RunHistory projectId={id} runs={runs} showName />
    </div>
  );
}
