import { slugify, isValidSlug } from '../../utils/slugUtils';

describe('slugUtils', () => {
  describe('slugify', () => {
    it('should convert text to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('my project title')).toBe('my-project-title');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello! World? @2024')).toBe('hello-world-2024');
    });

    it('should trim whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('should collapse multiple hyphens into one', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('hello    world')).toBe('hello-world');
    });

    it('should handle accented characters by removing them', () => {
      expect(slugify('café résumé')).toBe('caf-rsum');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle numbers', () => {
      expect(slugify('Project 123')).toBe('project-123');
    });

    it('should handle mixed case and special chars', () => {
      expect(slugify('My AWESOME Project! (2024)')).toBe('my-awesome-project-2024');
    });
  });

  describe('isValidSlug', () => {
    it('should return true for valid slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('my-project-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
      expect(isValidSlug('test')).toBe(true);
    });

    it('should return false for slugs starting with hyphen', () => {
      expect(isValidSlug('-hello')).toBe(false);
    });

    it('should return false for slugs ending with hyphen', () => {
      expect(isValidSlug('hello-')).toBe(false);
    });

    it('should return false for slugs with consecutive hyphens', () => {
      expect(isValidSlug('hello--world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidSlug('')).toBe(false);
    });

    it('should return false for slugs with uppercase letters', () => {
      expect(isValidSlug('Hello-World')).toBe(false);
    });

    it('should return false for slugs with special characters', () => {
      expect(isValidSlug('hello_world')).toBe(false);
      expect(isValidSlug('hello.world')).toBe(false);
      expect(isValidSlug('hello@world')).toBe(false);
    });

    it('should return false for very long slugs (>200 chars)', () => {
      const longSlug = 'a'.repeat(201);
      expect(isValidSlug(longSlug)).toBe(false);
    });

    it('should return true for slugs at max length (200 chars)', () => {
      const maxSlug = 'a'.repeat(200);
      expect(isValidSlug(maxSlug)).toBe(true);
    });
  });
});
