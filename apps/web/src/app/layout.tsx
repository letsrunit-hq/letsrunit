import type { Metadata } from 'next';
import './globals.css';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/lara-light-amber/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import React from 'react';

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
