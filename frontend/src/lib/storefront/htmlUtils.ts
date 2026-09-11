/**
 * Utility to strip HTML tags and decode common HTML entities for plain text usage
 * (e.g., SEO meta tags, short previews, and title attributes).
 */
export function stripHtml(html?: string | null | undefined): string {
  if (!html) return '';
  const clean = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = clean;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  return clean
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
