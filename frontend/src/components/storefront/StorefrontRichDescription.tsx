import React from 'react';
import DOMPurify from 'dompurify';

interface StorefrontRichDescriptionProps {
  html?: string | null | undefined;
  fallbackText?: string | undefined;
  className?: string | undefined;
}

export const StorefrontRichDescription: React.FC<StorefrontRichDescriptionProps> = ({
  html,
  fallbackText = 'Manufactured under strict batch control and verified quality assurance directly in our central manufacturing facility.',
  className = '',
}) => {
  const rawContent = html?.trim();

  if (!rawContent) {
    return (
      <p className={`text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed ${className}`}>
        {fallbackText}
      </p>
    );
  }

  // Detect if content contains HTML tags
  const containsHtml = /<[a-z][\s\S]*>/i.test(rawContent);

  if (!containsHtml) {
    return (
      <p className={`text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed ${className}`}>
        {rawContent}
      </p>
    );
  }

  // Sanitize HTML safely
  const sanitized = DOMPurify.sanitize(rawContent, {
    ADD_TAGS: [
      'style',
      'span',
      'div',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'b',
      'i',
      'u',
      's',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'br',
      'hr',
      'blockquote',
      'code',
      'pre',
      'mark',
    ],
    ADD_ATTR: [
      'style',
      'class',
      'id',
      'target',
      'border',
      'cellpadding',
      'cellspacing',
      'width',
      'height',
      'align',
      'valign',
    ],
  });

  return (
    <div
      className={`storefront-rich-content text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
