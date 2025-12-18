import Project from '../models/Project';

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns A lowercase, hyphenated slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique slug for a project by checking for collisions
 * and appending an incrementing number if necessary (e.g., my-title, my-title-2, my-title-3)
 * @param title - The project title to generate a slug from
 * @param excludeId - Optional project ID to exclude from collision check (for updates)
 * @returns A unique slug string
 */
const MAX_SLUG_ATTEMPTS = 1000;

export async function generateUniqueProjectSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugify(title);
  
  if (!baseSlug) {
    throw new Error('Cannot generate slug from empty or invalid title');
  }

  let slug = baseSlug;
  let counter = 1;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Project.findOne(query);
    
    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  throw new Error(
    `Unable to generate unique slug after ${MAX_SLUG_ATTEMPTS} attempts. Base slug: "${baseSlug}"`
  );
}

/**
 * Validates that a slug follows the expected pattern
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  // Slug must be lowercase, contain only alphanumeric characters and hyphens,
  // not start or end with a hyphen, and not have consecutive hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 200;
}
