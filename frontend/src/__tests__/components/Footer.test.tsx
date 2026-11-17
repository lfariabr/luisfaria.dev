import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Footer } from '@/components/layouts/Footer';

describe('Footer', () => {
  it('links every page in the footer nav', () => {
    render(<Footer />);
    const nav = screen.getByRole('navigation', { name: 'Footer' });

    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['Work', '/work'],
      ['Projects', '/projects'],
      ['Articles', '/articles'],
      ['Timeline', '/timeline'],
      ['About', '/about'],
      ['Contact', '/contact'],
    ]);
  });

  it('labels each social icon for screen readers and opens external ones in a new tab', () => {
    render(<Footer />);
    const social = screen.getByRole('list', { name: 'Social' });

    expect(within(social).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/lfariabr');
    expect(within(social).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://linkedin.com/in/lfariabr');
    expect(within(social).getByRole('link', { name: 'dev.to' })).toHaveAttribute('href', 'https://dev.to/lfariaus');

    for (const name of ['GitHub', 'LinkedIn', 'dev.to']) {
      const link = within(social).getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }

    const email = within(social).getByRole('link', { name: 'Email' });
    expect(email.getAttribute('href')).toMatch(/^mailto:/);
    expect(email).not.toHaveAttribute('target');
  });

  it('keeps the legal links and the copyright line', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByText(`© ${new Date().getFullYear()} Luis Faria`)).toBeInTheDocument();
  });
});
