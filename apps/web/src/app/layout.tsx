import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { PrimeReactProvider } from 'primereact/api';
import '../assets/theme/theme.scss';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'geist/font/sans';

export const metadata: Metadata = {
  title: 'Vibe Testing done right | letsrunit.',
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
        <PrimeReactProvider>{children}</PrimeReactProvider>
      </body>
    </html>
  );
}
