import React from 'react';
import { screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { renderWithProviders } from '@/utils/test-utils';

describe('Home Page', () => {
  it('renders the hero section with the problem/outcome-led heading', () => {
    renderWithProviders(<HomePage />);

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading).toHaveTextContent(/I solve real business problems/i);
  });

  it('renders the positioning badge', () => {
    renderWithProviders(<HomePage />);

    const badge = screen.getByText((_, element) => {
      const text = element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      return element?.tagName.toLowerCase() === 'p' && /Engineer · Data · Automation · AI/.test(text);
    });
    expect(badge).toBeInTheDocument();
  });

  it('renders the hero subline', () => {
    renderWithProviders(<HomePage />);

    // Phrase unique to the hero subline (the footer tagline also mentions KPI-driven systems).
    expect(screen.getByText(/internal tools, data pipelines, dashboards/i)).toBeInTheDocument();
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
    expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    expect(screen.getByText('Data Engineering')).toBeInTheDocument();
  });

  it('renders the core stack grouped by pillar', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText(/core stack/i)).toBeInTheDocument();
    // Stack-only tech (not present in any pillar tag list)
    expect(screen.getByText('Express')).toBeInTheDocument();
    // Common techs appear in both pillars and the stack, so assert >= 1
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0);
  });

  it('renders the MetricsSection', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByRole('heading', { name: /^impact$/i })).toBeInTheDocument();
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
    const projectsLink = within(navigation).getByText(/^projects$/i);
    const articlesLink = within(navigation).getByText(/^articles$/i);
    const aboutLink = within(navigation).getByText(/^about$/i);

    expect(homeLink).toHaveAttribute('href', '/');
    expect(workLink).toHaveAttribute('href', '/work');
    expect(projectsLink).toHaveAttribute('href', '/projects');
    expect(articlesLink).toHaveAttribute('href', '/articles');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
