import type { Metadata } from "next";
import { cn } from '../lib/utils'

import "./globals.css";

export const metadata: Metadata = {
  title: 'Eden Clinic',
  description: 'Book your blood test today',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
