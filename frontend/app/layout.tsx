import type { Metadata } from "next";
import "./globals.css";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Prompt Odyssey",
  description: "EagleHacks 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <AuthBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
