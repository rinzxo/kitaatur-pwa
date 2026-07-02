import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export const metadata: Metadata = {
  title: "KitaAtur - Absensi & Keuangan Organisasi",
  description: "Platform SaaS Manajemen Absensi QR dan Arus Kas Organisasi Terintegrasi",
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
      </head>
      <body>
        <ConfirmProvider>
          {children}
          <Toaster position="top-center" />
        </ConfirmProvider>
      </body>
    </html>
  );
}
