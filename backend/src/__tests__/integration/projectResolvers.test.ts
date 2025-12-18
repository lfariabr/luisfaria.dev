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
  mutation UpdateProject($id: ID!, $input: ProjectUpdateInput!) {
    updateProject(id: $id, input: $input) {
      id
      title
      slug
      description
    }
  }
`;

/**
 * Helper to extract single result from GraphQL response with strict assertions
 */
function assertSingleResult(response: any): { data: any; errors: any[] | undefined } {
  expect(response.body.kind).toBe('single');
  const result = (response.body as any).singleResult;
  return { data: result.data, errors: result.errors };
}

/**
 * Helper to assert successful project creation and return the project
 */
function assertProjectCreated(response: any): any {
  const { data, errors } = assertSingleResult(response);
  expect(errors).toBeUndefined();
  expect(data).toBeDefined();
  expect(data.createProject).toBeDefined();
  return data.createProject;
}

/**
 * Helper to assert successful project update and return the project
 */
function assertProjectUpdated(response: any): any {
  const { data, errors } = assertSingleResult(response);
  expect(errors).toBeUndefined();
  expect(data).toBeDefined();
  expect(data.updateProject).toBeDefined();
  return data.updateProject;
}

/**
 * Helper to assert GraphQL error response
 */
function assertGraphQLError(response: any, expectedMessagePart: string): void {
  const { errors } = assertSingleResult(response);
  expect(errors).toBeDefined();
  expect(errors!.length).toBeGreaterThan(0);
  expect(errors![0].message).toContain(expectedMessagePart);
}

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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('my-awesome-project');
      expect(project.title).toBe('My Awesome Project');
    });

    it('should generate unique slug with incrementing number on collision', async () => {
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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('test-project-2');
    });

    it('should generate slug with incrementing number for multiple collisions', async () => {
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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('my-project-3');
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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('custom-slug');
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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('custom-slug-with-spaces');
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
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('project-1-the-best-2024');
    });

    it('should strip leading/trailing hyphens from slug', async () => {
      const variables = {
        input: {
          title: '---Hello World---',
          description: 'A project with leading/trailing hyphens in title',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);
      const project = assertProjectCreated(response);
      
      expect(project.slug).toBe('hello-world');
    });
  });

  describe('createProject - Failure Modes', () => {
    it('should reject duplicate explicit slug', async () => {
      await Project.create({
        title: 'First',
        slug: 'taken-slug',
        description: 'First project',
        technologies: ['React'],
        imageUrl: 'https://example.com/1.png'
      });

      const variables = {
        input: {
          title: 'Second',
          slug: 'taken-slug',
          description: 'Should fail',
          technologies: ['Vue'],
          imageUrl: 'https://example.com/2.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);
      assertGraphQLError(response, 'already in use');
    });

    it('should reject invalid slug format after normalization', async () => {
      const variables = {
        input: {
          title: 'My Project',
          slug: '!!!@@@###',
          description: 'Should fail - slug becomes empty after normalization',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);
      assertGraphQLError(response, 'Invalid slug format');
    });

    it('should reject creation without title when slug is not provided', async () => {
      const variables = {
        input: {
          description: 'No title provided',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);
      // GraphQL schema enforces title as required, so we get a schema validation error
      assertGraphQLError(response, 'title');
    });

    it('should reject title that produces empty slug', async () => {
      const variables = {
        input: {
          title: '!!!@@@###',
          description: 'Title with only special chars',
          technologies: ['React'],
          imageUrl: 'https://example.com/image.png'
        }
      };

      const response = await executeOperation(CREATE_PROJECT_MUTATION, variables, adminContext);
      assertGraphQLError(response, 'Cannot generate slug from empty or invalid title');
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
      const project = assertProjectUpdated(response);
      
      expect(project.slug).toBe('new-unique-slug');
    });

    it('should normalize slug on update', async () => {
      const variables = {
        id: existingProject._id.toString(),
        input: {
          slug: 'New SLUG With Spaces'
        }
      };

      const response = await executeOperation(UPDATE_PROJECT_MUTATION, variables, adminContext);
      const project = assertProjectUpdated(response);
      
      expect(project.slug).toBe('new-slug-with-spaces');
    });

    it('should reject update to duplicate slug', async () => {
      await Project.create({
        title: 'Another Project',
        slug: 'another-slug',
        description: 'Another project',
        technologies: ['Vue'],
        imageUrl: 'https://example.com/another.png'
      });

      const variables = {
        id: existingProject._id.toString(),
        input: {
          slug: 'another-slug'
        }
      };

      const response = await executeOperation(UPDATE_PROJECT_MUTATION, variables, adminContext);
      assertGraphQLError(response, 'already in use');
    });

    it('should reject update with invalid slug format', async () => {
      // Use a slug that normalizes to something invalid (empty after stripping special chars)
      // Note: '!!!invalid!!!' normalizes to 'invalid' which is valid
      // We need to test with something that stays invalid after normalization
      const variables = {
        id: existingProject._id.toString(),
        input: {
          slug: '!!!@@@###'
        }
      };

      const response = await executeOperation(UPDATE_PROJECT_MUTATION, variables, adminContext);
      assertGraphQLError(response, 'Invalid slug format');
    });
  });
});
