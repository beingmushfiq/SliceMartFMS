import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export interface AuditCheckItem {
  id: string;
  title: string;
  passed: boolean;
  message: string;
  weight: number;
}

export interface DiscoverabilityChecklistProps {
  title: string;
  description: string;
  slug?: string | null | undefined;
  canonical?: string | null | undefined;
  hasImage?: boolean;
  imageAlt?: string | null | undefined;
  hasSchema?: boolean;
  extraChecks?: AuditCheckItem[];
}

export const DiscoverabilityChecklist: React.FC<DiscoverabilityChecklistProps> = ({
  title,
  description,
  slug,
  canonical,
  hasImage = true,
  imageAlt,
  hasSchema = true,
  extraChecks = [],
}) => {
  const checks: AuditCheckItem[] = [
    {
      id: 'title_length',
      title: 'SEO Title (50-60 characters)',
      passed: title.length >= 30 && title.length <= 65,
      message:
        title.length === 0
          ? 'Title is missing'
          : title.length < 30
          ? `Current length is ${title.length} chars (aim for at least 30)`
          : title.length > 65
          ? `Current length is ${title.length} chars (may be truncated on SERP)`
          : `Optimal length (${title.length} chars)`,
      weight: 25,
    },
    {
      id: 'desc_length',
      title: 'Meta Description (120-160 characters)',
      passed: description.length >= 70 && description.length <= 165,
      message:
        description.length === 0
          ? 'Meta description is missing'
          : description.length < 70
          ? `Current length is ${description.length} chars (recommend at least 70)`
          : description.length > 165
          ? `Current length is ${description.length} chars (may be truncated)`
          : `Optimal length (${description.length} chars)`,
      weight: 25,
    },
    {
      id: 'slug_quality',
      title: 'Search-Friendly URL Slug',
      passed: Boolean(slug && /^[a-z0-9-]+$/.test(slug)),
      message:
        !slug
          ? 'Slug is not explicitly customized (using SKU fallback)'
          : !/^[a-z0-9-]+$/.test(slug)
          ? 'Slug contains uppercase or special characters'
          : 'Clean lowercase hyphenated URL path',
      weight: 15,
    },
    {
      id: 'image_alt',
      title: 'Image Availability & Alt Text',
      passed: Boolean(hasImage && (!imageAlt || imageAlt.trim().length > 3)),
      message: !hasImage
        ? 'No featured photo attached'
        : imageAlt
        ? 'Descriptive alt text configured for accessibility'
        : 'Image present (auto-generated alt text from product title)',
      weight: 20,
    },
    {
      id: 'schema_markup',
      title: 'Schema.org JSON-LD Structured Data',
      passed: Boolean(hasSchema),
      message: hasSchema ? 'Valid JSON-LD schema generated' : 'No structured data attached',
      weight: 15,
    },
    ...(canonical
      ? [
          {
            id: 'canonical_override',
            title: 'Explicit Canonical URL Tag',
            passed: true,
            message: `Canonical set to ${canonical}`,
            weight: 5,
          },
        ]
      : []),
    ...extraChecks,
  ];

  const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
  const earnedWeight = checks.reduce((acc, c) => (c.passed ? acc + c.weight : acc), 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  const getScoreBadge = () => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    if (score >= 70) return { label: 'Good', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' };
    if (score >= 50) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    return { label: 'Needs Optimization', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  };

  const badge = getScoreBadge();

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Platform Discoverability Checklist
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-extrabold text-zinc-900 dark:text-white">{score}/100</span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-teal-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Checks list */}
      <div className="space-y-2.5 pt-1">
        {checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2.5 text-xs">
            {check.passed ? (
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                {check.title}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {check.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
