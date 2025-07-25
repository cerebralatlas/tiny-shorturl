import UrlShortener from '@/components/url-shortener';

/**
 * Homepage - Main URL Shortener Interface
 * This is the primary entry point for users to shorten URLs
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <UrlShortener />
    </div>
  );
}

/**
 * Metadata for the homepage
 */
export const metadata = {
  title: 'URL Shortener - Create Short Links Instantly',
  description: 'Transform long URLs into short, shareable links in seconds. Fast, secure, and reliable URL shortening service.',
};
