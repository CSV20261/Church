import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Older Apostolic Church",
  description: "Church management system for the Older Apostolic Church",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OAC",
  },
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} font-sans antialiased bg-gray-100 min-h-screen`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
