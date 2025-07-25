import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// Configure Inter font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// App metadata
export const metadata: Metadata = {
  title: 'URL Shortener - Create Short Links Instantly',
  description: 'Transform long URLs into short, shareable links in seconds. Fast, secure, and reliable URL shortening service.',
  keywords: ['url shortener', 'short links', 'link shortener', 'tiny url'],
  authors: [{ name: 'URL Shortener' }],
  creator: 'URL Shortener',
  publisher: 'URL Shortener',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000',
    title: 'URL Shortener - Create Short Links Instantly',
    description: 'Transform long URLs into short, shareable links in seconds.',
    siteName: 'URL Shortener',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL Shortener - Create Short Links Instantly',
    description: 'Transform long URLs into short, shareable links in seconds.',
  },

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

/**
 * Root Layout Component
 * Provides global styling, fonts, and providers for the entire app
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {/* Background gradient */}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
          {/* Main content */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </div>
      </body>
    </html>
  );
}
