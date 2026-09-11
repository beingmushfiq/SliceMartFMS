// Digital Marketing and Conversion Tracking for Storefront (Meta Pixel + GA4)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initStorefrontTracking(metaPixelId?: string, googleAnalyticsId?: string) {
  if (typeof window === 'undefined') return;

  // Initialize Meta Pixel
  if (metaPixelId && !window.fbq) {
    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    const fbq = window.fbq as unknown as ((...args: unknown[]) => void) | undefined;
    if (typeof fbq === 'function') {
      fbq('init', metaPixelId);
      fbq('track', 'PageView');
    }
  }

  // Initialize Google Analytics 4
  if (googleAnalyticsId && !window.gtag) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', googleAnalyticsId);
  }
}

export function trackStorefrontPageView(path?: string) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
  if (window.gtag) {
    window.gtag('event', 'page_view', { page_path: path || window.location.pathname });
  }
}

export function trackStorefrontViewContent(item: {
  id: string | number;
  name: string;
  price: number;
  currency: string;
  category?: string | null | undefined;
}) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [String(item.id)],
      content_name: item.name,
      content_category: item.category,
      value: item.price,
      currency: item.currency,
      content_type: 'product',
    });
  }
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      currency: item.currency,
      value: item.price,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          item_category: item.category,
          price: item.price,
        },
      ],
    });
  }
}

export function trackStorefrontAddToCart(item: {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  currency: string;
}) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [String(item.id)],
      content_name: item.name,
      value: item.price * item.quantity,
      currency: item.currency,
      content_type: 'product',
    });
  }
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [
        {
          item_id: String(item.id),
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
  }
}

export function trackStorefrontInitiateCheckout(total: number, currency: string, numItems: number) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: total,
      currency: currency,
      num_items: numItems,
    });
  }
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: total,
    });
  }
}

export function trackStorefrontPurchase(order: {
  id: string | number;
  total: number;
  currency: string;
}) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: order.total,
      currency: order.currency,
      content_type: 'product',
      order_id: String(order.id),
    });
  }
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: String(order.id),
      value: order.total,
      currency: order.currency,
    });
  }
}
