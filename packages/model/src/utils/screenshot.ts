import type { SupabaseClient } from '@supabase/supabase-js';
import { File } from 'node:buffer';

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET || 'artifacts';
const ensuredBuckets: string[] = [];

async function ensureBucket(supabase: SupabaseClient, bucket: string) {
  if (ensuredBuckets.includes(bucket)) return;

  try {
    await supabase.storage.createBucket(bucket, { public: true });
    ensuredBuckets.push(bucket);
  } catch {}
}

export async function saveScreenshot(
  projectId: string,
  screenshot: File,
  { supabase, bucket }: { supabase: SupabaseClient; bucket?: string },
): Promise<string> {
  bucket ??= ARTIFACT_BUCKET;
  await ensureBucket(supabase, bucket);

  const path = `${projectId}/${screenshot.name}`;
  const bytes = await screenshot.bytes();
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: screenshot.type, upsert: false });

  if (uploadError && Number((uploadError as any).statusCode) !== 409) {
    throw new Error(`Failed to upload screenshot to bucket '${bucket}'`, { cause: uploadError });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}
