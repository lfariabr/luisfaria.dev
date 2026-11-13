import React from 'react';
import { screen, within } from '@testing-library/react';
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

  it('renders the "What I do" pillars', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('What I do')).toBeInTheDocument();
    expect(screen.getByText('Secure education systems')).toBeInTheDocument();
    expect(screen.getByText('Data engineering & analytics')).toBeInTheDocument();
  });

  it('renders the core stack grouped by pillar', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/core stack/i)).toBeInTheDocument();
    // Stack-only tech (not present in any pillar tag list)
    expect(screen.getByText('pandas')).toBeInTheDocument();
    // Common techs appear in both pillars and the stack, so assert >= 1
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
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
