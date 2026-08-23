import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  BRAND_LOGO_ON_LIGHT,
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_COLOR,
} from "@/src/config/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `${BRAND_TAGLINE} — ${BRAND_NAME}`,
  icons: {
    icon: BRAND_LOGO_ON_LIGHT,
    apple: BRAND_LOGO_ON_LIGHT,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ ["--brand" as string]: BRAND_COLOR }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
