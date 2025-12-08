import { z } from 'zod';

/**
 * Shell metacharacters and dangerous patterns to block
 * Prevents command injection attacks via chatbot input
 */
const DANGEROUS_PATTERNS = [
  // Shell command execution
  /[;|&`$]/,                          // Shell metacharacters: ; | & ` $
  /\$\(/,                             // Command substitution: $(...)
  /`[^`]*`/,                          // Backtick command substitution
  /\|\|/,                             // OR operator
  /&&/,                               // AND operator
  
  // Path traversal
  /\.\.\//,                           // Directory traversal: ../
  /\/etc\//i,                         // System paths
  /\/tmp\//i,                         // Temp directory
  /\/bin\//i,                         // Binary paths
  /\/dev\//i,                         // Device paths
  
  // Common exploit patterns
  /wget\s/i,                          // wget command
  /curl\s/i,                          // curl command
  /chmod\s/i,                         // chmod command
  /bash/i,                            // bash shell
  /\/bin\/sh/i,                       // sh shell
  /python/i,                          // python interpreter
  /perl/i,                            // perl interpreter
  /nc\s+-/i,                          // netcat
  /eval\s*\(/i,                       // eval function
  /exec\s*\(/i,                       // exec function
  
  // URL-encoded dangerous chars
  /%00/,                              // Null byte
  /%2f%2e%2e/i,                       // Encoded ../
  /%3b/i,                             // Encoded ;
  /%7c/i,                             // Encoded |
  /%26/i,                             // Encoded &
];

/**
 * Validates that input doesn't contain dangerous shell patterns
 */
const containsDangerousPattern = (input: string): boolean => {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Sanitizes input by removing potentially dangerous characters
 * while preserving legitimate question content
 */
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
    .trim();
};

/**
 * Validation schema for chatbot questions
 * - Length: 2-500 characters
 * - Blocks shell metacharacters and injection patterns
 * - Sanitizes control characters
 */
export const chatbotInputSchema = z.string()
  .min(2, 'Question must be at least 2 characters')
  .max(500, 'Question cannot exceed 500 characters')
  .transform(sanitizeInput)
  .refine(
    (val) => !containsDangerousPattern(val),
    { message: 'Question contains invalid characters or patterns' }
  );

// Export types for TypeScript
export type ChatbotInput = z.infer<typeof chatbotInputSchema>;
