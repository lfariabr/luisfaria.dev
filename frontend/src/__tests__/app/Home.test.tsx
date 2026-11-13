import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { renderWithProviders } from '@/utils/test-utils';

describe('Home Page', () => {
  it('renders one fixed h1 headline, with no rotating frames', () => {
    renderWithProviders(<HomePage />);

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toHaveTextContent(
      /^Ten years of shipping software that real people depend on\.$/
    );
    // The old rotating lens pills are gone
    expect(screen.queryByText('Production Proof')).not.toBeInTheDocument();
  });

  it('renders the eyebrow and the first-person subline', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Senior Software Engineer · Sydney')).toBeInTheDocument();
    expect(screen.getByText(/^I'm Luis\./)).toBeInTheDocument();
  });

  it('renders one metrics row with the four agreed cards', () => {
    renderWithProviders(<HomePage />);

    const metrics = screen.getAllByRole('term').map((dt) => dt.textContent);
    expect(metrics).toEqual(['10+ yrs', '2,000', '2,000+', '1,400+']);

    const portal = screen.getByText(/parents on a pentested portal/i).closest('a');
    expect(portal).toHaveAttribute('href', expect.stringContaining('dev.to/lfariaus/2000-parents'));
    // The PR count is private work: no link
    expect(screen.getByText(/PRs merged to production/i).closest('a')).toBeNull();
  });

  it('renders CTA buttons', () => {
    renderWithProviders(<HomePage />);

    const workButton = screen.getByRole('link', { name: /see my work/i });
    const chatbotButton = screen.getByRole('link', { name: /try my ai assistant/i });

    expect(workButton).toHaveAttribute('href', '/work');
    expect(chatbotButton).toHaveAttribute('href', '/chatbot');
  });

  it('renders "What I\'m building now" with the three first-person cards', () => {
    renderWithProviders(<HomePage />);

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

  it('states only the measured load-test sizes and credits the talk', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/1, 10, 100 and 500 parents at once/)).toBeInTheDocument();
    // 1,000 was never measured
    expect(screen.queryByText(/1,000 parents/)).not.toBeInTheDocument();

    const credit = screen.getByRole('link', { name: /scaling slack and github with maude lemaire/i });
    expect(credit).toHaveAttribute('href', 'https://youtu.be/x6WqD4qHxSc');
  });

  it('links the open source card to merged PRs on other people\'s repos', () => {
    renderWithProviders(<HomePage />);

    const link = screen.getByRole('link', { name: /see my contributions/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('is%3Amerged+-user%3Alfariabr'));
  });

  it('renders "How I ship" with the human deciding what merges', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: /how i ship/i })).toBeInTheDocument();
    const roles = within(screen.getByRole('list', { name: /agent roles/i })).getAllByRole('listitem');
    expect(roles).toHaveLength(7);
    expect(roles[roles.length - 1]).toHaveTextContent(/^medecides what merges$/);
    expect(screen.getByText(/more than 2,000 pull requests/)).toBeInTheDocument();
  });

  it('lists each work area once, with no separate pillars or stack sections', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: /what i work with/i })).toBeInTheDocument();
    expect(screen.getAllByText('Production systems')).toHaveLength(1);
    expect(screen.getAllByText('TypeScript')).toHaveLength(1);
    expect(screen.queryByText('What I do')).not.toBeInTheDocument();
    expect(screen.queryByText(/core stack/i)).not.toBeInTheDocument();
  });

  it('lists the three newest articles, newest first, plus an all-writing link', () => {
    renderWithProviders(<HomePage />);

    const section = screen
      .getByRole('heading', { name: /latest writing/i })
      .closest('section') as HTMLElement;
    const items = within(section).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(/01 Nov 2026/);
    expect(within(items[0]).getByRole('link')).toHaveAttribute(
      'href',
      expect.stringContaining('dev.to/lfariaus/i-attempted-2000-pull-ups'),
    );
    expect(within(section).getByRole('link', { name: /all writing on dev\.to/i })).toHaveAttribute(
      'href',
      'https://dev.to/lfariaus',
    );
  });

  it('renders "Off the clock" with the timer link and the two dialog triggers', () => {
    renderWithProviders(<HomePage />);

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
    renderWithProviders(<HomePage />);

    fireEvent.click(screen.getByRole('button', { name: /goggins mode/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('no longer renders the second metrics section', () => {
    renderWithProviders(<HomePage />);

    expect(screen.queryByRole('heading', { name: /^impact$/i })).not.toBeInTheDocument();
  });

  it('renders the TimelineSection', () => {
    renderWithProviders(<HomePage />);

    const timelineHeading = screen.getByRole('heading', { name: /timeline at a glance/i });
    expect(timelineHeading).toBeInTheDocument();

    const timeline = screen.getByRole('list', { name: /career timeline/i });
    expect(timeline).toBeInTheDocument();
  });

  it('has the updated navigation links in the header', () => {
    renderWithProviders(<HomePage />);

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
