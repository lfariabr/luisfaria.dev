import React from 'react';
import { screen } from '@testing-library/react';
import { TimelineSection } from '@/components/sections/TimelineSection';
import { renderWithProviders } from '@/utils/test-utils';

describe('TimelineSection', () => {
  describe('Component Rendering', () => {
    it('renders the section heading', () => {
      renderWithProviders(<TimelineSection />);
      
      const heading = screen.getByRole('heading', { name: /timeline at a glance/i });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-2xl', 'text-center', 'font-bold');
    });

    it('renders the section subtitle', () => {
      renderWithProviders(<TimelineSection />);
      
      const subtitle = screen.getByText(/key career milestones and technical achievements/i);
      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('text-sm', 'text-muted-foreground', 'text-center');
    });

    it('renders all timeline entries', () => {
      renderWithProviders(<TimelineSection />);
      
      // Check for all time periods
      expect(screen.getByText('2016–2018')).toBeInTheDocument();
      expect(screen.getByText('2018–2023')).toBeInTheDocument();
      expect(screen.getByText('2023–2024')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
      expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('renders key project names', () => {
      renderWithProviders(<TimelineSection />);
      
      // Check for project mentions
      expect(screen.getByText(/ABlab Marketing/i)).toBeInTheDocument();
      expect(screen.getByText(/ERP & CRM/i)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('renders Konquista project link', () => {
      renderWithProviders(<TimelineSection />);
      
      const konquistaLink = screen.getByRole('link', { name: /konquista/i });
      expect(konquistaLink).toBeInTheDocument();
      expect(konquistaLink).toHaveAttribute(
        'href',
        '/projects/konquista-from-spreadsheet-chaos-to-1000-whatsapp-messages-a-day'
      );
      expect(konquistaLink).toHaveClass('font-semibold', 'underline');
    });

    it('renders Wedstack project link', () => {
      renderWithProviders(<TimelineSection />);
      
      const wedstackLink = screen.getByRole('link', { name: /wedstack/i });
      expect(wedstackLink).toBeInTheDocument();
      expect(wedstackLink).toHaveAttribute(
        'href',
        '/projects/from-groomzilla-to-full-stack-engineer-building-wedstack'
      );
      expect(wedstackLink).toHaveClass('font-semibold', 'underline');
    });

    it('applies hover styles to project links', () => {
      renderWithProviders(<TimelineSection />);
      
      const konquistaLink = screen.getByRole('link', { name: /konquista/i });
      expect(konquistaLink).toHaveClass('hover:text-emerald-500');
    });
  });

  describe('Accessibility', () => {
    it('uses semantic HTML with section element', () => {
      const { container } = renderWithProviders(<TimelineSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('uses ordered list for timeline', () => {
      renderWithProviders(<TimelineSection />);
      
      const timeline = screen.getByRole('list', { name: /career timeline/i });
      expect(timeline).toBeInTheDocument();
      expect(timeline.tagName).toBe('OL');
    });

    it('has accessible list items', () => {
      renderWithProviders(<TimelineSection />);
      
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(6); // 5 timeline entries
    });

    it('uses semantic heading hierarchy', () => {
      const { container } = renderWithProviders(<TimelineSection />);
      
      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2).toHaveTextContent(/timeline at a glance/i);
    });
  });

  describe('Content Verification', () => {
    it('displays project management experience (2016-2018)', () => {
      renderWithProviders(<TimelineSection />);
      
      expect(screen.getByText(/Tech Project Manager at ABlab Marketing/i)).toBeInTheDocument();
      expect(screen.getByText(/coordinating 3 agile squads/i)).toBeInTheDocument();
      expect(screen.getByText(/Sodexo.*Citroën.*Tegra/i)).toBeInTheDocument();
    });

    it('displays software engineering transition (2018-2023)', () => {
      renderWithProviders(<TimelineSection />);
      
      expect(screen.getByText(/Transitioned into Software Engineering/i)).toBeInTheDocument();
      expect(screen.getByText(/Laravel.*React.*PostgreSQL/i)).toBeInTheDocument();
      expect(screen.getByText(/1M\+ client records/i)).toBeInTheDocument();
    });

    it('displays Konquista launch (2023-2024)', () => {
      renderWithProviders(<TimelineSection />);
      
      expect(screen.getByText(/Django.*Celery.*Redis/i)).toBeInTheDocument();
      expect(screen.getByText(/30K\+ monthly messages/i)).toBeInTheDocument();
      expect(screen.getByText(/FastAPI.*Flask.*Streamlit/i)).toBeInTheDocument();
    });

    it('displays Sydney relocation (2024)', () => {
      renderWithProviders(<TimelineSection />);
      
      expect(screen.getByText(/Relocated to Sydney/i)).toBeInTheDocument();
      expect(screen.getByText(/Stanford.*Machine Learning Specialization/i)).toBeInTheDocument();
      expect(screen.getByText(/Strengthened backend architecture/i)).toBeInTheDocument();
    });

    it('displays current activities (2025)', () => {
      renderWithProviders(<TimelineSection />);
      
      expect(screen.getByText(/Master.*Software Engineering & AI/i)).toBeInTheDocument();
      expect(screen.getByText(/Next\.js.*GraphQL.*Stripe/i)).toBeInTheDocument();
      expect(screen.getByText(/built AI tools on OpenAI/i)).toBeInTheDocument();
      expect(screen.getAllByText(/dev\.to/i).length).toBeGreaterThan(0);
    });
  });

  describe('Styling and Layout', () => {
    it('applies correct container styles', () => {
      const { container } = renderWithProviders(<TimelineSection />);
      
      const section = container.querySelector('section');
      expect(section).toHaveClass('mx-auto', 'max-w-4xl', 'px-4', 'py-16');
    });

    it('applies timeline border styling', () => {
      renderWithProviders(<TimelineSection />);
      
      const timeline = screen.getByRole('list', { name: /career timeline/i });
      expect(timeline).toHaveClass('border-l-2', 'border-border', 'pl-6');
    });

    it('applies spacing between timeline items', () => {
      renderWithProviders(<TimelineSection />);
      
      const timeline = screen.getByRole('list', { name: /career timeline/i });
      expect(timeline).toHaveClass('space-y-6');
    });
  });

  describe('Responsive Behavior', () => {
    it('uses responsive text sizing', () => {
      renderWithProviders(<TimelineSection />);
      
      const heading = screen.getByRole('heading', { name: /timeline at a glance/i });
      expect(heading).toHaveClass('text-2xl');
    });

    it('centers heading content', () => {
      renderWithProviders(<TimelineSection />);
      
      const heading = screen.getByRole('heading', { name: /timeline at a glance/i });
      expect(heading).toHaveClass('text-center');
      
      const subtitle = screen.getByText(/key career milestones/i);
      expect(subtitle).toHaveClass('text-center');
    });
  });
});
