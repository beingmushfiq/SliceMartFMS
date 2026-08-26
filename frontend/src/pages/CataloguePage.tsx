import { useQuery } from '@tanstack/react-query';
import { Boxes, ChevronRight, Package, Search, Tags } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api/client';
import { QueryBoundary } from '../components/patterns/QueryBoundary';
import { Input } from '../components/ui/FormElements';
import type { Brand, Category, Product } from '../types/api/catalog';

type Section = 'products' | 'categories' | 'brands';
type Row = Product | Category | Brand;

const sections: Array<{ id: Section; label: string; icon: typeof Package }> = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'brands', label: 'Brands', icon: Boxes },
];

function endpoint(section: Section): string {
  return section === 'products' ? '/products' : `/${section}`;
}

function useCatalogue(section: Section, search: string) {
  return useQuery({
    queryKey: ['catalogue', section, search],
    queryFn: ({ signal }) =>
      api.get<Row[]>(endpoint(section), {
        signal,
        ...(search.length >= 2 ? { params: { q: search } } : {}),
      }),
  });
}

function rowLabel(section: Section, row: Row): string {
  if (section === 'products') return `${(row as Product).name} · ${(row as Product).sku}`;
  const item = row as Category | Brand;
  return `${item.name} · ${item.code}`;
}

function rowMeta(section: Section, row: Row): string {
  if (section === 'products') return (row as Product).status;
  return (row as Category | Brand).is_active ? 'Active' : 'Inactive';
}

export default function CataloguePage() {
  const [section, setSection] = useState<Section>('products');
  const [search, setSearch] = useState('');
  const query = useCatalogue(section, search.trim());
  const rows = query.data?.data ?? [];

  return (
    <main className="bg-base text-default min-h-dvh">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-muted text-xs font-semibold tracking-[0.12em] uppercase">Master data</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Catalogue workspace</h1>
            <p className="text-muted mt-2 max-w-xl text-sm">Keep the records that production, purchasing, and sales depend on in one quiet place.</p>
          </div>
        </header>

        <nav className="border-default flex gap-1 border-b" aria-label="Catalogue sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${section === id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'}`}
              aria-current={section === id ? 'page' : undefined}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        <section className="flex flex-col gap-5" aria-labelledby="records-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="records-heading" className="text-lg font-semibold">{sections.find((item) => item.id === section)?.label}</h2>
            <Input aria-label="Search catalogue" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or code" leftElement={<Search size={16} />} className="max-w-sm" />
          </div>
          <QueryBoundary status={query.status} error={query.error} data={rows} isFetching={query.isFetching} hasActiveFilters={search.trim().length >= 2}>
            <div className="border-default overflow-hidden rounded-(--card-radius) border bg-surface">
              {rows.length === 0 ? <p className="text-muted px-6 py-12 text-center text-sm">No records yet.</p> : <ul className="divide-default divide-y">{rows.map((row) => <li key={row.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{rowLabel(section, row)}</p><p className="text-muted mt-1 text-xs">{rowMeta(section, row)}</p></div><ChevronRight className="text-subtle" size={17} aria-hidden="true" /></li>)}</ul>}
            </div>
          </QueryBoundary>
        </section>
      </div>
    </main>
  );
}
