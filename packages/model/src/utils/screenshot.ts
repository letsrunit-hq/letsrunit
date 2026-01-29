import type { SupabaseClient } from '@supabase/supabase-js';

const ARTIFACT_BUCKET = process.env.ARTIFACT_BUCKET || 'artifacts';
const ensuredBuckets: string[] = [];

async function ensureBucket(supabase: SupabaseClient, bucket: string) {
  if (ensuredBuckets.includes(bucket)) return;

  try {
    await supabase.storage.createBucket(bucket, { public: true });
    ensuredBuckets.push(bucket);
  } catch {}
}

async function artifactExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function saveScreenshot(
  projectId: string,
  screenshot: File,
  { supabase, bucket }: { supabase: SupabaseClient; bucket?: string },
): Promise<string> {
  bucket ??= ARTIFACT_BUCKET;
  await ensureBucket(supabase, bucket);

  const path = `${projectId}/${screenshot.name}`;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const exists = await artifactExists(publicUrl);

  if (!exists) {
    const bytes = await screenshot.bytes();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType: screenshot.type, upsert: true });

    if (uploadError) {
      throw new Error(`Failed to upload screenshot to bucket '${bucket}'`, { cause: uploadError });
    }
  }

  return publicUrl;
}
