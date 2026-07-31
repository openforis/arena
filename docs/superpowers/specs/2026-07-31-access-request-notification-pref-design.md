# System-admin notification preference for new access requests

## Problem

Whenever a user submits an access request to Arena, **every** system admin is emailed
(`server/modules/user/service/userService.js`, `insertUserAccessRequest`, via
`UserManager.fetchSystemAdministratorsEmail` +
`Mailer.sendEmail({ msgKey: 'emails:userAccessRequest' })`). There is no way for an
individual system admin to opt out.

## Goal

Let a system admin opt out of these emails from their own profile editor
(`UserEdit.js`), without changing the current behavior for admins who don't touch the
setting (they keep receiving emails, same as today).

## Scope / constraints

- Preference is visible **only** to system admins, and only when a system admin is
  editing **their own** profile (not when editing another admin's profile).
- Default (unset) behavior must be "notify" — existing admins must not silently stop
  receiving emails after this ships.
- No DB migration: the `user.prefs` JSONB column already exists and is the right home
  for this (matches existing prefs like `language`, `surveys.current`).
- Reuse the existing self-only prefs save path
  (`POST /api/user/:userUuid/prefs` → `UserService.updateUserPrefs`) instead of adding
  `prefs` to the main profile PUT flow — the endpoint already enforces
  `User.isEqual(userToUpdate)(user)`, which gives us "self only" for free with no new
  permission code.

## Design

### 1. Domain model — `core/user/_user/userPrefs.ts`

Add a new pref key and accessor pair, following the exact style of
`getPrefLanguage` / `assocPrefLanguage`:

```ts
export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  language: 'language',
  notifyOnUserAccessRequest: 'notifyOnUserAccessRequest',
} as const

const pathNotifyOnUserAccessRequest = [keys.prefs, keysPrefs.notifyOnUserAccessRequest]

// default true: unset pref must behave like "notify" (preserves current behavior)
export const getPrefNotifyOnUserAccessRequest = (user: Record<string, unknown>) =>
  R.pathOr(true, pathNotifyOnUserAccessRequest, user)

export const assocPrefNotifyOnUserAccessRequest = (value: boolean) =>
  R.assocPath(pathNotifyOnUserAccessRequest, value)
```

Re-export both from `core/user/user.ts`, alongside the existing `UserPrefs.*`
re-exports (`getPrefLanguage`, `assocPrefLanguage`, etc., ~line 109-122).

### 2. Backend — `server/modules/user/repository/userRepository.js`

Modify `fetchSystemAdministratorsEmail` to filter out admins who explicitly opted out.
Missing/`null` pref is treated as opted-in (`true`), matching the domain-model default:

```sql
SELECT u.email
FROM "user" u
JOIN auth_group_user gu ON gu.user_uuid = u.uuid
JOIN auth_group g ON g.uuid = gu.group_uuid
WHERE g.name = $1
  AND COALESCE((u.prefs->>'notifyOnUserAccessRequest')::boolean, true) = true
```

No other backend changes: `userService.insertUserAccessRequest`, `Mailer`, and the email
template (`emails:userAccessRequest`) are untouched. `countSystemAdministrators` is
unrelated (used for "last admin" checks) and is not touched.

### 3. Frontend — `webapp/views/App/views/Users/UserEdit/UserEdit.js`

Add a new group inside the existing self-only block
(`editingLoggedInUser && !showSurveyGroup`, which already hosts map API keys and
`UserAiSettingsPanel`), gated additionally on `systemAdmin`. Use the shared
`Fieldset` component (`webapp/components/Fieldset.tsx`, exported from
`@webapp/components`) rather than a raw `<fieldset>` tag — it renders the
`<fieldset>`/`<legend>` markup and translates the `legend` prop internally via
`useI18n`, so an i18n key is passed directly:

```jsx
{systemAdmin && (
  <Fieldset className="notification-prefs" legend="usersView:prefs.title">
    <Checkbox
      checked={notifyOnUserAccessRequest}
      label="usersView:prefs.notifyOnUserAccessRequest"
      onChange={(value) => {
        setNotifyOnUserAccessRequest(value)
        setNotificationPrefsDirty(true)
      }}
    />
  </Fieldset>
)}
```

`Fieldset` is added to the existing `@webapp/components` import in `UserEdit.js`
(which already imports `Button`, `ButtonDelete`, `ButtonInvite`, `ButtonSave`).

State/save wiring mirrors the existing `aiSettingsDirty` / `aiSaveRef` pattern already
in this file:

- Local state `notifyOnUserAccessRequest` initialized from
  `User.getPrefNotifyOnUserAccessRequest(user)`.
- Local dirty flag `notificationPrefsDirty` (like `aiSettingsDirty`).
- `onSaveAll` gains a third branch: if `notificationPrefsDirty`, dispatch
  `UserActions.updateUserPrefs({ user: User.assocPrefNotifyOnUserAccessRequest(notifyOnUserAccessRequest)(user) })`
  (existing action, already posts to `/api/user/:userUuid/prefs`).
- `ButtonSave`'s `disabled` condition extends from `!dirty && !aiSettingsDirty` to
  `!dirty && !aiSettingsDirty && !notificationPrefsDirty`.

No changes to `prepareFormData`, `useOnSave.js`, or any server PUT `/api/user/:uuid`
code — the prefs save is fully independent, using the already-existing prefs endpoint.

#### Adjacent cleanup: map API keys fieldset

The map API keys block in the same self-only section still uses a raw `<fieldset>` with
a manually translated `<legend>`. Convert it to `Fieldset` for consistency with the new
block:

```jsx
<Fieldset className="map-api-keys" legend="user.mapApiKeys.title">
  <FormItem label="user.mapApiKeys.mapProviders.planet">…</FormItem>
</Fieldset>
```

That `<legend>{i18n.t('user.mapApiKeys.title')}</legend>` is the **only** use of `i18n`
in `UserEdit.js`, so the conversion also requires removing `const i18n = useI18n()` and
the now-unused `useI18n` import — otherwise ESLint `no-unused-vars` fails.

### 4. i18n

Add to `core/i18n/resources/en/usersView.js`:

```js
prefs: {
  title: 'Notification preferences',
  notifyOnUserAccessRequest: 'New user access requests',
}
```

Mirror the same keys (with best-effort translations) in `es`, `fr`, `mn`, `pt`, `ru`
under their respective `usersView.js` files, flagged for a native-speaker review pass
later — not blocking for this change.

## Out of scope

- Editing this preference on behalf of another system admin.
- Any wider refactoring of `UserEdit.js` beyond the `Fieldset` conversion noted above.
- Any other notification types besides "new access request" (the fieldset is
  structured to allow adding more checkboxes later, but none are added now).
- DB migration (not needed — `prefs` JSONB already supports arbitrary keys).

## Testing plan

- Manual: as a system admin, uncheck the preference, save, confirm
  `prefs.notifyOnUserAccessRequest = false` persists (reload profile). Submit a new
  access request and confirm that admin's email is excluded while other admins
  (default/unset pref) still receive it.
- Optional small unit test for `getPrefNotifyOnUserAccessRequest` default-true
  behavior in `core/user/_user/userPrefs.ts`, if desired during implementation.
