import * as dbHandler from '../helpers/dbHandler';
import { executeOperation } from '../helpers/testServer';
import User, { UserRole } from '../../models/User';
import Note from '../../models/Note';
import bcrypt from 'bcryptjs';

const CREATE_NOTE_MUTATION = `
  mutation CreateNote($input: NoteInput!) {
    createNote(input: $input) {
      id
      title
      content
      periodType
      accomplishments
      nextPlans
      tags
    }
  }
`;

const UPDATE_NOTE_MUTATION = `
  mutation UpdateNote($id: ID!, $input: NoteUpdateInput!) {
    updateNote(id: $id, input: $input) {
      id
      title
      content
      periodType
      tags
    }
  }
`;

const DELETE_NOTE_MUTATION = `
  mutation DeleteNote($id: ID!) {
    deleteNote(id: $id)
  }
`;

const MY_NOTES_QUERY = `
  query MyNotes($periodType: NotePeriodType, $year: Int, $month: Int, $search: String, $tag: String) {
    myNotes(periodType: $periodType, year: $year, month: $month, search: $search, tag: $tag) {
      id
      title
      content
      tags
      periodType
    }
  }
`;

describe('Notes Resolvers', () => {
  let userAContext: { user: { id: string; email: string; role: UserRole } };
  let userBContext: { user: { id: string; email: string; role: UserRole } };

  beforeAll(async () => {
    await dbHandler.connect();
  });

  beforeEach(async () => {
    await dbHandler.clearDatabase();

    const passwordHash = await bcrypt.hash('Pass1234!', 10);
    const userA = await User.create({
      name: 'User A',
      email: 'user-a@example.com',
      password: passwordHash,
      role: UserRole.USER,
    });
    const userB = await User.create({
      name: 'User B',
      email: 'user-b@example.com',
      password: passwordHash,
      role: UserRole.USER,
    });

    userAContext = {
      user: { id: getDocId(userA as { _id: unknown }), email: userA.email, role: UserRole.USER },
    };
    userBContext = {
      user: { id: getDocId(userB as { _id: unknown }), email: userB.email, role: UserRole.USER },
    };
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  it('creates and returns a note for authenticated user', async () => {
    const response = await executeOperation(
      CREATE_NOTE_MUTATION,
      {
        input: {
          title: 'Weekly checkpoint',
          content: 'Gym and reading progress',
          periodType: 'WEEKLY',
          accomplishments: ['Gym 5x'],
          nextPlans: ['Sleep better'],
          tags: ['health'],
        },
      },
      userAContext
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeUndefined();
      const created = (response.body.singleResult.data as any)?.createNote;
      expect(created.title).toBe('Weekly checkpoint');
      expect(created.periodType).toBe('WEEKLY');
      expect(created.tags).toContain('health');
    }
  });

  it('updates only owner note', async () => {
    const note = await Note.create({
      userId: userAContext.user.id,
      title: 'Initial',
      content: 'Initial content',
      periodType: 'WEEKLY',
      tags: ['focus'],
    });

    const response = await executeOperation(
      UPDATE_NOTE_MUTATION,
      {
        id: getDocId(note as { _id: unknown }),
        input: {
          title: 'Updated',
          content: 'Updated content',
          tags: ['focus', 'study'],
        },
      },
      userAContext
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeUndefined();
      const updated = (response.body.singleResult.data as any)?.updateNote;
      expect(updated.title).toBe('Updated');
      expect(updated.tags).toContain('study');
    }
  });

  it('does not allow reading another user note', async () => {
    const note = await Note.create({
      userId: userAContext.user.id,
      title: 'Private',
      content: 'Private content',
      periodType: 'WEEKLY',
    });

    const response = await executeOperation(
      `
      query Note($id: ID!) {
        note(id: $id) {
          id
        }
      }
      `,
      { id: getDocId(note as { _id: unknown }) },
      userBContext
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeTruthy();
      expect(response.body.singleResult.errors?.[0].message).toContain('Note not found');
    }
  });

  it('filters notes by period and search', async () => {
    await Note.create({
      userId: userAContext.user.id,
      title: 'January checkpoint',
      content: 'Reading progress and gym routine',
      date: new Date('2026-01-18T00:00:00.000Z'),
      periodType: 'WEEKLY',
      tags: ['gym'],
    });
    await Note.create({
      userId: userAContext.user.id,
      title: 'February goals',
      content: 'Savings and workouts',
      date: new Date('2026-02-05T00:00:00.000Z'),
      periodType: 'MONTHLY',
      tags: ['money'],
    });

    const response = await executeOperation(
      MY_NOTES_QUERY,
      {
        periodType: 'WEEKLY',
        year: 2026,
        month: 1,
        search: 'reading',
      },
      userAContext
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeUndefined();
      const notes = ((response.body.singleResult.data as any)?.myNotes ?? []) as Array<{ title: string }>;
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toBe('January checkpoint');
    }
  });

  it('deletes owner note', async () => {
    const note = await Note.create({
      userId: userAContext.user.id,
      title: 'To delete',
      content: 'Delete me',
      periodType: 'WEEKLY',
    });

    const response = await executeOperation(
      DELETE_NOTE_MUTATION,
      { id: getDocId(note as { _id: unknown }) },
      userAContext
    );

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeUndefined();
      expect((response.body.singleResult.data as any)?.deleteNote).toBe(true);
    }
  });
});
  const getDocId = (doc: { _id: unknown }) => String(doc._id);
