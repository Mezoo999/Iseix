import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import AuthProviderWrapper from "@/components/auth/AuthProviderWrapper";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import { RouteChangeLoader } from "@/components/ui/PagePreloader";
import { NotificationProvider } from "@/contexts/NotificationContext";
import MobilePageTransition from "@/components/navigation/MobilePageTransition";
import features from "@/config/features";

// خط Geist للنصوص اللاتينية
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// خط Cairo للنصوص العربية
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  display: "swap",
});

// خط Tajawal للنصوص العربية
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Iseix - منصة الاستثمار بالذكاء الاصطناعي",
  description: "منصة Iseix هي منصة استثمارية مبتكرة تعتمد على تقنيات الذكاء الاصطناعي المتطورة لتحقيق أقصى عوائد ممكنة للمستثمرين.",
  keywords: "استثمار، ذكاء اصطناعي، عوائد مرتفعة، استثمار آمن، منصة استثمارية",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  themeColor: "#0A1A3B",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Iseix",
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} ${tajawal.variable} antialiased`}
      >
        <ErrorBoundary>
          <NotificationProvider>
            <AuthProviderWrapper>
              <AnimatedBackground />
              <RouteChangeLoader />
              <MobilePageTransition>
                {children}
              </MobilePageTransition>
              <MobileBottomNav />
              <ConnectionStatus />
            </AuthProviderWrapper>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
