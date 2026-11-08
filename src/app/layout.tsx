import type { Metadata } from "next";
import localFont from "next/font/local";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

// Self-hosted so builds never fetch from Google Fonts (Turbopack's Google font loader
// fails on some font URLs Google returns, which broke CI).
const nunito = localFont({
  src: "../../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Impact Plan",
  description: "Dev-Afrique annual goal-setting and year-end review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-sans antialiased`}>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
