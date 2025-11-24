import { connect } from '@/libs/supabase/server';
import { isUUID } from '@letsrunit/utils';
import { notFound } from 'next/navigation';
import Screen from './screen';
import { DBError } from '@letsrunit/model';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUUID(id)) {
    return notFound();
  }

  const supabase = await connect();
  const { status, data, error } = await supabase.from('runs').select('id, project_id, status').eq('id', id).maybeSingle();

  if (status < 100 || status >= 400) {
    throw new DBError(status, error); // Server error or bad request
  }

  if (!data || (status > 400 && status < 500)) {
    return notFound(); // Access error or not found
  }

  return <Screen runId={id} projectId={data!.project_id} status={data.status} />;
}
