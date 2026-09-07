// ═══════════════════════════════════════════════════════════════════════════
// MOCK FIXTURE STORE                       ADR-004 · ADR-007 · ADR-008 · §9.1
// ───────────────────────────────────────────────────────────────────────────
// In-memory state for the MSW handlers. Not a database and not trying to be:
// it holds exactly enough shape that the *interesting* auth branches are
// reachable, because a branch that no fixture can reach is a branch the UI
// will meet for the first time in production.
//
// Three deliberate shapes:
//
//   · TWO tenants, and neither is privileged. The real `LoginAction` decides
//     `requires_tenant_selection` from `count() > 1`, so a single-tenant
//     fixture makes that entire screen unreachable. Nothing here treats one
//     tenant as "the" tenant — the second tenant is not a footnote, it is how
//     the tenant-selection and cross-tenant-404 paths get exercised.
//   · One user row PER (email, tenant) pair, mirroring the real `users` table
//     where `tenant_id` is a column. That is why the same address can resolve
//     to two accounts and why tenant selection exists at all.
//   · A refresh-token *chain*, not a token. ADR-007 rotation is only testable
//     if a superseded token is still present and marked, so `revoked_at` and
//     `replaced_by` are recorded rather than the row being deleted — reuse
//     detection reads exactly those two fields.
//
// Every test gets a clean world via `resetMockDb()`; nothing is shared across
// files, and no handler mutates a module constant.
// ═══════════════════════════════════════════════════════════════════════════

/** `config/auth.php` → `jwt.ttl`. Echoed as `expires_in` on every token grant. */
export const ACCESS_TOKEN_TTL_SECONDS = 900;

/** `config/auth.php` → `refresh_token.ttl_days`. */
export const REFRESH_TOKEN_TTL_DAYS = 14;

/* ───────────────────────────────────────────────────────────────────────────
   Entities
   ─────────────────────────────────────────────────────────────────────────── */

/** `EnsureTenantActive`: `active`/`trial` pass, `past_due` is read-only,
 *  `suspended`/`cancelled` are refused with 402 `TENANT_INACTIVE`. */
export type MockTenantStatus = 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled';

export interface MockTenant {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: MockTenantStatus;
  currency: string;
  timezone: string;
  locale: string;
  branding: { primary_color: string; logo_url: string | null };
}

export interface MockBranch {
  id: number;
  uuid: string;
  tenant_id: number;
  name: string;
  code: string;
}

/** §8.5 / `UpdatePreferencesAction` — `reduced_motion` is a stored preference
 *  in addition to the OS media query (ADR-031). */
export interface MockPreferences {
  locale: string;
  theme: 'light' | 'dark' | 'system';
  reduced_motion: boolean;
  density: 'compact' | 'comfortable';
  landing_page: string;
}

export interface MockUser {
  id: number;
  uuid: string;
  /** `null` for a platform operator that belongs to no single tenant. */
  tenant_id: number | null;
  name: string;
  email: string;
  phone: string | null;
  /** Plaintext on purpose: this is a fixture, and a hash would only mean the
   *  handler has to carry a hasher to compare two strings nobody protects. */
  password: string;
  status: 'active' | 'inactive';
  is_platform_admin: boolean;
  /** `AuthenticateJwt`: a mismatch against the token's copy is `TOKEN_REVOKED`.
   *  Incremented by `change-password` and `logout-all`. */
  token_version: number;
  /** ADR-008 `user_scopes`. Empty means "every branch in the tenant". */
  branch_scope_ids: number[];
  permissions: string[];
  preferences: MockPreferences;
}

/** One minted access token. The mock keeps a table because it has no signing
 *  key — the token is opaque and the server side of the pair is this row. */
export interface MockSession {
  access_token: string;
  user_id: number;
  tenant_id: number | null;
  active_branch_id: number | null;
  /** Snapshot at mint time, compared against the user's current value. */
  token_version: number;
  /** Epoch ms. A past value is `TOKEN_EXPIRED`, which §8.4 treats specially. */
  expires_at: number;
}

/** One link in a rotation chain (ADR-007). */
export interface MockRefreshToken {
  token: string;
  /** Shared by every successor. Reuse revokes the whole family, not one row. */
  family_id: string;
  user_id: number;
  tenant_id: number | null;
  /** Set when the token is rotated away or the family is revoked. */
  revoked_at: string | null;
  /** The successor issued in its place. Present iff this token was rotated. */
  replaced_by: string | null;
  expires_at: string;
}

export interface MockPasswordReset {
  email: string;
  token: string;
  /** Epoch ms. `config/auth.php` expires these after 60 minutes. */
  created_at: number;
}

export interface MockDb {
  tenants: MockTenant[];
  branches: MockBranch[];
  users: MockUser[];
  /** ADR-008 catalogue — the flat list `GET /auth/permissions` returns. */
  permissions: string[];
  sessions: Map<string, MockSession>;
  refreshTokens: Map<string, MockRefreshToken>;
  passwordResets: MockPasswordReset[];
  /** Monotonic counter behind every generated token and id. */
  counter: number;
}

/* ───────────────────────────────────────────────────────────────────────────
   Seed

   Rebuilt from scratch on every reset. Functions rather than constants so a
   handler that mutates `preferences` cannot leak that mutation into the next
   test through a shared object reference.
   ─────────────────────────────────────────────────────────────────────────── */

function seedTenants(): MockTenant[] {
  return [
    {
      id: 1,
      uuid: '5b4f0d5c-1f2a-4a9e-8c3d-11d0e6a7b201',
      name: 'SliceMart',
      slug: 'slice-mart',
      status: 'active',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      locale: 'en',
      branding: { primary_color: '#c2410c', logo_url: null },
    },
    {
      id: 2,
      uuid: '9a2c7e10-6b44-4f18-a0d7-33c1f5b9e402',
      name: 'HyperHeat Infrared',
      slug: 'hyperheat-infrared',
      status: 'active',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      locale: 'bn',
      branding: { primary_color: '#a16207', logo_url: null },
    },
    /* Suspended, so the 402 `TENANT_INACTIVE` branch of `tenant.active` has
       something to refuse. Without it that middleware is unreachable. */
    {
      id: 3,
      uuid: 'c7d81b93-2e55-4c07-bb62-77a4e2d1f603',
      name: 'FlameMaster Stoves',
      slug: 'flamemaster-stoves',
      status: 'suspended',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      locale: 'en',
      branding: { primary_color: '#0f766e', logo_url: null },
    },
  ];
}

function seedBranches(): MockBranch[] {
  return [
    {
      id: 11,
      uuid: 'd2f1a4b7-8c30-4e51-9a26-51b0c7d3e711',
      tenant_id: 1,
      name: 'Dhaka Central',
      code: 'DHK-C',
    },
    {
      id: 12,
      uuid: 'e4b2c6d9-9a41-4f62-8b37-62c1d8e4f712',
      tenant_id: 1,
      name: 'Chattogram Depot',
      code: 'CTG-D',
    },
    /* Another tenant's branch. ADR-004 says reaching it must look like
       absence, so this row is the fixture behind the cross-tenant 404 test. */
    {
      id: 21,
      uuid: 'f6c3d8e1-0b52-4073-9c48-73d2e9f5a721',
      tenant_id: 2,
      name: 'Gulshan Outlet',
      code: 'GUL-O',
    },
  ];
}

function seedPermissions(): string[] {
  /* A representative slice of `PermissionCatalogue::ALL_PERMISSIONS`, in the
     `module.resource.action` form ADR-008 fixes. Not the whole catalogue: the
     endpoint's contract is "a flat array of these strings", and 300 entries
     would make a failed assertion unreadable without proving anything more. */
  return [
    'platform.tenant.view',
    'core.user.view',
    'core.user.create',
    'core.user.update',
    'core.user.delete',
    'core.role.view',
    'core.role.manage',
    'org.branch.view',
    'org.branch.manage',
    'org.company.view',
    'catalog.product.view',
    'catalog.product.create',
    'catalog.product.update',
    'catalog.unit.view',
    'production.batch.view',
    'production.batch.create',
    'qc.inspection.view',
  ];
}

function defaultPreferences(): MockPreferences {
  return {
    locale: 'en',
    theme: 'dark',
    reduced_motion: false,
    density: 'comfortable',
    landing_page: '/dashboard',
  };
}

function seedUsers(): MockUser[] {
  return [
    {
      id: 1,
      uuid: '1c9e5a20-4d33-4b81-90f5-a1b2c3d4e001',
      tenant_id: null,
      name: 'Platform Operator',
      email: 'ops@slicemart.example',
      phone: null,
      password: 'platform-secret',
      status: 'active',
      is_platform_admin: true,
      token_version: 1,
      /* Empty on purpose: a platform admin is not scope-limited, and
         `SwitchBranchAction` skips the scope check for exactly this case. */
      branch_scope_ids: [],
      permissions: seedPermissions(),
      preferences: defaultPreferences(),
    },
    /* The same address in two tenants. This pair — and only this pair — is
       what makes `requires_tenant_selection` reachable. */
    {
      id: 2,
      uuid: '2d8f6b31-5e44-4c92-81a6-b2c3d4e5f002',
      tenant_id: 1,
      name: 'Farhana Rahman',
      email: 'manager@slicemart.example',
      phone: '+8801711000002',
      password: 'manager-secret',
      status: 'active',
      is_platform_admin: false,
      token_version: 1,
      branch_scope_ids: [11],
      permissions: ['org.branch.view', 'catalog.product.view', 'production.batch.view'],
      preferences: defaultPreferences(),
    },
    {
      id: 3,
      uuid: '3e9a7c42-6f55-4da3-92b7-c3d4e5f6a003',
      tenant_id: 2,
      name: 'Farhana Rahman',
      email: 'manager@slicemart.example',
      phone: '+8801711000003',
      password: 'manager-secret',
      status: 'active',
      is_platform_admin: false,
      token_version: 1,
      branch_scope_ids: [21],
      permissions: ['org.branch.view', 'catalog.product.view'],
      preferences: { ...defaultPreferences(), locale: 'bn' },
    },
    /* Disabled by an admin. `LoginAction` filters on `status === 'active'`, so
       this account must fail login the same way a non-existent one does — §8.1
       forbids telling the two apart. */
    {
      id: 4,
      uuid: '4f0b8d53-7a66-4eb4-a3c8-d4e5f6a7b004',
      tenant_id: 1,
      name: 'Imran Chowdhury',
      email: 'retired@slicemart.example',
      phone: null,
      password: 'retired-secret',
      status: 'inactive',
      is_platform_admin: false,
      token_version: 1,
      branch_scope_ids: [12],
      permissions: ['catalog.product.view'],
      preferences: defaultPreferences(),
    },
    /* Sole member of the suspended tenant, so login can succeed while the
       tenant middleware still refuses every tenant route with 402. */
    {
      id: 5,
      uuid: '5a1c9e64-8b77-4fc5-b4d9-e5f6a7b8c005',
      tenant_id: 3,
      name: 'Nusrat Jahan',
      email: 'owner@riverside.example',
      phone: null,
      password: 'riverside-secret',
      status: 'active',
      is_platform_admin: false,
      token_version: 1,
      branch_scope_ids: [],
      permissions: ['org.company.view'],
      preferences: defaultPreferences(),
    },
  ];
}

function createDb(): MockDb {
  return {
    tenants: seedTenants(),
    branches: seedBranches(),
    users: seedUsers(),
    permissions: seedPermissions(),
    sessions: new Map<string, MockSession>(),
    refreshTokens: new Map<string, MockRefreshToken>(),
    passwordResets: [],
    counter: 0,
  };
}

/**
 * The live store.
 *
 * Mutated in place by `resetMockDb` rather than reassigned, so a handler
 * module that captured this binding at import time still sees the reset world.
 */
export const db: MockDb = createDb();

export function resetMockDb(): void {
  const fresh = createDb();
  db.tenants = fresh.tenants;
  db.branches = fresh.branches;
  db.users = fresh.users;
  db.permissions = fresh.permissions;
  db.sessions = fresh.sessions;
  db.refreshTokens = fresh.refreshTokens;
  db.passwordResets = fresh.passwordResets;
  db.counter = fresh.counter;
}

/* ───────────────────────────────────────────────────────────────────────────
   Lookups
   ─────────────────────────────────────────────────────────────────────────── */

/** Every account for an address, in seed order. `LoginAction` counts these. */
export function findAccountsByEmail(email: string): MockUser[] {
  const needle = email.trim().toLowerCase();
  return db.users.filter((user) => user.email.toLowerCase() === needle);
}

export function findUserById(id: number): MockUser | undefined {
  return db.users.find((user) => user.id === id);
}

export function findTenantById(id: number | null): MockTenant | undefined {
  if (id === null) return undefined;
  return db.tenants.find((tenant) => tenant.id === id);
}

export function findBranchById(id: number): MockBranch | undefined {
  return db.branches.find((branch) => branch.id === id);
}

export function branchesForTenant(tenantId: number | null): MockBranch[] {
  if (tenantId === null) return [];
  return db.branches.filter((branch) => branch.tenant_id === tenantId);
}

/* ───────────────────────────────────────────────────────────────────────────
   Token minting
   ─────────────────────────────────────────────────────────────────────────── */

function nextId(): string {
  db.counter += 1;
  return `${db.counter.toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** A uuid-shaped family id, matching the real `family_id` column. */
function newFamilyId(): string {
  const hex = (length: number): string =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-8${hex(3)}-${hex(12)}`;
}

/**
 * Mint an access token.
 *
 * Opaque, not a signed JWT: there is no key here, and the client treats the
 * value as a bearer string it never inspects. `token_version` is snapshotted
 * so `logout-all` and `change-password` can invalidate this token by bumping
 * the user's copy — the same mechanism `AuthenticateJwt` relies on.
 */
export function issueSession(
  user: MockUser,
  tenantId: number | null,
  activeBranchId: number | null,
  ttlSeconds = ACCESS_TOKEN_TTL_SECONDS
): MockSession {
  const session: MockSession = {
    access_token: `mock_at_${nextId()}`,
    user_id: user.id,
    tenant_id: tenantId,
    active_branch_id: activeBranchId,
    token_version: user.token_version,
    expires_at: Date.now() + ttlSeconds * 1000,
  };
  db.sessions.set(session.access_token, session);
  return session;
}

export function findSession(token: string): MockSession | undefined {
  return db.sessions.get(token);
}

/** Force a minted token past its `exp`, so a test can reach §8.4 without
 *  waiting 15 minutes or faking timers across the whole transport. */
export function expireSession(token: string): void {
  const session = db.sessions.get(token);
  if (session) session.expires_at = Date.now() - 1_000;
}

/**
 * Mint a refresh token, optionally into an existing family.
 *
 * The `rt_` prefix mirrors `RefreshTokenService::generateToken()`. Passing
 * `familyId` is what makes a rotation a *successor* rather than a new login.
 */
export function issueRefreshToken(
  user: MockUser,
  tenantId: number | null,
  familyId?: string
): MockRefreshToken {
  const record: MockRefreshToken = {
    token: `rt_${nextId()}${nextId()}`,
    family_id: familyId ?? newFamilyId(),
    user_id: user.id,
    tenant_id: tenantId,
    revoked_at: null,
    replaced_by: null,
    expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000).toISOString(),
  };
  db.refreshTokens.set(record.token, record);
  return record;
}

export function findRefreshToken(token: string): MockRefreshToken | undefined {
  return db.refreshTokens.get(token);
}

/** Revoke every link in a chain. The reuse response, not a cleanup step. */
export function revokeRefreshFamily(familyId: string): void {
  const now = new Date().toISOString();
  for (const record of db.refreshTokens.values()) {
    if (record.family_id === familyId && record.revoked_at === null) {
      record.revoked_at = now;
    }
  }
}

/** `logout-all` and a successful password change. Kills sessions too, because
 *  revoking refresh tokens alone would leave a 15-minute window of access. */
export function revokeAllForUser(userId: number): void {
  const now = new Date().toISOString();
  for (const record of db.refreshTokens.values()) {
    if (record.user_id === userId && record.revoked_at === null) {
      record.revoked_at = now;
    }
  }
  for (const [token, session] of db.sessions) {
    if (session.user_id === userId) db.sessions.delete(token);
  }
}

/* ───────────────────────────────────────────────────────────────────────────
   Rotation

   The order of these checks is `RefreshTokenService::rotateRefreshToken()`
   verbatim, and the order is the security property: reuse is detected BEFORE
   expiry, so replaying an old token that has also aged out still revokes the
   family instead of being dismissed as merely stale.
   ─────────────────────────────────────────────────────────────────────────── */

export type RotationResult =
  | { outcome: 'rotated'; next: MockRefreshToken; user: MockUser }
  | { outcome: 'invalid' }
  | { outcome: 'reused' }
  | { outcome: 'expired' }
  | { outcome: 'user_invalid' };

export function rotateRefreshToken(token: string): RotationResult {
  const record = db.refreshTokens.get(token);
  if (!record) return { outcome: 'invalid' };

  if (record.revoked_at !== null) {
    revokeRefreshFamily(record.family_id);
    return { outcome: 'reused' };
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    revokeRefreshFamily(record.family_id);
    return { outcome: 'expired' };
  }

  const user = findUserById(record.user_id);
  if (!user || user.status !== 'active') {
    revokeRefreshFamily(record.family_id);
    return { outcome: 'user_invalid' };
  }

  const next = issueRefreshToken(user, record.tenant_id, record.family_id);
  record.revoked_at = new Date().toISOString();
  record.replaced_by = next.token;

  return { outcome: 'rotated', next, user };
}

/* ───────────────────────────────────────────────────────────────────────────
   Derived values
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * §8.5 — a hash of the user's effective permissions.
 *
 * A cheap deterministic digest, not a cryptographic one: the contract is only
 * that the value *changes when the permissions change*, which is what makes
 * the client refetch `/auth/me` instead of forcing a logout.
 */
export function permVersionFor(user: MockUser): string {
  const source = [...user.permissions].sort().join('|');
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `pv_${hash.toString(16).padStart(8, '0')}`;
}

/** ADR-008 `user_scopes`, in the `{ type, id }` form `/auth/me` returns. */
export function scopesFor(user: MockUser): Array<{ type: string; id: number }> {
  return user.branch_scope_ids.map((id) => ({ type: 'branch', id }));
}

export function createPasswordReset(email: string): MockPasswordReset {
  const reset: MockPasswordReset = {
    email: email.trim().toLowerCase(),
    token: `prt_${nextId()}`,
    created_at: Date.now(),
  };
  db.passwordResets.push(reset);
  return reset;
}

export function findPasswordReset(email: string): MockPasswordReset | undefined {
  const needle = email.trim().toLowerCase();
  /* Last one wins: requesting a second link must invalidate nothing but must
     not let the first link win a race against the second. */
  return [...db.passwordResets].reverse().find((reset) => reset.email === needle);
}

export function consumePasswordReset(reset: MockPasswordReset): void {
  db.passwordResets = db.passwordResets.filter((entry) => entry !== reset);
}
