import React, { type ReactNode } from 'react';
import { Slash } from 'lucide-react';

export type InverseIconProps = {
  Icon: (p: { size?: string | number }) => ReactNode;
  size?: string | number;
};

export function InverseIcon({ Icon, size = 20 }: InverseIconProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <Icon size={size} />
      <Slash size={size} className="absolute inset-0" />
    </span>
  );
}

export default InverseIcon;
