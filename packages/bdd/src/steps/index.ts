import type { StepDefinition } from '../types';
import * as assert from './assert';
import * as clipboard from './clipboard';
import * as form from './form';
import * as keyboard from './keyboard';
import * as mailbox from './mailbox';
import * as mouse from './mouse';
import * as navigation from './navigation';

// The order matters for the LLM
export const stepsDefinitions: StepDefinition[] = [
  ...Object.values(assert),
  ...Object.values(navigation),
  ...Object.values(mouse),
  ...Object.values(form),
  ...Object.values(keyboard),
  ...Object.values(mailbox),
  ...Object.values(clipboard),
];
