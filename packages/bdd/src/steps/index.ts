import type { StepDefinition } from '../types';
import * as assert from './assert';
import * as form from './form';
import * as keyboard from './keyboard';
import * as mailbox from './mailbox';
import * as mouse from './mouse';
import * as navigation from './navigation';

export const stepsDefinitions: StepDefinition[] = [
  ...Object.values(assert),
  ...Object.values(form),
  ...Object.values(keyboard),
  ...Object.values(mailbox),
  ...Object.values(mouse),
  ...Object.values(navigation),
];
