import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'

import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
    <html lang="en" className={inter.variable}>
      <body className={cn(
        'min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
        inter.className
      )}>
        <main className="min-h-screen">
          <Toaster position="bottom-right" />
          {children}
        </main>
      </body>
    </html>
  );
}
