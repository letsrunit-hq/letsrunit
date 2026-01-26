import type { PageInfo } from '@letsrunit/playwright';

export interface AppInfo extends PageInfo {
  /** Application name */
  name?: string;

  /** Application purpose */
  purpose: string;

  /** Detected login or registration */
  loginAvailable: boolean;
}
