import React, { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Package, Plus, ShoppingBag } from 'lucide-react';
import { api } from '../../lib/api/client';
import { useStorefrontCartStore } from '../../lib/storefront/storefrontCartStore';
import type { StorefrontConfig, StorefrontProduct, StorefrontProductVariant } from '../../types/api/storefront';

interface OutletContextType {
  config: StorefrontConfig;
  subdomain: string;
}

export const StorefrontProductDetailPage: React.FC = () => {
  const { idOrSku } = useParams<{ idOrSku: string }>();
  const { config, subdomain } = useOutletContext<OutletContextType>();
  const [product, setProduct] = useState<StorefrontProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<StorefrontProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const { addItem, openDrawer } = useStorefrontCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!idOrSku) return;
      setLoading(true);
      try {
        const response = await api.get<{ data: StorefrontProduct }>(
          `/storefront/products/${idOrSku}`,
          {
            headers: { 'X-Storefront-Subdomain': subdomain },
          }
        );
        const prod = response.data.data ?? (response.data as any);
        setProduct(prod);
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0]);
        }
      } catch (err) {
        console.error('Failed to load product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [idOrSku, subdomain]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
        <h2 className="text-base font-bold text-zinc-200">Product Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1">The requested product could not be located.</p>
        <Link
          to={`/store/${subdomain}`}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const currency = config.currency ?? 'BDT';
  const price = selectedVariant
    ? parseFloat(selectedVariant.price).toFixed(2)
    : parseFloat(product.default_sale_price || '0').toFixed(2);

  const handleAddToCart = async () => {
    await addItem(product.id, quantity, selectedVariant?.id);
    openDrawer();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        to={`/store/${subdomain}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Catalog</span>
      </Link>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 items-start">
        {/* Left: Product Visual Card */}
        <div className="aspect-square rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
          <Package className="h-28 w-28 text-emerald-500/40 mb-4" />
          <div className="text-center">
            <span className="font-mono text-xs text-zinc-500">{product.sku}</span>
            <div className="text-sm font-bold text-zinc-300 mt-1">{product.name}</div>
          </div>

          <div className="absolute top-4 right-4 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            In Stock
          </div>
        </div>

        {/* Right: Details & Buying Flow */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
              {product.category && (
                <span className="rounded-md bg-zinc-850 px-2 py-0.5 text-zinc-300">
                  {product.category.name}
                </span>
              )}
              {product.brand && <span>· {product.brand.name}</span>}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {product.name}
            </h1>

            <div className="text-2xl font-extrabold text-emerald-400">
              {currency} {price}
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {product.description ||
              'Manufactured under strict batch control and verified quality assurance.'}
          </p>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Select Option / Size
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500'
                        : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="rounded-lg p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-zinc-100">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="rounded-lg p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer active:scale-98"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add to Cart ({currency} {(parseFloat(price) * quantity).toFixed(2)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
