import Project from '../../models/Project';
import { checkRole } from '../../utils/authUtils';
import { generateUniqueProjectSlug, isValidSlug, slugify } from '../../utils/slugUtils';

export const projectMutations = {
  createProject: async (_: any, { input }: any, context: any) => {
    // Check if user is admin
    checkRole(context, 'ADMIN');
    
    // Auto-generate slug from title if not provided
    if (!input.slug) {
      if (!input.title) {
        throw new Error('Title is required to generate a slug');
      }
      input.slug = await generateUniqueProjectSlug(input.title);
    } else {
      // Validate and normalize provided slug
      input.slug = slugify(input.slug);
      if (!isValidSlug(input.slug)) {
        throw new Error('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.');
      }
      // Check for uniqueness of provided slug
      const existing = await Project.findOne({ slug: input.slug });
      if (existing) {
        throw new Error(`Slug "${input.slug}" is already in use. Please choose a different slug.`);
      }
    }
    
    const project = new Project(input);
    await project.save();
    return project;
  },
  
  updateProject: async (_: any, { id, input }: any, context: any) => {
    // Check if user is admin
    checkRole(context, 'ADMIN');
    
    // If slug is being updated, validate and check uniqueness
    if (input.slug) {
      input.slug = slugify(input.slug);
      if (!isValidSlug(input.slug)) {
        throw new Error('Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens.');
      }
      // Check for uniqueness excluding current project
      const existing = await Project.findOne({ slug: input.slug, _id: { $ne: id } });
      if (existing) {
        throw new Error(`Slug "${input.slug}" is already in use. Please choose a different slug.`);
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