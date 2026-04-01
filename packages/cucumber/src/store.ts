import type { Envelope } from '@cucumber/messages';
import { startStoreRecorder } from './store-core.js';

let didWarnDeprecation = false;
let didWarnStdoutSlot = false;

export default {
  type: 'formatter' as const,
  optionsKey: 'letsrunitStore' as const,
  formatter({
    on,
    directory,
    logger,
  }: {
    on: (key: 'message', handler: (value: Envelope) => void) => void;
    directory?: string;
    logger: { warn: (text: string) => void };
  }) {
    if (!didWarnDeprecation) {
      logger.warn(
        '[@letsrunit/cucumber/store] Deprecated: prefer the plugin entrypoint via --plugin @letsrunit/cucumber/dist/store-plugin.js.',
      );
      didWarnDeprecation = true;
    }

    if (!directory && !didWarnStdoutSlot) {
      logger.warn(
        '[@letsrunit/cucumber/store] No formatter output path was provided. This can consume Cucumber stdout formatter selection. Prefer --plugin @letsrunit/cucumber/dist/store-plugin.js or use format entry @letsrunit/cucumber/dist/store.js:.letsrunit/artifacts.',
      );
      didWarnStdoutSlot = true;
    }

    startStoreRecorder({ on, directory });
  },
};
