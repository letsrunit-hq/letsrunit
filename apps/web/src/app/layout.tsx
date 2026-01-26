import { ToastProvider } from '@/context/toast-context';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import './globals.css';
import { PrimeReactProvider } from 'primereact/api';
import { ConfirmDialog } from 'primereact/confirmdialog';
import '../assets/theme/theme.scss';
import 'primeflex/primeflex.css';
import React from 'react';
import 'geist/font/sans';

export const metadata: Metadata = {
  name: 'Vibe Testing done right | letsrunit.',
  description: 'Fully automated testing for your web application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Analytics />
        <ConfirmDialog />
        <PrimeReactProvider>
          <ToastProvider>{children}</ToastProvider>
        </PrimeReactProvider>
      </body>
    </html>
  );
}
