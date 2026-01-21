import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SupabaseImage } from './supabase-image';

// Mock next/image to render a plain img
vi.mock('next/image', () => {
  return {
    __esModule: true,
    default: (props: any) => {
      const { src, alt, width, height, quality, loader, fill, ...rest } = props;

      const resolvedSrc =
        typeof loader === 'function'
          ? loader({ src, width: typeof width === 'number' ? width : 800, quality })
          : src;

      return (
        <img
          src={resolvedSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          {...rest}
        />
      );
    },
  };
});

describe('SupabaseImage', () => {
  it('uses the loader to transform the supabase url', () => {
    render(
      <SupabaseImage
        src="https://project.supabase.co/storage/v1/object/public/images/test.png"
        alt="test"
        width={100}
        height={100}
      />,
    );

    const img = screen.getByAltText('test') as HTMLImageElement;

    expect(img.getAttribute('src')).toContain('/storage/v1/render/image/public/images/test.png');
    expect(img.getAttribute('src')).toContain('width=100');
    expect(img.getAttribute('src')).toContain('quality=75');
  });
});
