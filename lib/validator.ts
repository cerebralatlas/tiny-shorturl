import validator from 'validator';

// Configuration for URL validation
const VALIDATION_CONFIG = {
  // Minimum URL length (excluding protocol)
  MIN_LENGTH: 10,
  // Maximum URL length
  MAX_LENGTH: 2048,
  // Allowed protocols
  ALLOWED_PROTOCOLS: ['http', 'https'],
  // Blocked domains for security (can be extended)
  BLOCKED_DOMAINS: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    // Add more blocked domains as needed
  ],
} as const;

// Error codes for different validation failures
export enum ValidationError {
  EMPTY_URL = 'EMPTY_URL',
  TOO_SHORT = 'TOO_SHORT',
  TOO_LONG = 'TOO_LONG',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_PROTOCOL = 'INVALID_PROTOCOL',
  BLOCKED_DOMAIN = 'BLOCKED_DOMAIN',
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
  message?: string;
  normalizedUrl?: string;
}

/**
 * Validate and normalize a URL
 * @param url - URL string to validate
 * @returns ValidationResult - Validation result with error details
 */
export function validateUrl(url: string): ValidationResult {
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  // Check if URL is empty
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: ValidationError.EMPTY_URL,
      message: 'URL cannot be empty',
    };
  }
  
  // Check minimum length
  if (trimmedUrl.length < VALIDATION_CONFIG.MIN_LENGTH) {
    return {
      isValid: false,
      error: ValidationError.TOO_SHORT,
      message: `URL must be at least ${VALIDATION_CONFIG.MIN_LENGTH} characters long`,
    };
  }
  
  // Check maximum length
  if (trimmedUrl.length > VALIDATION_CONFIG.MAX_LENGTH) {
    return {
      isValid: false,
      error: ValidationError.TOO_LONG,
      message: `URL must be less than ${VALIDATION_CONFIG.MAX_LENGTH} characters long`,
    };
  }
  
  // Basic URL format validation using validator library
  if (!validator.isURL(trimmedUrl, {
    protocols: [...VALIDATION_CONFIG.ALLOWED_PROTOCOLS],
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
  })) {
    return {
      isValid: false,
      error: ValidationError.INVALID_FORMAT,
      message: 'Please enter a valid URL starting with http:// or https://',
    };
  }
  
  try {
    // Parse URL for additional validation
    const parsedUrl = new URL(trimmedUrl);
    
    // Check protocol
    const protocol = parsedUrl.protocol.slice(0, -1) as 'http' | 'https'; // Remove trailing colon
    if (!VALIDATION_CONFIG.ALLOWED_PROTOCOLS.includes(protocol)) {
      return {
        isValid: false,
        error: ValidationError.INVALID_PROTOCOL,
        message: 'Only HTTP and HTTPS URLs are allowed',
      };
    }
    
    // Check for blocked domains
    const hostname = parsedUrl.hostname.toLowerCase();
    if (VALIDATION_CONFIG.BLOCKED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    )) {
      return {
        isValid: false,
        error: ValidationError.BLOCKED_DOMAIN,
        message: 'This domain is not allowed',
      };
    }
    
    // Return success with normalized URL
    return {
      isValid: true,
      normalizedUrl: parsedUrl.toString(),
    };
    
  } catch {
    return {
      isValid: false,
      error: ValidationError.INVALID_FORMAT,
      message: 'Invalid URL format',
    };
  }
}

/**
 * Quick validation for frontend use (less strict)
 * @param url - URL string to validate
 * @returns boolean - True if URL appears valid
 */
export function isValidUrlFormat(url: string): boolean {
  const trimmed = url.trim();
  
  // Basic regex check for http/https URLs
  const urlRegex = /^https?:\/\/.+/i;
  
  return trimmed.length >= VALIDATION_CONFIG.MIN_LENGTH && 
         trimmed.length <= VALIDATION_CONFIG.MAX_LENGTH &&
         urlRegex.test(trimmed);
}

/**
 * Normalize URL by ensuring consistent format
 * @param url - URL to normalize
 * @returns string - Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return parsed.toString();
  } catch {
    return url.trim();
  }
} 