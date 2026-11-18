# Microsoft

Lets users sign in with a Microsoft work or school account (Microsoft Entra ID, Microsoft 365) and, optionally,
with a personal Microsoft account (Outlook.com, Hotmail). See [Login providers](README.md) for what applies to every
provider.

## 1. Create the provider in Arena

In *System administration > Login providers*, click **Add provider** and choose **Microsoft**. Keep the identifier
`microsoft` (or choose another one) and copy the **Redirect URI** shown on the right.

## 2. Register the application

1. Open the [Microsoft Entra admin center](https://entra.microsoft.com/) (or *Microsoft Entra ID* in the
   [Azure portal](https://portal.azure.com/)) with an account allowed to register applications.
2. Go to **Entra ID > App registrations** and click **New registration**.
3. **Name:** e.g. *Open Foris Arena* (shown to users when they sign in).
4. **Supported account types**, and the matching **Tenant** to set in Arena:

   | Supported account types | Tenant in Arena |
   | --- | --- |
   | Accounts in this organizational directory only (single tenant) | the **Directory (tenant) ID** of the application's *Overview* page |
   | Accounts in any organizational directory (multitenant) | `organizations` |
   | Accounts in any organizational directory and personal Microsoft accounts | `common` |
   | Personal Microsoft accounts only | `consumers` |

5. **Redirect URI:** platform **Web**, and the redirect URI copied from Arena.
6. Click **Register**.

## 3. Create a client secret

1. In the application, open **Certificates & secrets > Client secrets** and click **New client secret**.
2. Enter a description and an expiry (at most 24 months), then click **Add**.
3. Copy the secret **Value** (not the *Secret ID*): it is shown only now.

The secret expires: before the expiry date, create a new one and paste it into Arena, otherwise users can no longer
sign in with Microsoft.

## 4. Permissions

The registration already has the *User.Read* permission; Arena requests the `openid`, `email` and `profile` scopes,
which users accept at their first sign-in. If your organization doesn't let users consent to applications, an
administrator clicks **Grant admin consent** in **API permissions**.

## 5. Complete the provider in Arena

1. In the **Connection** section, set the **Tenant** (see the table above), and paste the **Application (client)
   ID** of the application's *Overview* page and the secret value into **Client ID** and **Client secret**.
2. Click **Save**, then **Test connection** and **Test sign-in**.

## Matching Arena accounts by email

Microsoft doesn't confirm that the email of an account is verified, so by default Arena doesn't match accounts by
email: users link Microsoft from their profile (*Sign-in methods*) or accept an invitation with it.

To match by email, check **Trust emails from this provider**, only with a **single tenant** registration (your
organization's directory, where the administrators manage the emails), and restrict **Allowed email domains** to
your organization's domains. Don't trust emails with `common` or `organizations`: in other directories anyone
could set any email on an account.

## Troubleshooting

- *AADSTS50011: The redirect URI ... does not match*: register the redirect URI shown in Arena, as a **Web** URI.
- *AADSTS50194 / AADSTS700016*: the tenant set in Arena doesn't match the supported account types.
- *AADSTS7000215: Invalid client secret*: paste the secret **Value**, not the *Secret ID*; check that it hasn't
  expired.
- No email received: in **Token configuration**, add the optional claim `email` to the ID token.
