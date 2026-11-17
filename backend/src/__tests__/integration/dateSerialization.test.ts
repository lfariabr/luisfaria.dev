import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import Article from '../../models/Article';
import Project from '../../models/Project';

// Strict ISO 8601 as Date.prototype.toISOString writes it.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type OperationResponse = Awaited<ReturnType<typeof executeOperation>>;
type AdminContext = { user: { id: string; email: string; role: UserRole } };
type Dates = Record<string, string | null>;

const resultOf = <T>(response: OperationResponse): T => {
  if (response.body.kind !== 'single') {
    throw new Error(`Expected a single GraphQL result, got ${response.body.kind}`);
  }
  const { data, errors } = response.body.singleResult;
  expect(errors).toBeUndefined();
  return data as T;
};

describe('Date fields are ISO 8601 (#322)', () => {
  let adminContext: AdminContext;

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: UserRole.ADMIN,
      lastLogin: new Date('2026-11-01T10:00:00.000Z'),
    });
    adminContext = { user: { id: admin._id.toString(), email: admin.email, role: UserRole.ADMIN } };
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('User: lastLogin, createdAt and updatedAt', async () => {
    const data = resultOf<{ users: Dates[] }>(
      await executeOperation('{ users { lastLogin createdAt updatedAt } }', {}, adminContext),
    );
    const [user] = data.users;
    expect(user.lastLogin).toBe('2026-11-01T10:00:00.000Z');
    expect(user.createdAt).toMatch(ISO);
    expect(user.updatedAt).toMatch(ISO);
  });

  it('Article: publishedAt, createdAt and updatedAt', async () => {
    await Article.create({
      title: 'Dated',
      slug: 'dated',
      content: 'Body',
      excerpt: 'Excerpt',
      published: true,
    });
    const data = resultOf<{ publishedArticles: Dates[] }>(
      await executeOperation('{ publishedArticles { publishedAt createdAt updatedAt } }'),
    );
    const [article] = data.publishedArticles;
    expect(article.publishedAt).toMatch(ISO);
    expect(article.createdAt).toMatch(ISO);
    expect(article.updatedAt).toMatch(ISO);
  });

  it('Project: createdAt and updatedAt', async () => {
    await Project.create({
      title: 'Dated project',
      slug: 'dated-project',
      description: 'Description',
      technologies: ['TypeScript'],
      imageUrl: 'https://example.com/image.png',
    });
    const data = resultOf<{ projects: Dates[] }>(await executeOperation('{ projects { createdAt updatedAt } }'));
    const [project] = data.projects;
    expect(project.createdAt).toMatch(ISO);
    expect(project.updatedAt).toMatch(ISO);
  });
});
