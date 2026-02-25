import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
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
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-nhs-pale-grey">
            <div className="max-w-5xl mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
        <InstallBanner />
      </body>
    </html>
  );
}
