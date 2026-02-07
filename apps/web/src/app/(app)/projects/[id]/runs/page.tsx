import { RunHistory } from '@/components/run-history';
import { SubtleHeader } from '@/components/subtle-header';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import { getProject, listRuns, maybe } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import { cn, isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';
import { Chip } from 'primereact/chip';
import React from 'react';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase }).catch(maybe);

  if (!project) return notFound();

  const runs = await listRuns({ projectId: id }, { supabase });

  return (
    <div>
      <div className="hidden lg:flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between mb-4">
        <div className="flex flex-row align-items-center mb-3 md:mb-0">
          {project.favicon && <Chip className={cn('tile', project.favicon, 'mr-3')} image={project.favicon} />}
          <h1 className="my-1">{project.name}</h1>
        </div>
        <div className="flex flex-row gap-2 justify-content-end"></div>
      </div>

      <SubtleHeader className="mb-3">Run History</SubtleHeader>
      <RunHistory projectId={id} runs={runs} showName />
    </div>
  );
}
