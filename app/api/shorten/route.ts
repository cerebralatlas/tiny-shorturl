import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, ValidationError } from '@/lib/validator';
import { generateUniqueCode } from '@/lib/nanoid';
import { saveUrl } from '@/lib/store';

// Request interface
interface ShortenRequest {
  url: string;
}

// Success response interface
interface ShortenSuccessResponse {
  success: true;
  data: {
    shortUrl: string;
    code: string;
  };
}

// Error response interface
interface ShortenErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

type ShortenResponse = ShortenSuccessResponse | ShortenErrorResponse;

/**
 * POST /api/shorten
 * Create a short URL from a long URL
 */
export async function POST(request: NextRequest): Promise<NextResponse<ShortenResponse>> {
  try {
    // Parse request body
    let body: ShortenRequest;
    
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Check if URL is provided
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_URL',
            message: 'URL is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate URL
    const validation = validateUrl(body.url);
    if (!validation.isValid) {
      // Map validation errors to response codes
      const errorCodeMap: Record<ValidationError, string> = {
        [ValidationError.EMPTY_URL]: 'EMPTY_URL',
        [ValidationError.TOO_SHORT]: 'URL_TOO_SHORT',
        [ValidationError.TOO_LONG]: 'URL_TOO_LONG',
        [ValidationError.INVALID_FORMAT]: 'INVALID_URL_FORMAT',
        [ValidationError.INVALID_PROTOCOL]: 'INVALID_PROTOCOL',
        [ValidationError.BLOCKED_DOMAIN]: 'BLOCKED_DOMAIN',
      };

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCodeMap[validation.error!],
            message: validation.message || 'Invalid URL',
          },
        },
        { status: 400 }
      );
    }

    // Generate unique short code
    let shortCode: string;
    try {
      shortCode = await generateUniqueCode();
    } catch (error) {
      console.error('Failed to generate unique code:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CODE_GENERATION_FAILED',
            message: 'Unable to generate short code. Please try again.',
          },
        },
        { status: 500 }
      );
    }

    // Save URL to storage
    try {
      await saveUrl(shortCode, validation.normalizedUrl!);
    } catch (error) {
      console.error('Failed to save URL:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STORAGE_ERROR',
            message: 'Failed to save URL. Please try again.',
          },
        },
        { status: 500 }
      );
    }

    // Get the base URL for the short link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          shortUrl,
          code: shortCode,
        },
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in shorten API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET method not supported. Use POST to shorten URLs.',
      },
    },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'PUT method not supported. Use POST to shorten URLs.',
      },
    },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'DELETE method not supported. Use POST to shorten URLs.',
      },
    },
    { status: 405 }
  );
} 