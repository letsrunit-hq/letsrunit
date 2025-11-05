import * as assert from './assert';
import * as form from './form';
import * as keyboard from './keyboard';
import * as mouse from './mouse';
import * as navigation from './navigation';
import type { StepDefinition } from '../types';

export const stepsDefinitions: StepDefinition[] = [
  ...Object.values(assert),
  ...Object.values(form),
  ...Object.values(keyboard),
  ...Object.values(mouse),
  ...Object.values(navigation),
];
