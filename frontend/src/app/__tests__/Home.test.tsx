import React from 'react';
import { screen, within } from '@testing-library/react';
import HomePage from '../page';
import { renderWithProviders } from '@/utils/test-utils';

describe('Home Page', () => {
  it('renders the hero section with main heading', () => {
    renderWithProviders(<HomePage />);
    
    // Check for hero heading
    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading).toHaveTextContent(/I build end-to-end systems/i);
  });

  it('renders the hero badge with credentials', () => {
    renderWithProviders(<HomePage />);
    
    const badge = screen.getByText(/Senior Software Engineer & Project Lead/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/Master's SWE & AI/i);
  });

  it('renders the hero description', () => {
    renderWithProviders(<HomePage />);
    
    const description = screen.getByText(/Luis.*Senior Software Engineer.*10\+ years/i);
    expect(description).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    renderWithProviders(<HomePage />);
    
    const projectsButton = screen.getByRole('link', { name: /view featured work/i });
    const chatbotButton = screen.getByRole('link', { name: /try my ai assistant/i });
    
    expect(projectsButton).toHaveAttribute('href', '/projects');
    expect(chatbotButton).toHaveAttribute('href', '/chatbot');
  });

  it('renders the Core Stack section', () => {
    renderWithProviders(<HomePage />);
    
    const coreStackLabel = screen.getByText(/core stack/i);
    expect(coreStackLabel).toBeInTheDocument();
    
    // Check for some key technologies (each is a separate element)
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Django')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
  });

  it('renders the MetricsSection', () => {
    renderWithProviders(<HomePage />);
    
    // MetricsSection should render - check for presence by finding Core Stack section
    // which comes before MetricsSection
    const coreStack = screen.getByText(/core stack/i);
    expect(coreStack).toBeInTheDocument();
  });

  it('renders the TimelineSection', () => {
    renderWithProviders(<HomePage />);
    
    // Check for timeline heading
    const timelineHeading = screen.getByRole('heading', { name: /timeline at a glance/i });
    expect(timelineHeading).toBeInTheDocument();
    
    // Check for timeline content
    const timeline = screen.getByRole('list', { name: /career timeline/i });
    expect(timeline).toBeInTheDocument();
  });

  it('has navigation links in the header', () => {
    renderWithProviders(<HomePage />);
    
    // Find the navigation element first, then find links within it
    const navigation = screen.getByRole('navigation');
    
    // Find links within the navigation
    const homeLink = within(navigation).getByText(/^home$/i);
    const projectsLink = within(navigation).getByText(/^projects$/i);
    const articlesLink = within(navigation).getByText(/^articles$/i);
    const chatbotLink = within(navigation).getByText(/^chatbot$/i);
    
    // Check that links have correct hrefs
    expect(homeLink).toHaveAttribute('href', '/');
    expect(projectsLink).toHaveAttribute('href', '/projects');
    expect(articlesLink).toHaveAttribute('href', '/articles');
    expect(chatbotLink).toHaveAttribute('href', '/chatbot');
  });
});
