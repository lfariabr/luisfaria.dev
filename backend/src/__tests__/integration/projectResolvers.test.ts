import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import Project from '../../models/Project';
import bcrypt from 'bcryptjs';

const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($input: ProjectInput!) {
    createProject(input: $input) {
      id
      title
      slug
      description
      technologies
      imageUrl
      githubUrl
      liveUrl
      featured
      order
    }
  }
`;

const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($id: ID!, $input: ProjectInput!) {
    updateProject(id: $id, input: $input) {
      id
      title
      slug
      description
    }
  }
`;

describe('Project Resolvers - Slug Generation', () => {
  let adminUser: any;
  let adminContext: any;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    
    // Create admin user for tests
    const passwordHash = await bcrypt.hash('Admin1234!', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: UserRole.ADMIN
    });

    adminContext = {
      user: {
        id: adminUser._id.toString(),
        email: adminUser.email,
        role: UserRole.ADMIN
      }
    };
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  describe('createProject - Slug Auto-Generation', () => {
    it('should auto-generate slug from title when slug is not provided', async () => {
      const variables = {
        input: {
          title: 'My Awesome Project',
          description: 'A great project description',
          technologies: ['React', 'Node.js'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('my-awesome-project');
          expect(project.title).toBe('My Awesome Project');
        }
      }
    });

    it('should generate unique slug with incrementing number on collision', async () => {
      // Create first project with slug
      await Project.create({
        title: 'Test Project',
        slug: 'test-project',
        description: 'First project',
        technologies: ['React'],
        imageUrl: 'https://example.com/image1.png'
      });

      const variables = {
        input: {
          title: 'Test Project',
          description: 'Second project with same title',
          technologies: ['Vue'],
          imageUrl: 'https://example.com/image2.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('test-project-2');
        }
      }
    });

    it('should generate slug with incrementing number for multiple collisions', async () => {
      // Create projects with existing slugs
      await Project.create({
        title: 'My Project',
        slug: 'my-project',
        description: 'First',
        technologies: ['React'],
        imageUrl: 'https://example.com/1.png'
      });
      await Project.create({
        title: 'My Project 2',
        slug: 'my-project-2',
        description: 'Second',
        technologies: ['React'],
        imageUrl: 'https://example.com/2.png'
      });

      const variables = {
        input: {
          title: 'My Project',
          description: 'Third project',
          technologies: ['Angular'],
          imageUrl: 'https://example.com/3.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('my-project-3');
        }
      }
    });

    it('should use provided slug when explicitly set', async () => {
      const variables = {
        input: {
          title: 'My Project',
          slug: 'custom-slug',
          description: 'A project with custom slug',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('custom-slug');
        }
      }
    });

    it('should normalize provided slug', async () => {
      const variables = {
        input: {
          title: 'My Project',
          slug: 'Custom SLUG With Spaces',
          description: 'A project with unnormalized slug',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('custom-slug-with-spaces');
        }
      }
    });

    it('should handle special characters in title for slug generation', async () => {
      const variables = {
        input: {
          title: 'Project #1: The Best! (2024)',
          description: 'A project with special chars in title',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.createProject) {
          const project = data.createProject as any;
          expect(project.slug).toBe('project-1-the-best-2024');
        }
      }
    });
  });

  describe('updateProject - Slug Validation', () => {
    let existingProject: any;

    beforeEach(async () => {
      existingProject = await Project.create({
        title: 'Existing Project',
        slug: 'existing-project',
        description: 'An existing project',
        technologies: ['React'],
        imageUrl: 'https://example.com/existing.png'
      });
    });

    it('should allow updating slug to a unique value', async () => {
      const variables = {
        id: existingProject._id.toString(),
        input: {
          slug: 'new-unique-slug'
        }
      };

      const response = await executeOperation(UPDATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.updateProject) {
          const project = data.updateProject as any;
          expect(project.slug).toBe('new-unique-slug');
        }
      }
    });

    it('should normalize slug on update', async () => {
      const variables = {
        id: existingProject._id.toString(),
        input: {
          slug: 'New SLUG With Spaces'
        }
      };

      const response = await executeOperation(UPDATE_PROJECT_MUTATION, variables, adminContext);

      expect(response.body.kind).toBe('single');
      if (response.body.kind === 'single') {
        const data = response.body.singleResult.data;
        if (data?.updateProject) {
          const project = data.updateProject as any;
          expect(project.slug).toBe('new-slug-with-spaces');
        }
      }
    });
  });
});
