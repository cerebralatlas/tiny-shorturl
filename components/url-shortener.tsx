'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidUrlFormat } from '@/lib/validator';
import { copyToClipboard, cn } from '@/lib/utils';
import { 
  Link, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

// Component state interface
interface UrlShortenerState {
  url: string;
  shortUrl: string;
  isLoading: boolean;
  error: string;
  copied: boolean;
}

// API response interfaces
interface ShortenSuccessResponse {
  success: true;
  data: {
    shortUrl: string;
    code: string;
  };
}

interface ShortenErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ShortenResponse = ShortenSuccessResponse | ShortenErrorResponse;

/**
 * Main URL Shortener Component
 * Handles URL input, validation, shortening, and result display
 */
export default function UrlShortener() {
  const [state, setState] = useState<UrlShortenerState>({
    url: '',
    shortUrl: '',
    isLoading: false,
    error: '',
    copied: false,
  });

  // Handle URL input change
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setState(prev => ({
      ...prev,
      url,
      error: '', // Clear error when user types
    }));
  }, []);

  // Validate URL on the frontend
  const validateInput = useCallback((url: string): string | null => {
    if (!url.trim()) {
      return 'Please enter a URL';
    }
    
    if (!isValidUrlFormat(url)) {
      return 'Please enter a valid URL starting with http:// or https://';
    }
    
    return null;
  }, []);

  // Handle URL shortening
  const handleShorten = useCallback(async () => {
    const trimmedUrl = state.url.trim();
    
    // Frontend validation
    const validationError = validateInput(trimmedUrl);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: '',
      shortUrl: '',
      copied: false,
    }));

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      const data: ShortenResponse = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          shortUrl: data.data.shortUrl,
          isLoading: false,
        }));
        
        toast.success('Short URL created successfully!');
      } else {
        setState(prev => ({
          ...prev,
          error: data.error.message,
          isLoading: false,
        }));
        
        toast.error(data.error.message);
      }
    } catch (error) {
      const errorMessage = 'Failed to create short URL. Please try again.';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      
      toast.error(errorMessage);
      console.error('Shorten URL error:', error);
    }
  }, [state.url, validateInput]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!state.shortUrl) return;

    const success = await copyToClipboard(state.shortUrl);
    
    if (success) {
      setState(prev => ({ ...prev, copied: true }));
      toast.success('Short URL copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, copied: false }));
      }, 2000);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  }, [state.shortUrl]);

  // Handle creating another URL
  const handleCreateAnother = useCallback(() => {
    setState({
      url: '',
      shortUrl: '',
      isLoading: false,
      error: '',
      copied: false,
    });
  }, []);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isLoading) {
      handleShorten();
    }
  }, [handleShorten, state.isLoading]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Link className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          URL Shortener
        </h1>
        <p className="text-gray-600">
          Transform long URLs into short, shareable links in seconds
        </p>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="url-input" className="block text-sm font-medium text-gray-700">
              Enter your long URL
            </label>
            <div className="relative">
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/very-long-url-that-needs-shortening"
                value={state.url}
                onChange={handleUrlChange}
                onKeyPress={handleKeyPress}
                className={cn(
                  "pr-12 text-base h-12",
                  state.error && "border-red-300 focus-visible:ring-red-500"
                )}
                maxLength={2048}
                disabled={state.isLoading}
              />
              <ExternalLink className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            </div>
            
            {/* Error Message */}
            {state.error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </div>
            )}
          </div>

          {/* Shorten Button */}
          <Button
            onClick={handleShorten}
            disabled={state.isLoading || !state.url.trim()}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Short URL...
              </>
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                Shorten URL
              </>
            )}
          </Button>

          {/* Result Section */}
          {state.shortUrl && (
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="font-medium">Short URL created successfully!</span>
              </div>
              
              {/* Short URL Display */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your short URL
                </label>
                <div className="flex gap-2">
                  <Input
                    value={state.shortUrl}
                    readOnly
                    className="font-mono text-blue-600 bg-blue-50 border-blue-200"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="px-3"
                    title="Copy to clipboard"
                  >
                    {state.copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateAnother}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Another
                </Button>
                
                <Button
                  onClick={() => window.open(state.shortUrl, '_blank')}
                  variant="outline"
                  className="px-4"
                  title="Test short URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>
          Short URLs are permanent and don&apos;t expire. 
          <br />
          All links are checked for security before shortening.
        </p>
      </div>
    </div>
  );
} 