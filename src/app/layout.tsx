import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '@/contexts/WalletProvider';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebWallet - Your Solana Wallet",
  description: "A non-custodial Solana wallet for the modern web",
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-white min-h-screen`}>
        <WalletProvider>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                maxWidth: '100%',
              },
              success: {
                iconTheme: {
                  primary: '#0ea5e9',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
