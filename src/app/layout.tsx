import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { StacksProvider } from '@/components/providers/StacksProvider';
import { TopNav } from '@/components/navigation/TopNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'bitcoin.defi | Copy trading seguro sobre Bitcoin L2',
  description:
    'Estrategias de copy trading con gestión de riesgo, backtests auditables e integración con Stacks para Bitcoin L2.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StacksProvider>
          <TopNav />
          <main className="bg-slate-950 min-h-screen">{children}</main>
        </StacksProvider>
      </body>
    </html>
  );
}
