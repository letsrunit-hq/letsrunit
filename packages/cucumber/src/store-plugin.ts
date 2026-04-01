import type { Envelope } from '@cucumber/messages';
import { startStoreRecorder } from './store-core.js';

type StorePluginOptions = {
  directory?: string;
};

export default {
  type: 'plugin' as const,
  optionsKey: 'letsrunitStore' as const,
  coordinator({
    on,
    options,
    operation,
  }: {
    on: (key: 'message', handler: (value: Envelope) => void) => void;
    options?: StorePluginOptions;
    operation: 'loadSources' | 'loadSupport' | 'runCucumber';
  }) {
    if (operation !== 'runCucumber') return;
    startStoreRecorder({ on, directory: options?.directory });
  },
};
