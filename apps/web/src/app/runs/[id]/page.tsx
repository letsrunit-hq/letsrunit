import { connect } from '@/libs/supabase/server';
import { isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';
import Screen from './screen';

export default async function Page(params: Promise<{ id: string }>) {
  const { id } = await params;

  if (!isUUID(id)) {
    return notFound();
  }

  const supabase = await connect();
  const { status, data } = await supabase.from('runs').select('id, projectId').eq('id', id).maybeSingle();

  if (status >= 400 && status < 500) {
    return notFound();
  }

  if (status > 400) {
    return; // Error page
  }

  return <Screen runId={id} projectId={data!.projectId} />;
}
