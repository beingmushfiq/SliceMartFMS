import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLdSchema } from './JsonLdSchema';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
  showHomeIcon?: boolean;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  className = '',
  showHomeIcon = true,
}) => {
  if (!items || items.length === 0) return null;

  const schemaItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: strToAbsoluteUrl(item.url),
  }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };

  return (
    <>
      <JsonLdSchema id="breadcrumb-list-schema" schema={breadcrumbSchema} />
      <nav aria-label="Breadcrumb" className={`text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
        <ol className="flex flex-wrap items-center gap-1.5 list-none p-0 m-0">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.url + index} className="inline-flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight className="size-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" aria-hidden="true" />
                )}

                {isLast ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-zinc-900 dark:text-white line-clamp-1 max-w-50 sm:max-w-xs"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.url}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium hover:underline underline-offset-2"
                  >
                    {index === 0 && showHomeIcon && <Home className="size-3.5 shrink-0" aria-hidden="true" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

function strToAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return window.location.origin + (url.startsWith('/') ? url : '/' + url);
}
