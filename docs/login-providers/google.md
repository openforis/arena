# Google

Lets users sign in with their Google account (Gmail or Google Workspace). See [Login providers](README.md) for what
applies to every provider.

## 1. Create the provider in Arena

In *System administration > Login providers*, click **Add provider** and choose **Google**. Keep the identifier
`google` (or choose another one) and copy the **Redirect URI** shown on the right.

## 2. Create a Google Cloud project

1. Open the [Google Cloud console](https://console.cloud.google.com/) with the Google account that will manage the
   registration (preferably an account of your organization, not a personal one).
2. Select an existing project or create a new one (e.g. *Arena login*).

## 3. Configure the Google Auth Platform

Open **Google Auth Platform** (menu *APIs & Services > OAuth consent screen* in older consoles). The first time,
click **Get started**:

1. **App information:** app name (e.g. *Open Foris Arena*, shown to users when they sign in) and support email.
2. **Audience:**
   - **Internal**: only the accounts of your Google Workspace organization can sign in (available only to
     Workspace organizations).
   - **External**: any Google account can sign in (Arena still lets in only its own users).
3. **Contact information**, then accept the user data policy and click **Create**.

Then, in **Data access**, you don't need to add scopes: Arena requests only `openid`, `email` and `profile`, which
don't need Google's verification.

With an **External** audience, the app starts in **Testing** status: only the test users listed in **Audience**
can sign in. When everything works, click **Publish app** in **Audience** to let every user sign in.

## 4. Create the OAuth client

1. In **Clients**, click **Create client**.
2. **Application type:** *Web application*; **Name:** e.g. *Arena*.
3. **Authorized redirect URIs:** add the redirect URI copied from Arena (exactly, including `https://` and without
   a trailing slash). *Authorized JavaScript origins* can stay empty.
4. Click **Create**. Google shows the **Client ID** and the **Client secret**: copy both now, as the secret may not
   be shown again (if it is lost, add a new secret to the client).

## 5. Complete the provider in Arena

1. Paste the client ID and client secret into the **Client ID** and **Client secret** fields of the **Connection**
   section.
2. Optionally restrict **Allowed email domains** (e.g. your Workspace domain).
3. Click **Save**, then **Test connection** and **Test sign-in**.

## Troubleshooting

- *Error 400: redirect_uri_mismatch*: the redirect URI registered in Google differs from the one shown in Arena
  (check `https`, the host name, the provider identifier and the trailing slash). Changes in Google can take a few
  minutes to apply.
- *Access blocked: app has not completed the Google verification process* or *only test users*: the app is in
  **Testing** status; add the user as a test user or publish the app.
- *Error 401: invalid_client*: wrong client ID or secret.
