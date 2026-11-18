# External Login Providers (OpenID Connect) Implementation Plan

**Goal:** Let users sign in to Arena through external identity providers (Google, Microsoft, Keycloak, Okta,
institutional SSO, ...) alongside the existing email/password login, with the providers managed by system admins in
the Arena UI.

**Architecture:** An external provider is a new way to prove who the user is; everything after that is reused. A
provider *adapter* turns the provider's callback into a normalized identity (`issuer`, `subject`, `email`,
`emailVerified`, `name`); the callback route resolves the Arena user from it and then goes through the same code path
as the password login (`createUserAuthTokens` + refresh token cookie). The browser lands on `/app/home` with only the
refresh cookie set: the webapp's existing "401 → `POST /auth/token/refresh` → retry" interceptor
(`webapp/app/appErrorsMiddleware.js`) gets the access token, exactly as after a page reload.

Providers are stored in the database and edited by system admins in a new "Login providers" page; providers can also
be defined with environment variables (read-only in the UI), for deployments managed as code.

**Tech stack:** [`openid-client`](https://github.com/panva/openid-client) v6 (certified OIDC relying party: discovery,
PKCE, state, nonce and ID token validation), Express, pg-promise, React, MUI.

## Scope

In scope:

- Any number of OpenID Connect providers, with presets for Google and Microsoft (incl. multi-tenant) and a generic
  OIDC type for any other provider.
- Provider adapter interface, so that non-OIDC providers can be added later without touching the login flow.
- Provider configuration: system admin UI (stored in the DB, client secrets encrypted) plus optional environment
  variable configuration.
- Provider icons on the login buttons (built-in brand icons for presets, uploaded icon or generic icon otherwise).
- Authorization code flow with PKCE, `response_mode=query`.
- Login allowed only for users that already exist in Arena or have a pending invitation (see "Access rules").
- Per-provider settings: allowed email domains, trust provider emails, require Arena 2FA, show on login page.
- Linking / unlinking external identities from the user's profile page.

Out of scope (follow-ups):

- Adapters for OAuth2-only providers (Facebook, GitHub) and Apple (OIDC, but needs a signed JWT client secret and a
  form POST callback).
- Domain-based routing (user types the email first, Arena picks the provider configured for that domain).
- Arena Mobile login (native flow with PKCE and an app redirect URI).
- Single logout at the provider (RP-initiated logout).
- Self sign-up through external providers, SCIM provisioning, mapping provider groups/claims to Arena roles.
- SAML.

## Current state (for reference)

- `@openforis/arena-server` (`src/server/middleware/authentication.ts`): Passport with a `local` strategy (email +
  password) and a `jwt` strategy (Bearer access token on every API request); `pathsAllowedWithoutAuthentication` lists
  the public routes.
- `@openforis/arena-server` (`src/api/auth/login.ts`): `POST /auth/login` → local strategy → optional 2FA check →
  `authenticationSuccessful` (creates access + refresh tokens, sets the `refreshToken` cookie, returns
  `{ user, survey, authToken }`).
- `@openforis/arena-server` (`src/api/auth/authTokenRefresh.ts`): `POST /auth/token/refresh` rotates the refresh
  token cookie and returns a new access token.
- arena-server calls Arena-specific logic through services registered by Arena in the `ServiceRegistry`
  (`server/system/arenaServerServices.ts`).
- Arena: user statuses `INVITED`, `FORCE_CHANGE_PASSWORD`, `ACCEPTED` (`core/user/user.ts`); invited users accept by
  setting name and password on the reset-password page (`server/modules/user/service/userService.ts` `resetPassword`).
- Arena: AES-256-GCM encryption of small secrets at rest in `server/utils/crypto/secretBox.ts` (currently tied to
  `AI_USER_KEY_ENCRYPTION_SECRET`).
- Arena webapp: login form `webapp/views/Guest/views/Login/Login.js`; system admin pages under
  `webapp/views/App/views/SystemAdmin/` (`systemAdminModules` in `webapp/app/appModules.js`).

## Design decisions

### Provider model

```ts
type AuthProviderType = 'oidc' | 'google' | 'microsoft' // presets of the OIDC adapter; more adapter types later

interface AuthProvider {
  id: string // stable slug, e.g. "google", "fao": immutable once created (used in URLs and identity links)
  type: AuthProviderType
  label: string // button text: "Sign in with <label>"
  enabled: boolean
  showOnLoginPage: boolean // false: reachable only with /guest/login?provider=<id>
  order: number
  issuer?: string // oidc only; preset types know their issuer
  tenant?: string // microsoft only: tenant id, or "common" / "organizations" for multi-tenant
  clientId: string
  clientSecret: string // write-only in the API and UI; encrypted at rest
  scopes: string[] // default ["openid", "email", "profile"]
  allowedEmailDomains: string[] // empty = any domain
  trustEmail: boolean // treat the email as verified even if the provider omits email_verified (default false)
  requireArena2FA: boolean // default true: users with Arena 2FA enabled must still enter their code
  icon: { kind: 'builtin' | 'uploaded' | 'generic'; ref?: string }
  source: 'db' | 'env' // env providers are read-only in the UI
}
```

### Provider adapters

```ts
interface ExternalIdentity {
  issuer: string
  subject: string
  email?: string
  emailVerified: boolean
  name?: string
}

interface AuthProviderAdapter {
  buildAuthorizationUrl(params: { provider: AuthProvider; redirectUri: string; flow: FlowParams }): Promise<URL>
  handleCallback(params: { provider: AuthProvider; redirectUri: string; flow: FlowParams; currentUrl: URL }): Promise<ExternalIdentity>
  testConnection(provider: AuthProvider): Promise<void> // used by the admin UI "Test" button
}
```

Only the OIDC adapter is implemented now; `google` and `microsoft` are presets of it (fixed issuer, default icon and
label). Microsoft multi-tenant (`tenant` = `common` / `organizations`): the ID token issuer is
`https://login.microsoftonline.com/<user tenant id>/v2.0`, so the adapter validates it against that template instead
of the discovery document's issuer, and stores the actual `iss` in the identity link.

### Configuration storage

New table in the `public` schema (arena-server migration):

```sql
CREATE TABLE auth_provider (
  id            varchar(64) PRIMARY KEY,    -- slug, immutable
  type          varchar(32) NOT NULL,
  props         jsonb       NOT NULL,       -- label, issuer, tenant, clientId, scopes, flags, icon, order, ...
  client_secret text,                       -- secretBox envelope ("v1:..."), never returned by the API
  icon_file     bytea,                      -- uploaded icon (PNG or sanitized SVG, max 100 KB)
  date_created  timestamptz NOT NULL DEFAULT now(),
  date_modified timestamptz NOT NULL DEFAULT now()
);
```

- Client secrets are encrypted with `secretBox`, generalized to take the key variable name, using a new
  `AUTH_PROVIDER_SECRET_ENCRYPTION_KEY` (64 hex chars). The UI shows an explanatory error and disables the page if
  the key is not set.
- Environment providers: `AUTH_PROVIDERS_CONFIG` = path to a JSON file (or inline JSON) with an array of providers
  (same shape as above, without secrets); each secret in `AUTH_PROVIDER_<ID>_CLIENT_SECRET`. A DB provider with the
  same id as an env provider is refused.
- arena-server reads providers through a new `ServerServiceType.authProvider` service implemented by Arena (Arena
  owns the encryption key and the env parsing), with an in-process cache. The cache is invalidated on every change
  made in this process and expires after 60 s, so all cluster instances pick up admin changes within a minute.
- OIDC discovery metadata is fetched lazily on first use and cached per provider (until its config changes); a
  discovery failure disables only that provider and is logged.

### Admin UI: "Login providers"

New system admin page (`systemAdminModules.authProviders`, `webapp/views/App/views/SystemAdmin/AuthProviders/`):

- **List:** icon, label, type, enabled, shown on login page, number of linked users, source (DB / environment);
  drag to reorder.
- **Add:** choose a preset (Google, Microsoft, Generic OpenID Connect); the form then shows only the relevant fields.
- **Form fields:** id (editable only on creation; suggested from the label), label, issuer (generic) or tenant
  (Microsoft), client id, client secret (write-only: "set" / "change"), scopes, allowed email domains, trust provider
  emails, require Arena 2FA, show on login page, enabled, icon (built-in / upload / generic).
- **Redirect URI:** shown read-only with a copy button
  (`<public base URL>/auth/oidc/<id>/callback`), with short instructions for registering it at the provider.
- **Test:** runs the adapter's `testConnection` (discovery + JWKS fetch) and shows the result. An optional
  "Test sign-in" opens the real flow in a new tab in a test mode that reports the claims received without logging in
  or linking anything.
- **Disable / delete:** disabling hides the button and refuses callbacks but keeps identity links. Deleting asks for
  confirmation and lists the users linked *only* to this provider and without a password (they will not be able to log
  in until they set a password via "forgot password"); identity links are deleted with the provider.
- Environment providers are shown read-only with a "Managed by environment variables" note.
- API (system admin only), in a new `server/modules/authProvider/` module (`api/`, `service/`, `repository/`):
  `GET/POST /api/admin/auth-providers`, `GET/PUT/DELETE /api/admin/auth-providers/:id`,
  `POST /api/admin/auth-providers/:id/test`, `PUT /api/admin/auth-providers/order`,
  `PUT /api/admin/auth-providers/:id/icon`.
- Every change is written to the server log with the admin user and the changed fields (never the secret).

### Login page and icons

- `GET /auth/providers` (public): `[{ id, label, iconUrl }]` for enabled providers with `showOnLoginPage`, in the
  configured order. `GET /auth/providers/:id/icon` serves uploaded icons.
- One button per provider below the email/password form ("or" divider), full width, outlined, theme colors
  (no hard-coded colors), with the provider icon on the left and "Sign in with <label>" (i18n) as text.
- **Built-in icons:** SVG brand logos for the presets (Google "G", Microsoft four squares) in
  `web-resources/img/auth-providers/`. Logos keep their official brand colors (they are brand assets, not UI colors),
  while the button itself uses the theme: this matches Google's and Microsoft's sign-in branding guidelines (neutral
  button + official logo + "Sign in with Google" / "Sign in with Microsoft"). The logo must not be recolored or
  altered.
- **Custom providers:** uploaded icon (PNG, or SVG sanitized server-side with DOMPurify, max 100 KB, shown at
  20×20 px), or a generic "login" icon from the MUI icon set when none is uploaded.
- `/guest/login?provider=<id>` starts the flow directly for providers not shown on the login page.
- `oidcError` query param → translated error message.

### Flow

1. Clicking a provider button navigates (full page) to `GET /auth/oidc/:providerId`.
2. arena-server generates `state`, `nonce` and a PKCE `code_verifier`, stores them in a short-lived (10 min), signed,
   `httpOnly`, `SameSite=Lax` cookie scoped to `/auth/oidc/` (Lax is required: the callback is a cross-site top-level
   GET navigation), and redirects to the provider's authorization endpoint (built by the adapter).
3. The provider redirects back to `GET /auth/oidc/:providerId/callback?code=...&state=...`.
4. The adapter validates `state`, exchanges the code (with the PKCE verifier), validates the ID token (signature,
   issuer, audience, expiry, nonce) and returns the `ExternalIdentity`; the flow cookie is cleared.
5. The user is resolved (see "Access rules") and, if required, Arena 2FA is checked (see "2FA").
6. Same token creation as the password login (refactor `authenticationSuccessful` so that "create tokens + set refresh
   cookie" is separate from "send JSON"), then redirect to `/app/home/`.
7. On failure: redirect to `/guest/login?oidcError=<errorKey>`; details are logged server-side, never put in the URL.

The access token is never put in a URL.

To check during implementation: the refresh cookie is `SameSite=Strict` in production. It is set on the callback
response (setting is allowed) and is only sent later by same-site `fetch` calls from the loaded app, so it should
work; verify in Chrome, Firefox and Safari, including the case where the provider is on another site.

### Identity storage

New table in the `public` schema (arena-server migration):

```sql
CREATE TABLE user_external_identity (
  id             bigserial PRIMARY KEY,
  user_uuid      uuid        NOT NULL REFERENCES "user" (uuid) ON DELETE CASCADE,
  provider_id    varchar(64) NOT NULL REFERENCES auth_provider (id) ON DELETE CASCADE, -- see note on env providers
  issuer         text        NOT NULL,  -- actual iss claim (per tenant for Microsoft multi-tenant)
  subject        text        NOT NULL,  -- sub claim: stable, never reassigned by the provider
  email          text,                  -- informational, as last seen
  date_created   timestamptz NOT NULL DEFAULT now(),
  date_last_used timestamptz,
  UNIQUE (issuer, subject),
  UNIQUE (user_uuid, provider_id)
);
```

Env providers are not in `auth_provider`: either insert a placeholder row for them at startup (`type`, `props.source =
'env'`, no secret) or drop the foreign key; decide in Task 2 (placeholder row preferred, keeps the cascade).

Users are matched by `(issuer, subject)`, never by email alone after the first link.

### Access rules

On callback, with the normalized identity:

1. `(issuer, subject)` already linked → that user. Done.
2. Not linked: require `email`, and `emailVerified` (or the provider's `trustEmail` flag); the email domain must be in
   `allowedEmailDomains` when set. Otherwise reject (`oidcEmailNotVerified` / `oidcEmailDomainNotAllowed`).
3. Look up the Arena user by email: case-insensitive; for `gmail.com` / `googlemail.com` addresses, compare the
   normalized form (lowercase, dots and `+suffix` removed from the local part, `googlemail.com` → `gmail.com`), since
   Gmail delivers all those variants to the same mailbox. If more than one Arena user matches the normalized form,
   reject (`oidcAmbiguousEmail`) and let the user link from their profile instead.
   - `ACCEPTED` or `FORCE_CHANGE_PASSWORD` → link the identity and log in.
   - `INVITED` → link, set status to `ACCEPTED`, set the name from the `name` claim if the user has none, log in.
   - not found → reject with `oidcUserNotFound`; the message points to the access request page when
     `ALLOW_USER_ACCESS_REQUEST` is on. No automatic sign-up.
4. A logged-in user linking from the profile page skips the email match: the identity is linked to the current user
   (still refused if already linked to another user).

The login rate limiters also apply to the callback route.

### 2FA

Per provider, `requireArena2FA` (default `true`): users who enabled Arena 2FA must still enter their Arena code after
the provider login, so the external provider does not become a way around it. Implementation: the callback stores the
pending login in a short-lived signed cookie and redirects to `/guest/login?step=2fa`; the existing 2FA step of the
login form submits the code to a new `POST /auth/oidc/2fa` endpoint, which completes the login. Admins can turn it off
for providers that enforce their own MFA.

### Users without a password

Users accepted through an external provider may have no password:

- Password login: no password → "invalid credentials" (verify no exception on a `null` hash).
- Profile "change password": allow setting a password without the old one when the user has none.
- User export/backup (`server/modules/user/service/usersBackup/`, `userExportService.ts`): include identity links.
- Arena Mobile: these users cannot log in to the mobile app until they set a password ("forgot password"); noted in
  the manual.

### Account management

- Profile page: "Linked accounts" section (provider icon and label, email, last used) with "Link" (starts the flow in
  link mode; the flow cookie records the current user uuid) and "Unlink".
- Unlink is refused if it would leave the user with no password and no other identity.
- System admins see and can remove the linked identities in the user edit view.
- User deletion: identities go with the `ON DELETE CASCADE`.

## Tasks

### Task 1: arena-server — adapter interface, OIDC adapter, provider service interface

- Add `openid-client` dependency.
- `AuthProviderAdapter` and `ExternalIdentity` types; OIDC adapter with the Google and Microsoft presets (multi-tenant
  issuer validation) and discovery cache.
- `ServerServiceType.authProvider` interface: `getEnabledProviders()`, `getProvider(id)` (with decrypted secret),
  `getIcon(id)`; in-process cache with 60 s TTL and explicit invalidation.
- Unit tests: adapter against a mock OIDC provider (`oauth2-mock-server`), Microsoft issuer template, discovery
  failure isolates the provider.

### Task 2: arena-server — migrations and repositories

- Migrations creating `auth_provider` and `user_external_identity`.
- `UserExternalIdentityRepository`: `insert`, `findByIssuerAndSubject`, `findByUserUuid`, `countByProviderId`,
  `delete`, `updateLastUsed`; exposed through a `ServerServiceType.userExternalIdentity` service.

### Task 3: arena-server — login routes

- Refactor `authenticationSuccessful` in `src/api/auth/login.ts`: extract `createSessionTokens({ req, res, user })`.
- New `src/api/auth/oidc.ts`: `GET /auth/providers`, `GET /auth/providers/:id/icon`, `GET /auth/oidc/:providerId`,
  `GET /auth/oidc/:providerId/callback`, `POST /auth/oidc/2fa`, link mode, test mode, access rules (incl. Gmail
  normalization), per-provider flags.
- Add the public paths to `pathsAllowedWithoutAuthentication`; endpoints in `ApiEndpoint.auth`; login rate limiters on
  the callback and the 2FA endpoint.
- Tests against the mock provider: happy path, invalid state, nonce mismatch, unverified email with and without
  `trustEmail`, disallowed domain, unknown user, invited user acceptance, Gmail variants, ambiguous email, linked user
  with changed email, 2FA required / not required, disabled provider, link mode.
- Release a new arena-server version (and arena-core if the user service interface changes).

### Task 4: Arena — provider configuration module

- Generalize `server/utils/crypto/secretBox.ts` to take the key name; `AUTH_PROVIDER_SECRET_ENCRYPTION_KEY`.
- `server/modules/authProvider/`: repository (`auth_provider`), env config parsing (`AUTH_PROVIDERS_CONFIG`,
  `AUTH_PROVIDER_<ID>_CLIENT_SECRET`), service (validation: slug format, immutable id, required fields per type, unique
  id across DB and env; SVG sanitization and size limit for icons), admin API, implementation of
  `ServerServiceType.authProvider` registered in `server/system/arenaServerServices.ts`.
- Bump `@openforis/arena-server` (and arena-core, single version: `yarn dedupe @openforis/arena-core`).
- Integration tests for the admin API (permissions, secret never returned, env providers read-only, delete cascade).

### Task 5: Arena — user side

- User service method(s) needed by the callback (invited user acceptance without a password).
- `GET /api/user/:userUuid/external-identities`, `DELETE .../:identityId` (self or system admin; unlink rule).
- Users backup export/import: include identity links.
- Allow setting a password without the old one when the user has none.
- Integration tests.

### Task 6: Arena — webapp

- Built-in icons in `web-resources/img/auth-providers/` (official Google and Microsoft SVG logos).
- Login page: provider buttons with icons, `?provider=<id>` direct start, `?step=2fa` for the external login 2FA
  step, `oidcError` messages.
- System admin "Login providers" page: list, add (preset choice), edit form, secret field, icon picker/upload,
  redirect URI with copy button, test connection, test sign-in, reorder, disable, delete with affected users list.
- Profile / user edit view: "Linked accounts" section.
- i18n keys (all supported languages).

### Task 7: Tests and documentation

- E2E (Playwright) with a mock OIDC provider in the e2e setup: admin creates a generic provider in the UI, existing
  user logs in with it, invitation acceptance, unknown-user error, 2FA step.
- `docs/architecture.md`: authentication section (password, external providers, tokens, adapters).
- `docs/server-requirements.md`: `AUTH_PROVIDER_SECRET_ENCRYPTION_KEY`, `AUTH_PROVIDERS_CONFIG`, how to register the
  redirect URI at Google, Microsoft and Keycloak.
- User manual (`docs/user-manual/`, EN/FR/ES): signing in with an external provider, linked accounts, the "Login
  providers" admin page, 2FA and Arena Mobile notes, with screenshots.

## Security checklist

- PKCE (S256) + `state` + `nonce` on every flow; flow and pending-2FA cookies signed, `httpOnly`, `Secure` in
  production, short TTL, cleared after use.
- ID token validated by `openid-client` (signature via JWKS, `iss`, `aud`, `exp`, `nonce`); algorithm `none` refused.
- Verified email (or explicit per-provider `trustEmail`) required for first-time linking by email.
- Arena 2FA kept by default for users who enabled it.
- Client secrets encrypted at rest, write-only in the API, never logged; uploaded SVG icons sanitized.
- Redirect after login is always `/app/home/` (no user-supplied `returnTo`, avoiding open redirects).
- No tokens or error details in URLs.
- Admin API restricted to system admins; every configuration change logged.
- Login rate limiting applied to the callback and the external-login 2FA endpoint.

## Open questions

- Should a system admin be able to restrict a user (or all users) to external providers only, disabling password
  login?
- Should first-time linking of an existing *password* user by verified email require confirmation (entering the Arena
  password once)? Default in this plan: no, mitigated by per-provider allowed domains, `trustEmail` off by default and
  Arena 2FA kept.
- Is self sign-up through external providers (creating users without an invitation) wanted for some instances?
- Should survey admins (not only system admins) be able to see which login method their survey users use?
