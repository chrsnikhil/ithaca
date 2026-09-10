import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import SWRegister from "./sw-register";

/* Inter — ElevenLabs' UI/body face (their display "Waldenburg" is proprietary;
   Inter is the open half of their own stack). One family app-wide, hierarchy
   comes from weight / case / tracking. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* Geist Mono — technical monospace for micro-badges and tabular readouts */
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Guardian — Capital Protector",
  description: "Your autonomous on-chain guardian.",
  applicationName: "Guardian",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Guardian",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} dark`}>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
