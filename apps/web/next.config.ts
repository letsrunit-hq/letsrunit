import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Silence Sass deprecation warnings for `@import` while we keep vendor theme structure
  sassOptions: {
    // Supported by Dart Sass: https://sass-lang.com/documentation/js-api/interfaces/options/#silencedeprecations
    silenceDeprecations: [
      'import', // @import deprecation
      'legacy-js-api', // Legacy JS API usage warnings
      'global-builtin', // Un-namespaced built-in function deprecations
      'color-functions', // Deprecated color helpers like darken()/lighten()
    ],
  },
  images: {
    remotePatterns: [new URL('http://127.0.0.1:54321/storage/v1/object/public/**')],
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
