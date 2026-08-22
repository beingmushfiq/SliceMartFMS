/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-ui-importing-features',
      comment: 'ui/ primitives must never import from features/ (§10.2)',
      severity: 'error',
      from: { path: '^src/components/ui/' },
      to: { path: '^src/features/' },
    },
    {
      name: 'no-circular',
      comment: 'Circular dependencies are forbidden',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
};
