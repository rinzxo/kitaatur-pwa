import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: "KitaAtur - Absensi & Keuangan Organisasi",
  description: "Platform SaaS Manajemen Absensi QR dan Arus Kas Organisasi Terintegrasi",
  keywords: ["kitaatur", "absensi online", "manajemen keuangan", "organisasi", "sistem kas", "absensi qr"],
  authors: [{ name: "RinzGroup" }],
  openGraph: {
    title: "KitaAtur - Absensi & Keuangan Organisasi",
    description: "Platform SaaS Manajemen Absensi QR dan Arus Kas Organisasi Terintegrasi",
    url: "https://kitatur.rinzgroup.web.id",
    siteName: "KitaAtur",
    images: [
      {
        url: "/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id.webp",
        width: 1080,
        height: 2340,
        alt: "KitaAtur App Mockup",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KitaAtur - Absensi & Keuangan Organisasi",
    description: "Platform SaaS Manajemen Absensi QR dan Arus Kas Organisasi Terintegrasi",
    images: ["/images/mockups/Google-Pixel5-kitatur.rinzgroup.web.id.webp"],
  },
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

import { SplashScreen } from '@/components/ui/SplashScreen';
import { cookies } from 'next/headers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  // TODO: restore cookie check before going to production
  // const splashShown = cookieStore.get('kitaatur_splash_shown');
  const splashShown = false; // TESTING: splash always shows on every refresh

  return (
    <html lang="id" suppressHydrationWarning>
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
      <body suppressHydrationWarning>
        {!splashShown ? (
          <SplashScreen>
            <ConfirmProvider>
              {children}
              <Toaster position="top-center" />
            </ConfirmProvider>
          </SplashScreen>
        ) : (
          <ConfirmProvider>
            {children}
            <Toaster position="top-center" />
          </ConfirmProvider>
        )}
        <ServiceWorkerRegistration />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
