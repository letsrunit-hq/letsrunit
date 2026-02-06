import { ProjectFeatures } from '@/components/project-features';
import { ProjectPanel } from '@/components/project-panel';
import Tile from '@/components/tile/tile';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import { getProject, listFeatures, maybe } from '@letsrunit/model';
import type { UUID } from '@letsrunit/utils';
import { isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';
import React from 'react';

type PageProps = { params: Promise<{ id: UUID }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connectServerSupabase();
  const project = await getProject(id, { supabase }).catch(maybe);

  if (!project) return notFound();

  const features = await listFeatures(id, { supabase });

  return (
    <div>
      <div className="mb-4">
        <div className="hidden lg:flex flex-row align-items-center mb-3 md:mb-0">
          {project.favicon && <Tile className="mr-3" image={project.favicon} />}
          <h1 className="my-1">{project.name}</h1>
        </div>
      </div>

      <ProjectPanel className="mb-4" project={project} />

      <ProjectFeatures projectId={id} baseUrl={project.url} features={features} />
    </div>
  );
}
