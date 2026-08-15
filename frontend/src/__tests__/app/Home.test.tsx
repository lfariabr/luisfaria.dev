import React from 'react';
import { screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { renderWithProviders } from '@/utils/test-utils';

describe('Home Page', () => {
  it('renders the static canonical h1 (SEO/no-JS safe)', () => {
    renderWithProviders(<HomePage />);

    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading).toHaveTextContent(
      /I build secure data products and applied ML systems that survive production\./i
    );
  });

  it('renders the rotating lens pill frames (canonical Production Proof first)', () => {
    renderWithProviders(<HomePage />);

    // All frames are in the DOM (grid-stacked); the canonical one is shown on first paint.
    expect(screen.getByText('Production Proof')).toBeInTheDocument();
    expect(screen.getAllByText('Applied ML').length).toBeGreaterThan(0);
  });

  it('renders the hero subline', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByText(/SQL Server, Power BI, Next\.js, secure school data products/i)
    ).toBeInTheDocument();
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
    const writingLink = within(navigation).getByText(/^writing$/i);
    const aboutLink = within(navigation).getByText(/^about$/i);

    expect(homeLink).toHaveAttribute('href', '/');
    expect(workLink).toHaveAttribute('href', '/work');
    expect(writingLink).toHaveAttribute('href', 'https://dev.to/lfariaus');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
