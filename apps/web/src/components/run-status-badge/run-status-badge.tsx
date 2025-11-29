import type { RunStatus } from '@letsrunit/model';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Tag } from 'primereact/tag';
import React from 'react';

export type RunStatusBadgeProps = {
  status?: RunStatus;
};

export function RunStatusBadge({ status }: RunStatusBadgeProps) {
  switch (status) {
    case 'passed':
      return <Tag value="Passed" severity="success" icon={<CheckCircle2 size={14} />} />;
    case 'failed':
      return <Tag value="Failed" severity="danger" icon={<XCircle size={14} />} />;
    case 'error':
      return <Tag value="Error" severity="danger" icon={<XCircle size={14} />} />;
    default:
      return <></>;
  }
}

export default RunStatusBadge;
