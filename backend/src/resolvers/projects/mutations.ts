import Project from '../../models/Project';
import { checkRole } from '../../utils/authUtils';
import { generateUniqueProjectSlug, isValidSlug, slugify } from '../../utils/slugUtils';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';

export const projectMutations = {
  createProject: async (_: any, { input }: any, context: any) => {
    // Check if user is admin
    checkRole(context, 'ADMIN');
    
    // Auto-generate slug from title if not provided
    if (!input.slug) {
      if (!input.title) {
        throw Errors.badInput('Title is required to generate a slug');
      }
      input.slug = await generateUniqueProjectSlug(input.title);
    } else {
      // Validate and normalize provided slug
      input.slug = slugify(input.slug);
      if (!isValidSlug(input.slug)) {
        throw Errors.badInput('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.');
      }
      // Check for uniqueness of provided slug
      const existing = await Project.findOne({ slug: input.slug });
      if (existing) {
        throw Errors.badInput(`Slug "${input.slug}" is already in use. Please choose a different slug.`);
      }
    }
    
    const project = new Project(input);
    try {
      await project.save();
    } catch (error: any) {
      // Handle MongoDB duplicate key error (race condition on slug)
      if (error.code === 11000 || (error.name === 'MongoServerError' && error.message?.includes('duplicate key'))) {
        throw Errors.badInput(`Slug "${input.slug}" is already in use. Please choose a different slug.`);
      }
      throw error;
    }
    return project;
  },
  
  updateProject: async (_: any, { id, input }: any, context: any) => {
    // Check if user is admin
    checkRole(context, 'ADMIN');
    
    // If slug is being updated, validate and check uniqueness
    if (input.slug) {
      input.slug = slugify(input.slug);
      if (!isValidSlug(input.slug)) {
        throw Errors.badInput('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.');
      }
      // Check for uniqueness excluding current project
      const existing = await Project.findOne({ slug: input.slug, _id: { $ne: id } });
      if (existing) {
        throw Errors.badInput(`Slug "${input.slug}" is already in use. Please choose a different slug.`);
      }
    }
    
    return await Project.findByIdAndUpdate(
      id,
      { $set: input },
      { new: true, runValidators: true }
    );
  },
  
  deleteProject: async (_: any, { id }: { id: string }, context: any) => {
    // Check if user is admin
    checkRole(context, 'ADMIN');
    
    const result = await Project.findByIdAndDelete(id);
    return !!result;
  },
};