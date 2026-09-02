import React, { useEffect } from 'react';

export interface JsonLdSchemaProps {
  id?: string;
  schema: Record<string, unknown> | Array<Record<string, unknown>>;
}

export const JsonLdSchema: React.FC<JsonLdSchemaProps> = ({ id = 'custom-jsonld-schema', schema }) => {
  useEffect(() => {
    if (!schema) return;

    let scriptElem = document.getElementById(id) as HTMLScriptElement | null;
    if (!scriptElem) {
      scriptElem = document.createElement('script');
      scriptElem.id = id;
      scriptElem.type = 'application/ld+json';
      document.head.appendChild(scriptElem);
    }
    scriptElem.textContent = JSON.stringify(schema, null, 2);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [id, schema]);

  return null;
};
