import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorefrontRichDescription } from './StorefrontRichDescription';
import { stripHtml } from '../../lib/storefront/htmlUtils';

describe('StorefrontRichDescription', () => {
  it('renders fallback text when html is empty or null', () => {
    render(<StorefrontRichDescription html={null} fallbackText="Default guarantee description" />);
    expect(screen.getByText('Default guarantee description')).toBeInTheDocument();
  });

  it('renders plain text directly when no HTML tags are present', () => {
    render(<StorefrontRichDescription html="Simple product description without any tags." />);
    expect(screen.getByText('Simple product description without any tags.')).toBeInTheDocument();
  });

  it('renders and sanitizes rich HTML specifications with tables and headings', () => {
    const richHtml = `
      <div style="font-family: inherit;">
        <h3>Technical Product Specification</h3>
        <p>Engineered for high-reliability commercial applications.</p>
        <table>
          <thead>
            <tr><th>Technical Property</th><th>Rated Specification</th></tr>
          </thead>
          <tbody>
            <tr><td>Standard Grade</td><td>A+</td></tr>
          </tbody>
        </table>
      </div>
    `;

    const { container } = render(<StorefrontRichDescription html={richHtml} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Technical Product Specification' })).toBeInTheDocument();
    expect(screen.getByText('Engineered for high-reliability commercial applications.')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Standard Grade')).toBeInTheDocument();
    expect(container.querySelector('.storefront-rich-content')).toBeInTheDocument();
  });

  it('strips dangerous scripts and malicious tags', () => {
    const maliciousHtml = `
      <p>Safe text</p>
      <script>alert('xss')</script>
      <img src="invalid" onerror="alert('hack')" />
    `;
    const { container } = render(<StorefrontRichDescription html={maliciousHtml} />);
    expect(screen.getByText('Safe text')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('onerror')).toBeNull();
    }
  });

  describe('stripHtml helper', () => {
    it('returns empty string for null/undefined/empty input', () => {
      expect(stripHtml(null)).toBe('');
      expect(stripHtml(undefined)).toBe('');
      expect(stripHtml('')).toBe('');
    });

    it('strips HTML tags and entities', () => {
      const html = '<div style="color: red;"><p>Hello &amp; <b>World</b>!</p></div>';
      expect(stripHtml(html)).toBe('Hello & World!');
    });

    it('removes style and script blocks completely', () => {
      const html = '<style>body { color: black; }</style><p>Real Content</p><script>console.log("hi")</script>';
      expect(stripHtml(html)).toBe('Real Content');
    });
  });
});
