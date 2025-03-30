import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as ToastSonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Log Parser",
  description: "New Age Log parser for WOTLK Private Servers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <SiteHeader />
        {children}
        <ToastSonner />
        <Toaster /> */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <SiteHeader />
        </div>
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
