import { z } from 'zod';

// Common validation patterns
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// Register input validation
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().regex(emailRegex, 'Invalid email format'),
  password: z.string().regex(
    passwordRegex,
    'Password must be at least 8 characters, include uppercase, lowercase, number and special character'
  ),
  captchaToken: z.string().min(1, 'Captcha token is required'),
});

// Login input validation
export const loginSchema = z.object({
  email: z.string().regex(emailRegex, 'Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
