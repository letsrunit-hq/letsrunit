import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, type LucideProps } from 'lucide-react';
import React from 'react';

export type ChevronProps = LucideProps & {
  open: boolean;
  flipped?: boolean;
  direction?: 'horizontal' | 'vertical';
};

export function Chevron({ open, flipped = false, direction = 'vertical', ...props }: ChevronProps) {
  const testId = open ? "chevron-open" : "chevron-closed";
  const ab = open != flipped;

  if (direction === 'vertical') {
    return ab ? <ChevronUp {...props} data-testid={testId} /> : <ChevronDown {...props} data-testid={testId} />;
  } else {
    return ab ? <ChevronLeft {...props} data-testid={testId} /> : <ChevronRight {...props} data-testid={testId} />;
  }
}

export default Chevron;
