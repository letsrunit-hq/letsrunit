import { connect } from '@/libs/supabase/server';
import { getFeature, getProject, getRun, listRuns, maybe } from '@letsrunit/model';
import { isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';
import Screen from './screen';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUUID(id)) return notFound();

  const supabase = await connect();
  const run = await getRun(id, { supabase }).catch(maybe);

  if (!run) return notFound();

  const historyFilter = {
    projectId: run.projectId,
    featureId: run.featureId || undefined,
    type: run.featureId ? undefined : run.type,
  };

  const [project, feature, history] = await Promise.all([
    getProject(run.projectId, { supabase }),
    run.featureId ? getFeature(run.featureId, { supabase }) : undefined,
    run.projectId ? listRuns(historyFilter, { supabase }) : undefined,
  ]);

  return <Screen run={run} project={project!} feature={feature} history={history} />;
}
