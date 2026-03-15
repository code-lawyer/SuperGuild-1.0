import './globals.css';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Providers from '@/providers/Web3Providers';
import Header from '@/components/layout/Header';
import { I18nProvider } from '@/lib/i18n';
import { NoiseOverlay } from '@/components/ui/NoiseOverlay';
import { LogoWatermark } from '@/components/ui/LogoWatermark';
import { Toaster } from '@/components/ui/toaster';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'SuperGuild | Infrastructure for the Sovereign Individual',
  description: 'Decentralized, non-custodial tools to power your professional autonomy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col antialiased">
        <I18nProvider>
          <NoiseOverlay />
          <LogoWatermark />
          <Providers>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow w-full">
                {children}
              </main>
            </div>
          </Providers>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}