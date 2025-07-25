import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, AlertCircle } from 'lucide-react';

/**
 * Custom 404 Not Found page
 * Shown when short links don't exist or are invalid
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Short Link Not Found
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Sorry, the short link you&apos;re looking for doesn&apos;t exist or may have expired.
            Please check the URL and try again.
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
          
          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? The link might have been mistyped or the short URL may have been removed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata for the 404 page
 */
export const metadata = {
  title: 'Page Not Found - Short URL Service',
  description: 'The requested short link could not be found.',
  robots: {
    index: false,
    follow: false,
  },
}; 