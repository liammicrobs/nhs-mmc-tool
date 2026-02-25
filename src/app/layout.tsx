import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { InstallBanner } from "@/components/ui/InstallBanner";

export const viewport: Viewport = {
  themeColor: '#003087',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  title: "NHS MMC Assessment Tool",
  description: "Modern Methods of Construction Assessment Tool for NHS Healthcare Projects",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MMC Tool',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex flex-col h-screen overflow-hidden">
          <LayoutShell>
            {children}
          </LayoutShell>
        </div>
        <InstallBanner />
      </body>
    </html>
  );
}
