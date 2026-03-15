import { registerSchema, loginSchema } from '../../validation/schemas/user.schema';
import { screamInputSchema } from '../../validation/schemas/scream.schema';

describe('User Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should pass validation with valid data', () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Test1234!',
        captchaToken: 'test-turnstile-pass',
      };
      
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    it('should fail validation with short name', () => {
      const invalidData = {
        name: 'T',
        email: 'test@example.com',
        password: 'Test1234!',
        captchaToken: 'test-turnstile-pass',
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Name must be at least 2 characters');
      }
    });
    
    it('should fail validation with invalid email', () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Test1234!',
        captchaToken: 'test-turnstile-pass',
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email format');
      }
    });
    
    it('should fail validation with invalid password', () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        captchaToken: 'test-turnstile-pass',
      };
      
      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
  
  describe('Login Schema', () => {
    it('should pass validation with valid credentials', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
    
    it('should fail validation with invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email format');
      }
    });
    
    it('should fail validation with empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });
    
    // screamInputSchema tests
    it('screamInputSchema should fail with invalid userEmail', () => {
      const invalidData = {
        userEmail: 'invalid-email',
        explicitMode: false,
      };
      
      const result = screamInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // matches z.string().email('Invalid email address')
        expect(result.error.issues[0].message).toContain('Invalid email address');
      }
    });

    it('screamInputSchema should fail with non-boolean explicitMode', () => {
      const invalidData = {
        userEmail: 'test@example.com',
        // '@ts-expect-error testing invalid type
        explicitMode: 'invalid',
      };
      
      const result = screamInputSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // zod default message for type mismatch
        expect(result.error.issues[0].message).toContain('Expected boolean');
      }
    });
  });
});
