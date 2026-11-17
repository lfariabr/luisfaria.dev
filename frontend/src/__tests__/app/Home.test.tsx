import { fireEvent, screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { renderWithProviders } from '@/utils/test-utils';

// The page reads Latest writing through the backend's latestWriting query (#515).
jest.mock('@/lib/graphql/fetchGql', () => ({ fetchGql: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));
import { fetchGql } from '@/lib/graphql/fetchGql';
import { logger } from '@/lib/logger';
import { LATEST_WRITING } from '@/content/profile';

const mockFetchGql = fetchGql as jest.Mock;
const POSTS = [
  {
    title: "My server didn't go down. Chasing the false alarm hardened everything else.",
    url: 'https://dev.to/lfariaus/my-server-didnt-go-down-chasing-the-false-alarm-hardened-everything-else-feo',
    publishedAt: '2026-11-16T19:32:13Z',
  },
  {
    title: 'I attempted 2,000 pull-ups. The next morning, I open-sourced my timer.',
    url: 'https://dev.to/lfariaus/i-attempted-2000-pull-ups-the-next-morning-i-open-sourced-my-timer-31h',
    publishedAt: '2026-11-01T19:04:43Z',
  },
  {
    title: '35 seconds to log a coffee: what one screen recording taught me about iPhone Safari',
    url: 'https://dev.to/lfariaus/35-seconds-to-log-a-coffee-what-one-screen-recording-taught-me-about-iphone-safari-32a5',
    publishedAt: '2026-10-19T17:52:30Z',
  },
];

beforeEach(() => {
  mockFetchGql.mockReset();
  mockFetchGql.mockResolvedValue({ latestWriting: POSTS });
});

const latestWritingItems = () =>
  within(screen.getByRole('heading', { name: /latest writing/i }).closest('section') as HTMLElement).getAllByRole(
    'listitem',
  );

describe('Home Page', () => {
  it('renders one fixed h1 headline, with no rotating frames', async () => {
    renderWithProviders(await HomePage());

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveTextContent(
      /^Ten years of shipping software that real people depend on\.$/
    );
    // The old rotating lens pills are gone
    expect(screen.queryByText('Production Proof')).not.toBeInTheDocument();
  });

  it('renders the eyebrow and the first-person subline', async () => {
    renderWithProviders(await HomePage());

    expect(screen.getByText('Senior Software Engineer · Sydney')).toBeInTheDocument();
    expect(screen.getByText(/^I'm Luis\./)).toBeInTheDocument();
  });

  it('renders one metrics row with the four agreed cards', async () => {
    renderWithProviders(await HomePage());

    const metrics = screen.getAllByRole('term').map((dt) => dt.textContent);
    expect(metrics).toEqual(['10+ yrs', '2,000', '2,000+', '1,400+']);

    const portal = screen.getByText(/parents on a pentested portal/i).closest('a');
    expect(portal).toHaveAttribute('href', expect.stringContaining('dev.to/lfariaus/2000-parents'));
    // The PR count is private work: no link
    expect(screen.getByText(/PRs merged to production/i).closest('a')).toBeNull();
  });

  it('renders CTA buttons', async () => {
    renderWithProviders(await HomePage());

    const workButton = screen.getByRole('link', { name: /see my work/i });


    expect(workButton).toHaveAttribute('href', '/work');
    // The chatbot is hidden for now (#497)
    expect(screen.queryByRole('link', { name: /ai assistant/i })).not.toBeInTheDocument();
  });

  it('renders "What I\'m building now" with the three first-person cards', async () => {
    renderWithProviders(await HomePage());

    const section = screen
      .getByRole('heading', { name: /what i’m building now/i })
      .closest('section') as HTMLElement;
    const titles = within(section)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual([
      'A parent portal for 2,000 families',
      'Coursework that turns into real software',
      'Fixing the tools I use, upstream',
    ]);
    expect(screen.queryByRole('heading', { name: /current proof/i })).not.toBeInTheDocument();
  });

  it('states only the measured load-test sizes and credits the talk', async () => {
    renderWithProviders(await HomePage());

    expect(screen.getByText(/1, 10, 100 and 500 parents at once/)).toBeInTheDocument();
    // 1,000 was never measured
    expect(screen.queryByText(/1,000 parents/)).not.toBeInTheDocument();

    const credit = screen.getByRole('link', { name: /scaling slack and github with maude lemaire/i });
    expect(credit).toHaveAttribute('href', 'https://youtu.be/x6WqD4qHxSc');
  });

  it('links the open source card to merged PRs on other people\'s repos', async () => {
    renderWithProviders(await HomePage());

    const link = screen.getByRole('link', { name: /see my contributions/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('is%3Amerged+-user%3Alfariabr'));
  });

  it('renders "How I ship" with the human deciding what merges', async () => {
    renderWithProviders(await HomePage());

    expect(screen.getByRole('heading', { name: /how i ship/i })).toBeInTheDocument();
    const roles = within(screen.getByRole('list', { name: /agent roles/i })).getAllByRole('listitem');
    expect(roles).toHaveLength(7);
    expect(roles[roles.length - 1]).toHaveTextContent(/^medecides what merges$/);
    expect(screen.getByText(/more than 2,000 pull requests/)).toBeInTheDocument();
  });

  it('lists each work area once, with no separate pillars or stack sections', async () => {
    renderWithProviders(await HomePage());

    expect(screen.getByRole('heading', { name: /what i work with/i })).toBeInTheDocument();
    expect(screen.getAllByText('Production systems')).toHaveLength(1);
    expect(screen.getAllByText('TypeScript')).toHaveLength(1);
    expect(screen.queryByText('What I do')).not.toBeInTheDocument();
    expect(screen.queryByText(/core stack/i)).not.toBeInTheDocument();
  });

  it('lists the three newest articles, newest first, plus an all-writing link', async () => {
    renderWithProviders(await HomePage());

    const section = screen
      .getByRole('heading', { name: /latest writing/i })
      .closest('section') as HTMLElement;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/16 Nov 2026/);
    expect(within(items[0]).getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('dev.to/lfariaus/my-server-didnt-go-down'),
    );
    expect(items[1]).toHaveTextContent(/01 Nov 2026/);
    expect(items[2]).toHaveTextContent(/19 Oct 2026/);
    expect(within(section).getByRole('link', { name: /all writing on dev\.to/i })).toHaveAttribute(
      'href',
      'https://dev.to/lfariaus',
    );
  });

  it('reads Latest writing from the backend query, cached for an hour', async () => {
    renderWithProviders(await HomePage());

    expect(mockFetchGql).toHaveBeenCalledWith(expect.stringContaining('latestWriting'), { revalidate: 3600 });
    expect(latestWritingItems().map((li) => li.querySelector('time')?.getAttribute('datetime'))).toEqual([
      '2026-11-16T19:32:13Z',
      '2026-11-01T19:04:43Z',
      '2026-10-19T17:52:30Z',
    ]);
  });

  it.each([
    ['the backend is down', () => mockFetchGql.mockRejectedValue(new Error('GraphQL fetch failed: 502'))],
    ['dev.to is down (the query errors)', () => mockFetchGql.mockRejectedValue(new Error('An unexpected error occurred while fetching posts from dev.to'))],
    ['the query returns no posts', () => mockFetchGql.mockResolvedValue({ latestWriting: [] })],
  ])('falls back to the static list when %s', async (_case, arrange) => {
    arrange();

    renderWithProviders(await HomePage());

    const items = latestWritingItems();
    expect(items).toHaveLength(LATEST_WRITING.length);
    expect(items[0].querySelector('time')).toHaveAttribute('datetime', LATEST_WRITING[0].date);
    expect(logger.warn).toHaveBeenCalledWith(
      'Latest writing unavailable, using the static list',
      expect.objectContaining({ error: expect.any(String) }),
    );
  });

  it('renders "Off the clock" with the timer link and the two dialog triggers', async () => {
    renderWithProviders(await HomePage());

    const section = screen
      .getByRole('heading', { name: /off the clock/i })
      .closest('section') as HTMLElement;
    expect(within(section).getByRole('link', { name: /pull-ups/i })).toHaveAttribute(
      'href',
      'https://emom-pullups.vercel.app',
    );
    expect(within(section).getByRole('button', { name: /goggins mode/i })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: /picture of the day/i })).toBeInTheDocument();
  });

  it('opens the Goggins dialog from "Off the clock"', async () => {
    renderWithProviders(await HomePage());

    fireEvent.click(screen.getByRole('button', { name: /goggins mode/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('no longer renders the second metrics section', async () => {
    renderWithProviders(await HomePage());

    expect(screen.queryByRole('heading', { name: /^impact$/i })).not.toBeInTheDocument();
  });

  it('renders the TimelineSection', async () => {
    renderWithProviders(await HomePage());

    const timelineHeading = screen.getByRole('heading', { name: /timeline at a glance/i });
    expect(timelineHeading).toBeInTheDocument();

    const timeline = screen.getByRole('list', { name: /career timeline/i });
    expect(timeline).toBeInTheDocument();
  });

  it('has the updated navigation links in the header', async () => {
    renderWithProviders(await HomePage());

    const navigation = screen.getByRole('navigation');

    const homeLink = within(navigation).getByText(/^home$/i);
    const workLink = within(navigation).getByText(/^work$/i);
    const writingLink = within(navigation).getByText(/^writing$/i);
    const aboutLink = within(navigation).getByText(/^about$/i);

    expect(homeLink).toHaveAttribute('href', '/');
    expect(workLink).toHaveAttribute('href', '/work');
    expect(writingLink).toHaveAttribute('href', 'https://dev.to/lfariaus');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
