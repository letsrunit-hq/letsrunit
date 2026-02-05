import { ProjectCard } from '@/components/project-card/project-card';
import { connect as connectServerSupabase } from '@/libs/supabase/server';
import { listProjects } from '@letsrunit/model';
import React from 'react';

export default async function Page() {
  const supabase = await connectServerSupabase();
  const projects = await listProjects({ supabase });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Personal Projects</h1>

      <div className="grid">
        {projects.map((project) => (
          <div key={project.id} className="col-12 md:col-6 lg:col-4 p-3">
            <ProjectCard project={project} />
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-12 text-center py-8">
            <p className="text-zinc-500 text-lg">No projects found. Create your first project to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
