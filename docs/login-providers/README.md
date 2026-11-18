# Login providers: setup guides

How to register Arena at an external identity provider, so that users can sign in with it. The providers are
added by a system administrator in *System administration > Login providers*; the edit form links to the guide of
its provider type.

- [Google](google.md): Google accounts (Gmail and Google Workspace).
- [Microsoft](microsoft.md): Microsoft work, school and personal accounts (Microsoft Entra ID).
- [Keycloak and other OpenID Connect providers](keycloak.md): an institutional single sign-on (Keycloak, Okta,
  Authentik, ...).

## Before you start

- The server must have `ARENA_PUBLIC_URL` (the public URL of Arena) and `AUTH_PROVIDER_SECRET_ENCRYPTION_KEY` set:
  see [Server requirements](../server-requirements.md).
- The **redirect URI** to register at the provider is shown in the provider form, on the right:
  `<ARENA_PUBLIC_URL>/auth/oidc/<provider identifier>/callback`, e.g.
  `https://arena.example.org/auth/oidc/google/callback`. It depends on the provider identifier, which can't be
  changed after the provider is saved.

## Who can sign in

An external sign-in never creates an Arena account: only users who already have an Arena account or an
invitation can sign in.

- The first time, the account is matched by email. This works only when the provider confirms that the email is
  verified (Google always does), or when **Trust emails from this provider** is checked.
- Otherwise users link the provider from their profile (*Sign-in methods*), after signing in with their
  password, or accept an invitation with it.
- **Allowed email domains** limits sign-in to emails of the listed domains (e.g. your organization's).

After saving, use **Test connection** (Arena can reach the provider) and **Test sign-in** (sign in at the provider
and see which Arena user would match, without logging in).

## Defining providers in the server configuration

Instead of the admin page, providers can be defined in a JSON file referenced by `AUTH_PROVIDERS_CONFIG`, with
each client secret in `AUTH_PROVIDER_<ID>_CLIENT_SECRET`: they are shown read-only in the admin page. The
registration at the provider is the same.
