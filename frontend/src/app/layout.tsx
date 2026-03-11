import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { ReminderSystem } from '@/components/ReminderSystem';
import { PWARegister } from '@/components/PWARegister';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'CognitiveOS',
  description: 'Convert unstructured thoughts into structured execution systems.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CognitiveOS',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1 container mx-auto px-3 py-3 md:p-6 max-w-7xl">
            {children}
          </main>
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}
