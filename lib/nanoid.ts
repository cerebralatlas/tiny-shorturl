import { nanoid } from 'nanoid';
import { urlExists } from './store';

// Character set for URL-safe short codes (62 characters)
// Excludes similar looking characters like 0/O, 1/l/I for better UX
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Default length for short codes (6 characters = 62^6 ≈ 56.8 billion combinations)
const CODE_LENGTH = 6;

// Maximum retry attempts for collision resolution
const MAX_RETRIES = 5;

/**
 * Generate a unique short code
 * Retries up to MAX_RETRIES times if collision occurs
 * @returns Promise<string> - Unique short code
 * @throws Error if unable to generate unique code after max retries
 */
export async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    // Generate random code using custom alphabet
    const code = nanoid(CODE_LENGTH);
    
    // Check if code already exists in storage
    const exists = await urlExists(code);
    
    if (!exists) {
      return code;
    }
    
    attempts++;
    
    // Log collision for monitoring (in production, consider using proper logging)
    console.warn(`Short code collision detected: ${code} (attempt ${attempts}/${MAX_RETRIES})`);
  }
  
  // If we reach here, we couldn't generate a unique code
  throw new Error(`Failed to generate unique short code after ${MAX_RETRIES} attempts`);
}

/**
 * Generate a short code without uniqueness check
 * Useful for testing or when uniqueness is not required
 * @param length - Length of the code (default: 6)
 * @returns string - Random short code
 */
export function generateCode(length: number = CODE_LENGTH): string {
  return nanoid(length);
}

/**
 * Validate if a code matches our expected format
 * @param code - Code to validate
 * @returns boolean - True if valid format
 */
export function isValidCodeFormat(code: string): boolean {
  if (code.length !== CODE_LENGTH) {
    return false;
  }
  
  // Check if all characters are in our alphabet
  return code.split('').every(char => ALPHABET.includes(char));
} 