import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { SplashScreen } from '@/components/ui/SplashScreen';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kitatur.rinzgroup.web.id'),
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

import { cookies } from 'next/headers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const splashShown = cookieStore.get('kitaatur_splash_shown');

  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KitaAtur" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SplashScreen hasSeenSplash={!!splashShown}>
          <ConfirmProvider>
            {children}
            <Toaster position="top-center" />
          </ConfirmProvider>
        </SplashScreen>
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

