# Login providers admin UI – mockup (2026-11-18)

Static, clickable mockup of the system admin "Login providers" page planned in
`docs/superpowers/plans/2026-11-17-oidc-authentication.md`. Not wired to the app.

Open `index.html` in a browser and use the top bar to switch screen and theme (light/dark). State is kept in the URL,
e.g. `index.html?screen=form&theme=dark`. It reuses the Arena logo of the guest pages mockup
(`../2026-11-09-guest-pages/of_arena_icon.png`).

## Screens

| Screen | Content |
| --- | --- |
| List | Providers in login page order (drag to reorder), type, status (enabled, disabled, discovery failed), login page visibility, linked users (link to the filtered Users list), last used; row menu with test, copy redirect URI, hide, disable, delete. |
| Empty / no key | Empty state; "Add provider" disabled with an explanation when `AUTH_PROVIDER_SECRET_ENCRYPTION_KEY` is missing. |
| Add: choose type | Preset dialog: Google, Microsoft, generic OpenID Connect. |
| Edit form | Generic OIDC provider: General (label, immutable identifier, icon, enabled, show on login page), Connection (issuer with discovery status, client ID, write-only secret, scopes), Access (allowed domains, require Arena 2FA, trust emails); side panel with the redirect URI, setup steps and a live login page preview. |
| New Google | Google preset: no issuer, fixed official logo, inline validation. |
| Test results | "Test sign-in" result: validated claims, allowed domain check and the Arena user that would match, without logging in. |
| Delete | Confirmation listing users left without any sign-in method, option to email them, type-to-confirm; suggests disabling instead. |
| Env provider | Provider defined in `AUTH_PROVIDERS_CONFIG`: read-only settings, tests still available. |

Only theme tokens are used for the UI; the Google and Microsoft logos keep their official colors (brand assets,
required by their sign-in branding guidelines).
