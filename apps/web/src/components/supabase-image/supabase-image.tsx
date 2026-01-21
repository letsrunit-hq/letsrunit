'use client';

import Image, { type ImageLoader, type ImageProps } from 'next/image';
import React from 'react';

const supabaseLoader: ImageLoader = ({ src, width, quality }) => {
  if (!src.match(/^https:\/\/[^\/]+\.supabase\.co/)) return src;

  const q = quality ?? 75;
  const renderUrl = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  return `${renderUrl}?width=${width}&quality=${q}`;
};

export function SupabaseImage(props: ImageProps) {
  return <Image {...props} loader={supabaseLoader} />;
}
