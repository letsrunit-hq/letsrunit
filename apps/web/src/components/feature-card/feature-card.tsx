import { LucideIcon } from 'lucide-react';
import { Card } from 'primereact/card';
import React from 'react';

export type FeatureCardProps = {
  className?: string;
  title: string;
  icon: LucideIcon;
  children?: React.ReactNode;
};

export function FeatureCard({ className, title, icon: Icon, children }: FeatureCardProps) {
  return (
    <Card
      className={className ? `${className} bg-gradient-card` : 'flex-1 bg-gradient-card'}
      pt={{
        body: { className: 'p-4' },
        content: { className: 'flex flex-column gap-3 md:gap-4' },
      }}
    >
      <div className="flex flex-row md:flex-column gap-3 md:gap-4">
        <Icon className="w-2rem h-2rem text-orange-500" />
        <h3 className="text-lg font-bold text-white m-0">{title}</h3>
      </div>
      <div className="text-400 line-height-3 m-0">{children}</div>
    </Card>
  );
}

export default FeatureCard;
