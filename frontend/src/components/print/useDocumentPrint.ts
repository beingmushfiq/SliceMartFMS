import { useState, useCallback } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

let printRootElement: HTMLElement | null = null;
let printReactRoot: Root | null = null;

function getOrCreatePrintRoot(): HTMLElement {
  if (!printRootElement) {
    let el = document.getElementById('print-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'print-root';
      document.body.appendChild(el);
    }
    printRootElement = el;
  }
  return printRootElement;
}

export interface PrintOptions {
  documentTitle?: string;
  pageClass?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function useDocumentPrint() {
  const [isPrinting, setIsPrinting] = useState(false);

  const printDocument = useCallback(
    (component: React.ReactElement, options: PrintOptions = {}) => {
      setIsPrinting(true);
      const originalTitle = document.title;
      if (options.documentTitle) {
        document.title = options.documentTitle;
      }

      const container = getOrCreatePrintRoot();
      container.className = `print-doc ${options.pageClass || 'print-page-a4'}`;

      if (options.onBeforePrint) {
        options.onBeforePrint();
      }

      if (!printReactRoot) {
        printReactRoot = createRoot(container);
      }

      // Render the component into the isolated print-root
      printReactRoot.render(component);

      // Give browser time to lay out CSS and SVG barcodes
      setTimeout(() => {
        document.body.classList.add('printing-active');

        const cleanup = () => {
          document.body.classList.remove('printing-active');
          document.title = originalTitle;
          setIsPrinting(false);
          if (options.onAfterPrint) {
            options.onAfterPrint();
          }
          window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);

        try {
          window.print();
        } catch (e) {
          console.error('Browser print execution failed:', e);
          cleanup();
        }

        // Fallback cleanup in case afterprint does not fire (some mobile browsers)
        setTimeout(() => {
          if (document.body.classList.contains('printing-active')) {
            cleanup();
          }
        }, 3000);
      }, 250);
    },
    []
  );

  return { printDocument, isPrinting };
}
