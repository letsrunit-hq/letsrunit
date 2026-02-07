import type { RunStatus } from '@letsrunit/model';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Tag } from 'primereact/tag';
import React from 'react';

export type RunStatusBadgeProps = {
  className?: string;
  status?: RunStatus;
};

export function RunStatusBadge({ status, className }: RunStatusBadgeProps) {
  switch (status) {
    case 'passed':
      return <Tag value="Passed" severity="success" icon={<CheckCircle2 size={14} />} className={className} />;
    case 'failed':
      return <Tag value="Failed" severity="danger" icon={<XCircle size={14} />} className={className} />;
    case 'error':
      return <Tag value="Error" severity="danger" icon={<XCircle size={14} />} className={className} />;
    default:
      return <></>;
  }
}

export default RunStatusBadge;
