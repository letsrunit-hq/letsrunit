import { Card } from 'primereact/card';
import React from 'react';

export type AuthCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex align-items-center justify-content-center px-4 py-12 relative overflow-hidden">
      <div className="relative w-full max-w-28rem">
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-color-secondary m-0">{subtitle}</p>
        </div>

        <Card className="p-2 border-round-2xl mobile-full">{children}</Card>

        {footer && <div className="text-center mt-4 md:mt-6">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthCard;
