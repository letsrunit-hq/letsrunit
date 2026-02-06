import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from 'primereact/button';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section data-segment="auth">
      <div className="absolute top-0 left-0 m-4 z-5">
        <Link href="/" prefetch={false}>
          <Button icon={<ArrowLeft size={20} />} rounded text severity="secondary" />
        </Link>
      </div>
      {children}
    </section>
  );
}
