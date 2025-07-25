import { redirect, notFound } from 'next/navigation';
import { getUrl } from '@/lib/store';
import { isValidCodeFormat } from '@/lib/nanoid';

// Page props interface
interface RedirectPageProps {
  params: Promise<{
    code: string;
  }>;
}

/**
 * Dynamic page for handling short code redirects
 * This page handles the redirect logic and 404 cases
 */
export default async function RedirectPage({ params }: RedirectPageProps) {
  const { code } = await params;

  // Validate code format first
  if (!isValidCodeFormat(code)) {
    notFound();
  }

  try {
    // Get URL from storage
    const originalUrl = await getUrl(code);

    if (!originalUrl) {
      // URL not found in storage
      notFound();
    }

    // Perform 301 redirect to original URL
    // The redirect function throws NEXT_REDIRECT which is expected behavior
    redirect(originalUrl);

  } catch (error) {
    // Check if this is a Next.js redirect (which is expected)
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      // This is a normal redirect, re-throw it
      throw error;
    }
    
    console.error(`Error redirecting code ${code}:`, error);
    
    // On storage error, show 404 to avoid exposing internal errors
    notFound();
  }
}

/**
 * Generate metadata for SEO
 * Prevents indexing of redirect pages
 */
export async function generateMetadata({ params }: RedirectPageProps) {
  const { code } = await params;
  return {
    title: `Redirecting ${code}...`,
    description: 'You are being redirected to the original URL.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Generate viewport configuration
 * Moved from metadata as required by Next.js 15
 */
export async function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}

/**
 * This page should not be statically generated
 * Each short code is dynamic and needs runtime resolution
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0; 