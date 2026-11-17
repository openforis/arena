# Generic OpenID Connect (OIDC) Login Implementation Plan

**Goal:** Let users sign in to Arena through any OpenID Connect provider configured by the instance administrator
(Google, Microsoft Entra ID, Keycloak, Okta, institutional SSO, ...), alongside the existing email/password login.

**Architecture:** OIDC is a new way to prove who the user is; everything after that is reused. The arena-server
callback route resolves the Arena user from the provider's ID token, then goes through the same code path as the
password login (`createUserAuthTokens` + refresh token cookie). The browser lands on `/app/home` with only the refresh
cookie set: the webapp's existing "401 → `POST /auth/token/refresh` → retry" interceptor
(`webapp/app/appErrorsMiddleware.js`) gets the access token, exactly as after a page reload.

**Tech stack:** [`openid-client`](https://github.com/panva/openid-client) v6 (certified OIDC relying party: discovery,
PKCE, state, nonce and ID token validation), Express, pg-promise, React.

## Scope

In scope:

- One or more OIDC providers, configured with environment variables (no admin UI).
- Authorization code flow with PKCE, `response_mode=query`.
- Login allowed only for users that already exist in Arena or have a pending invitation (see "Access rules").
- Linking / unlinking an external identity from the user's profile page.

Out of scope (possible follow-ups):

- Facebook and other OAuth2-only providers (no standard ID token; would need a provider-specific strategy).
- Arena Mobile login (native flow with PKCE and an app redirect URI; separate project).
- Single logout at the provider (RP-initiated logout): Arena logout keeps only revoking Arena's own tokens.
- Self sign-up through OIDC, SCIM provisioning, mapping provider groups/claims to Arena roles.
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
- Arena: user statuses `INVITED`, `FORCE_CHANGE_PASSWORD`, `ACCEPTED` (`core/user/user.ts`); invited users accept by
  setting name and password on the reset-password page (`server/modules/user/service/userService.ts` `resetPassword`).
- Arena webapp: login form `webapp/views/Guest/views/Login/Login.js`, login actions `webapp/store/login/actions.js`.

## Design decisions

### Configuration

Providers are configured with environment variables, read by arena-server (`ProcessEnv`):

```
OIDC_PROVIDERS=google,institution                 # provider ids, comma-separated; empty = feature off
OIDC_GOOGLE_ISSUER=https://accounts.google.com
OIDC_GOOGLE_CLIENT_ID=...
OIDC_GOOGLE_CLIENT_SECRET=...
OIDC_GOOGLE_LABEL=Google                          # button label
OIDC_GOOGLE_SCOPES=openid email profile           # optional, this is the default
OIDC_GOOGLE_ALLOWED_EMAIL_DOMAINS=fao.org         # optional, restricts who can use this provider
OIDC_INSTITUTION_ISSUER=https://sso.example.org/realms/main
...
OIDC_REDIRECT_BASE_URL=https://arena.example.org  # callback = <base>/auth/oidc/<id>/callback
```

Issuer metadata is fetched with OIDC discovery (`<issuer>/.well-known/openid-configuration`) lazily on first use and
cached; a discovery failure disables only that provider and is logged, it must not prevent the server from starting.

The public list of configured providers (id + label only) is exposed by a new unauthenticated
`GET /auth/oidc/providers` endpoint, so the webapp does not need build-time variables.

### Flow

1. The login page shows a "Sign in with <label>" button per provider; clicking it navigates (full page) to
   `GET /auth/oidc/:providerId`.
2. arena-server generates `state`, `nonce` and a PKCE `code_verifier`, stores them in a short-lived (10 min), signed,
   `httpOnly`, `SameSite=Lax` cookie scoped to `/auth/oidc/` (Lax is required: the callback is a cross-site top-level
   GET navigation), and redirects to the provider's authorization endpoint.
3. The provider redirects back to `GET /auth/oidc/:providerId/callback?code=...&state=...`.
4. arena-server validates `state`, exchanges the code (with the PKCE verifier), validates the ID token (signature,
   issuer, audience, expiry, nonce) with `openid-client`, then clears the flow cookie.
5. The user is resolved (see "Access rules"). On success the same token creation as the password login runs
   (refactor `authenticationSuccessful` so that the "send JSON" part is separate from the "create tokens + set refresh
   cookie" part), and the response redirects to `/app/home/`.
6. On failure the response redirects to `/guest/login?oidcError=<errorKey>`; the login page shows the translated
   message. Error details are logged server-side, never put in the URL.

The access token is never put in a URL. The webapp needs no special post-login handling: `/auth/user` returns 401,
the interceptor calls `/auth/token/refresh` with the cookie and retries.

To check during implementation: the refresh cookie is `SameSite=Strict` in production. It is set on the callback
response (setting is allowed) and is only sent later by same-site `fetch` calls from the loaded app, so it should
work; verify in Chrome, Firefox and Safari, including the case where the provider is on another site.

### Identity storage

New table in the `public` schema (arena-server migration):

```sql
CREATE TABLE user_external_identity (
  id             bigserial PRIMARY KEY,
  user_uuid      uuid        NOT NULL REFERENCES "user" (uuid) ON DELETE CASCADE,
  provider_id    varchar(64) NOT NULL,  -- id from OIDC_PROVIDERS
  issuer         text        NOT NULL,  -- iss claim, so a provider id reused for another issuer does not match
  subject        text        NOT NULL,  -- sub claim: stable, never reassigned by the provider
  email          text,                  -- informational, as last seen
  date_created   timestamptz NOT NULL DEFAULT now(),
  date_last_used timestamptz,
  UNIQUE (issuer, subject),
  UNIQUE (user_uuid, provider_id)
);
```

Users are matched by `(issuer, subject)`, never by email alone after the first link: emails can change or be
reassigned at the provider.

### Access rules

On callback, with the validated claims:

1. `(issuer, sub)` already linked → that user. Done.
2. Not linked: require `email` and `email_verified === true` (and the domain in `ALLOWED_EMAIL_DOMAINS` when set);
   otherwise reject (`oidcEmailNotVerified` / `oidcEmailDomainNotAllowed`).
3. Look up the Arena user by email (case-insensitive):
   - `ACCEPTED` or `FORCE_CHANGE_PASSWORD` → link the identity and log in. A verified email at the provider proves
     ownership of the address, which is the same proof the password reset flow relies on.
   - `INVITED` → link, set status to `ACCEPTED`, set the name from the `name` claim if the user has none, log in
     (this replaces the "set your password" step of the invitation; the user can still set a password later through
     "forgot password").
   - not found → reject with `oidcUserNotFound`; the message points to the access request page when
     `ALLOW_USER_ACCESS_REQUEST` is on. No automatic sign-up.

Rate limiting: the existing login rate limiters also apply to the callback route.

### 2FA

Arena 2FA is skipped for OIDC logins: authentication strength is the provider's responsibility (it can enforce MFA).
Documented in the user manual. A per-provider `OIDC_<ID>_REQUIRE_ARENA_2FA=true` can be added later if needed.

### Users without a password

Users created or accepted through OIDC may have no password. Check and adapt:

- Login with password: no password → "invalid credentials" (already the behavior of a failed compare; verify no
  exception on `null` hash).
- Profile "change password": allow setting a password without the old one when the user has none.
- User export/backup (`server/modules/user/service/usersBackup/`, `userExportService.ts`): include linked identities
  in the backup and import them back.
- Arena Mobile: OIDC-only users cannot log in to the mobile app until mobile OIDC exists; they can set a password via
  "forgot password". Note in the manual.

### Account management

- Profile page: "Linked accounts" section listing the user's identities (provider label, email, last used) with
  "Link" (starts the flow in link mode, only for a logged-in user; the flow cookie records the user uuid) and "Unlink".
- Unlink is refused if it would leave the user with no password and no other identity.
- System admins see the linked providers in the user edit view (read-only) and can unlink them.
- User deletion: identities go with the `ON DELETE CASCADE`.

## Tasks

### Task 1: arena-server — configuration and provider registry

- Add `openid-client` dependency.
- Parse `OIDC_*` variables in `ProcessEnv` (`oidcProviders: OidcProviderConfig[]`, `oidcRedirectBaseUrl`).
- `OidcProviderRegistry`: lazy discovery + cache per provider, `getProvider(id)`, `listPublicProviders()`.
- Unit tests: env parsing (missing/invalid variables, defaults), discovery failure isolates the provider.

### Task 2: arena-server — migration and repository

- Migration creating `user_external_identity` (public schema).
- `UserExternalIdentityRepository`: `insert`, `findByIssuerAndSubject`, `findByUserUuid`, `delete`, `updateLastUsed`.
- Expose it through a `ServerServiceType.userExternalIdentity` service so Arena can call it.

### Task 3: arena-server — login routes

- Refactor `authenticationSuccessful` in `src/api/auth/login.ts`: extract `createSessionTokens({ req, res, user })`
  (tokens + refresh cookie), used by both the password login and the OIDC callback.
- New `src/api/auth/oidc.ts`: `GET /auth/oidc/providers`, `GET /auth/oidc/:providerId`,
  `GET /auth/oidc/:providerId/callback`, with the flow cookie and the access rules above. User lookup and
  invitation acceptance go through the `user` service registered by Arena (add a method such as
  `acceptInvitationExternal({ userUuid, name })` to the service interface in arena-core if needed).
- Add the three paths to `pathsAllowedWithoutAuthentication`; add endpoints to `ApiEndpoint.auth`.
- Apply the login rate limiters to the callback.
- Tests against a mock OIDC provider (e.g. `oauth2-mock-server`): happy path, invalid state, nonce mismatch, unverified
  email, unknown user, invited user acceptance, already linked user with a changed email, disallowed domain.
- Release a new arena-server version (and arena-core if its user service interface changes).

### Task 4: Arena — server side

- Bump `@openforis/arena-server` (and arena-core, keeping a single version: `yarn dedupe @openforis/arena-core`).
- Implement the user service method(s) needed by the callback in `server/modules/user/service/userService.ts`
  (invited user acceptance without a password).
- API for the logged-in user: `GET /api/user/:userUuid/external-identities`, `DELETE .../:identityId` (self or system
  admin; unlink rule above), in `server/modules/user/api/userApi.ts`.
- Users backup export/import: include identities.
- Allow setting a password without the old one when the user has none.
- Integration tests for the new user API endpoints.

### Task 5: Arena — webapp

- `webapp/service/api/`: fetch providers, list/unlink identities.
- Login page (`webapp/views/Guest/views/Login/Login.js`): provider buttons below the form (hidden when the list is
  empty), `oidcError` query param → translated error.
- Profile / user edit view: "Linked accounts" section.
- i18n keys (all supported languages) for buttons and the `oidc*` error keys.
- No hard-coded colors: provider buttons use the standard secondary button style (no provider logos/brand colors).

### Task 6: Tests and documentation

- E2E (Playwright): run a mock OIDC provider in the e2e setup; spec covering login of an existing user, invitation
  acceptance and the unknown-user error.
- `docs/architecture.md`: authentication section (password, OIDC, tokens).
- `docs/server-requirements.md`: OIDC environment variables and how to register the redirect URI at the provider.
- User manual (`docs/user-manual/`, EN/FR/ES): login with an external provider, linked accounts, 2FA and Arena Mobile
  notes, with screenshots.

## Security checklist

- PKCE (S256) + `state` + `nonce` on every flow; flow cookie signed, `httpOnly`, `Secure` in production, 10 min TTL,
  cleared on callback.
- ID token validated by `openid-client` (signature via JWKS, `iss`, `aud`, `exp`, `nonce`); algorithm `none` refused.
- `email_verified` required for first-time linking by email.
- Redirect after login is always `/app/home/` (no user-supplied `returnTo`, avoiding open redirects).
- No tokens or error details in URLs; client secrets only in environment variables, never logged.
- Login rate limiting applied to the callback.

## Open questions

- Should a system admin be able to restrict a user (or all users) to OIDC only, disabling password login?
- Should first-time linking of an existing *password* user by verified email require confirmation (e.g. entering the
  Arena password once), to protect against providers with weak email verification? Default in this plan: no, but
  `ALLOWED_EMAIL_DOMAINS` and only configuring trusted providers mitigate the risk.
- Is self sign-up through OIDC (creating users without an invitation) wanted for some instances?
