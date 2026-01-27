import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

const tracingRoot = path.join(dir, '../../');
console.log('Tracing root using dirname:', tracingRoot);

const protosPath = path.join(tracingRoot, 'node_modules/@google-cloud/tasks/build/protos');
if (fs.existsSync(protosPath)) {
  console.log('Files in @google-cloud/tasks/build/protos:', fs.readdirSync(protosPath));
} else {
  console.log('Path not found: @google-cloud/tasks/build/protos');
}

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
  outputFileTracingRoot: tracingRoot,
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
