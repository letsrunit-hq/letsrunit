import { File } from 'node:buffer';

export interface Snapshot {
  url: string,
  html: string,
  screenshot: File,
}
