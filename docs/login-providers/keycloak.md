# Keycloak and other OpenID Connect providers

Lets users sign in with an institutional single sign-on. The steps are for
[Keycloak](https://www.keycloak.org/); other OpenID Connect providers (Okta, Authentik, Auth0, ...) need the same
settings, under similar names. See [Login providers](README.md) for what applies to every provider.

## 1. Create the provider in Arena

In *System administration > Login providers*, click **Add provider** and choose **OpenID Connect**. Enter the
button label (e.g. *Organization SSO*): the identifier is derived from it and can be changed before saving. Copy
the **Redirect URI** shown on the right.

## 2. Create the client in Keycloak

In the Keycloak admin console, select the realm of your users, then **Clients > Create client**:

1. **General settings:** client type **OpenID Connect**, **Client ID** e.g. `arena`, name e.g.
   *Open Foris Arena*.
2. **Capability config:** turn on **Client authentication** (confidential client) and keep only **Standard flow**
   checked (authorization code flow).
3. **Login settings:** add the redirect URI copied from Arena to **Valid redirect URIs**.
4. Click **Save**, then copy the **Client secret** from the **Credentials** tab.

The `openid`, `email` and `profile` scopes are assigned to new clients by default (**Client scopes** tab).

## 3. Complete the provider in Arena

1. In the **Connection** section:
   - **Issuer URL:** `https://<keycloak host>/realms/<realm>` (Keycloak older than version 17:
     `https://<keycloak host>/auth/realms/<realm>`). Arena reads the other endpoints from
     `<issuer URL>/.well-known/openid-configuration`: open it in a browser to check the URL.
   - **Client ID** and **Client secret** of the client.
2. Click **Save**, then **Test connection** and **Test sign-in**.

## Matching Arena accounts by email

Keycloak sends `email_verified` according to the *Email verified* flag of each user. If your users' emails are
managed by your organization (e.g. imported from LDAP or Active Directory) but not flagged as verified, check
**Trust emails from this provider** and restrict **Allowed email domains** to your organization's domains.

## Other providers

- **Okta:** create an *OIDC - Web Application* app integration (grant type *Authorization Code*), add the redirect
  URI to *Sign-in redirect URIs*; issuer URL `https://<your domain>.okta.com` (or of an authorization server,
  e.g. `.../oauth2/default`).
- **Authentik:** create an *OAuth2/OpenID Provider* (client type *Confidential*) and an application using it;
  issuer URL `https://<authentik host>/application/o/<application slug>/`.
- **Any other provider:** register a confidential web application with the authorization code flow, the redirect
  URI and the `openid`, `email` and `profile` scopes; the issuer URL is the one in its
  `/.well-known/openid-configuration` document.
