import type { NextConfig } from 'next';
import path from 'node:path';

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
  serverExternalPackages: ['@google-cloud/tasks'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/*': [
      '../../node_modules/@google-cloud/tasks/build/protos/*.json',
      '../../node_modules/@google-cloud/tasks/build/**/src/**/*.json',
    ],
  },
  turbopack: {
    debugIds: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
