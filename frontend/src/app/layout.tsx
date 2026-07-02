import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: "KitaAtur - Absensi & Keuangan Organisasi",
  description: "Platform SaaS Manajemen Absensi QR dan Arus Kas Organisasi Terintegrasi",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KitaAtur',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KitaAtur" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <ConfirmProvider>
          {children}
          <Toaster position="top-center" />
        </ConfirmProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
