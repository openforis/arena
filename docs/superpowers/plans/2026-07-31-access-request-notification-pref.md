# Access-Request Notification Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a system admin opt out, from their own profile page, of the email sent to all system admins when a new user access request is submitted.

**Architecture:** A new boolean key in the existing `user.prefs` JSONB bag (`notifyOnUserAccessRequest`), defaulting to `true` when unset so current behavior is preserved. The server filters opted-out admins directly in the SQL that collects recipient emails. The UI adds a checkbox in the User Edit page's self-only section, saved through the already-existing self-only `POST /api/user/:userUuid/prefs` endpoint.

**Tech Stack:** Node.js, Ramda (`core/`), pg-promise (raw SQL), React 18 + Redux Toolkit, i18next, Jest (unit tests bundled by webpack).

## Global Constraints

- Default when the pref is unset **must** be "notify" (`true`). Existing admins must not silently stop receiving emails.
- No DB migration — `user.prefs` is already a JSONB column.
- The preference is visible only when a **system admin** edits their **own** profile.
- Do not add `prefs` to the main profile PUT flow (`prepareFormData` / `useOnSave.js`); use the existing prefs endpoint.
- Checkbox label copy (English, exact): `New user access requests`
- Fieldset legend copy (English, exact): `Notification preferences`
- Use the shared `Fieldset` component (`@webapp/components`), never a raw `<fieldset>` tag.
- ESLint runs on commit via lint-staged (`eslint --cache --fix`) over `{common,core,server,test,webapp}/**/*.{js,jsx,ts,tsx}`. `no-console` is an error. Unused variables fail the build.

---

### Task 1: Domain model — `notifyOnUserAccessRequest` pref accessors

**Files:**
- Modify: `core/user/_user/userPrefs.ts`
- Modify: `core/user/user.ts:100-122` (the `// PREFS` re-export block)
- Test: `test/unit/tests/038userPrefs.test.js` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `User.getPrefNotifyOnUserAccessRequest(user: object): boolean` — returns the stored boolean, or `true` when unset/null.
  - `User.assocPrefNotifyOnUserAccessRequest(value: boolean) => (user: object) => object` — curried, returns a new user object.
  - `UserPrefs.keysPrefs.notifyOnUserAccessRequest === 'notifyOnUserAccessRequest'` — the exact JSONB key, relied on by the SQL in Task 2.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/038userPrefs.test.js`:

```js
import * as User from '@core/user/user'

describe('User prefs - notifyOnUserAccessRequest', () => {
  describe('getPrefNotifyOnUserAccessRequest', () => {
    it('defaults to true when user has no prefs at all', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({})).toBe(true)
    })

    it('defaults to true when prefs exist but the key is missing', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { language: 'en' } })).toBe(true)
    })

    it('defaults to true when the stored value is null', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: null } })).toBe(true)
    })

    it('returns false when explicitly disabled', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: false } })).toBe(false)
    })

    it('returns true when explicitly enabled', () => {
      expect(User.getPrefNotifyOnUserAccessRequest({ prefs: { notifyOnUserAccessRequest: true } })).toBe(true)
    })
  })

  describe('assocPrefNotifyOnUserAccessRequest', () => {
    it('sets the pref on a user with no prefs', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({})
      expect(user.prefs.notifyOnUserAccessRequest).toBe(false)
    })

    it('preserves other prefs', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({
        prefs: { language: 'fr', surveys: { current: 3 } },
      })
      expect(user.prefs.language).toBe('fr')
      expect(user.prefs.surveys.current).toBe(3)
      expect(user.prefs.notifyOnUserAccessRequest).toBe(false)
    })

    it('does not mutate the original user', () => {
      const original = { prefs: { language: 'fr' } }
      User.assocPrefNotifyOnUserAccessRequest(false)(original)
      expect(original.prefs.notifyOnUserAccessRequest).toBeUndefined()
    })

    it('round-trips through the getter', () => {
      const user = User.assocPrefNotifyOnUserAccessRequest(false)({})
      expect(User.getPrefNotifyOnUserAccessRequest(user)).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "notifyOnUserAccessRequest"`

Expected: FAIL — `User.getPrefNotifyOnUserAccessRequest is not a function`.

- [ ] **Step 3: Add the pref key and accessors**

In `core/user/_user/userPrefs.ts`, extend `keysPrefs` (currently lines 10-14):

```ts
export const keysPrefs = {
  surveys: 'surveys',
  current: 'current',
  language: 'language',
  notifyOnUserAccessRequest: 'notifyOnUserAccessRequest',
} as const
```

Add the path constant next to the existing `pathLanguage` (line 29):

```ts
const pathNotifyOnUserAccessRequest = [keys.prefs, keysPrefs.notifyOnUserAccessRequest]
```

Add the getter in the `// ====== READ` section, after `getPrefLanguage` (line 68):

```ts
// defaults to true: an unset pref must behave like "notify", preserving pre-existing behaviour
export const getPrefNotifyOnUserAccessRequest = (user: Record<string, unknown>): boolean =>
  R.pathOr(true, pathNotifyOnUserAccessRequest, user) as boolean
```

Add the setter in the `// ====== UPDATE` section, after `assocPrefLanguage` (line 86):

```ts
export const assocPrefNotifyOnUserAccessRequest = (value: boolean) =>
  R.assocPath(pathNotifyOnUserAccessRequest, value)
```

- [ ] **Step 4: Re-export from `core/user/user.ts`**

In the `// PREFS` destructuring block (starts line ~101), add the two new names:

```ts
// PREFS
export const {
  newPrefs,
  getPrefSurveyCurrent,
  getPrefSurveyCycle,
  getPrefSurveyLang,
  getPrefSurveyCurrentCycle,
  getPrefLanguage,
  getPrefNotifyOnUserAccessRequest,
  assocPrefSurveyCurrent,
  assocPrefSurveyCycle,
  assocPrefSurveyLang,
  assocPrefSurveyCurrentAndCycle,
  deletePrefSurvey,
  assocPrefLanguage,
  assocPrefNotifyOnUserAccessRequest,
} = UserPrefs
```

- [ ] **Step 5: Run test to verify it passes**

Run: `yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "notifyOnUserAccessRequest"`

Expected: PASS — 9 tests passing.

- [ ] **Step 6: Commit**

```bash
git add core/user/_user/userPrefs.ts core/user/user.ts test/unit/tests/038userPrefs.test.js
git commit -m "feat(user): add notifyOnUserAccessRequest preference accessors"
```

---

### Task 2: Backend — exclude opted-out admins from the recipient query

**Files:**
- Modify: `server/modules/user/repository/userRepository.js:354-366` (`fetchSystemAdministratorsEmail`)

**Interfaces:**
- Consumes: the JSONB key string `notifyOnUserAccessRequest` established in Task 1.
- Produces: `fetchSystemAdministratorsEmail()` keeps its exact signature (`(client = db) => Promise<string[]>`); only the returned set shrinks. No caller changes.

**Context:** This function is called by `insertUserAccessRequest` in `server/modules/user/service/userService.js` (~line 121-162), which passes the result to `Mailer.sendEmail({ to: systemAdminEmails, msgKey: 'emails:userAccessRequest' })`. That service, the mailer, and the email template are **not** modified.

- [ ] **Step 1: Add the pref filter to the SQL**

Replace the query body of `fetchSystemAdministratorsEmail`:

```js
export const fetchSystemAdministratorsEmail = async (client = db) =>
  client.map(
    `
    SELECT u.email 
    FROM "user" u 
    JOIN auth_group_user gu ON gu.user_uuid = u.uuid
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE g.name = $1
      -- users who haven't set the pref (NULL) still get notified
      AND COALESCE((u.prefs ->> 'notifyOnUserAccessRequest')::boolean, true) = true
  `,
    [AuthGroup.groupNames.systemAdmin],
    (row) => row.email
  )
```

Leave `countSystemAdministrators` (immediately below, line 368) **unchanged** — it backs "is this the last admin?" checks and must count every admin regardless of notification prefs.

- [ ] **Step 2: Verify the SQL semantics against a live database**

Start the DB the project normally uses, then run this read-only query directly (it exercises exactly the COALESCE/cast expression, without needing an access request):

```sql
SELECT u.email,
       u.prefs ->> 'notifyOnUserAccessRequest' AS raw_pref,
       COALESCE((u.prefs ->> 'notifyOnUserAccessRequest')::boolean, true) AS will_notify
FROM "user" u
JOIN auth_group_user gu ON gu.user_uuid = u.uuid
JOIN auth_group g ON g.uuid = gu.group_uuid
WHERE g.name = 'systemAdmin';
```

Expected: every existing admin shows `raw_pref = NULL` and `will_notify = t`. No SQL error on the `::boolean` cast.

If a live DB is not available in this environment, say so explicitly rather than claiming the step passed, and defer this verification to Task 5's manual test.

- [ ] **Step 3: Lint the changed file**

Run: `npx eslint --cache --fix server/modules/user/repository/userRepository.js`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/modules/user/repository/userRepository.js
git commit -m "feat(user): skip opted-out admins when emailing new access requests"
```

---

### Task 3: i18n — add the new keys in all six languages

**Files:**
- Modify: `core/i18n/resources/en/usersView.js`
- Modify: `core/i18n/resources/es/usersView.js`
- Modify: `core/i18n/resources/fr/usersView.js`
- Modify: `core/i18n/resources/mn/usersView.js`
- Modify: `core/i18n/resources/pt/usersView.js`
- Modify: `core/i18n/resources/ru/usersView.js`

**Interfaces:**
- Consumes: nothing.
- Produces: two i18n keys used verbatim by Task 4 — `usersView:prefs.title` and `usersView:prefs.notifyOnUserAccessRequest`.

**Context:** Each of these files is a single `export default { ... }` object with roughly alphabetical top-level keys. Every one of them contains a `roleInCurrentSurvey:` key — insert the new `prefs` object immediately **before** that line in each file.

- [ ] **Step 1: Add the English keys**

In `core/i18n/resources/en/usersView.js`, immediately before `roleInCurrentSurvey:`:

```js
  prefs: {
    title: 'Notification preferences',
    notifyOnUserAccessRequest: 'New user access requests',
  },
```

- [ ] **Step 2: Add the translated keys**

`core/i18n/resources/es/usersView.js`:

```js
  prefs: {
    title: 'Preferencias de notificación',
    notifyOnUserAccessRequest: 'Nuevas solicitudes de acceso de usuarios',
  },
```

`core/i18n/resources/fr/usersView.js`:

```js
  prefs: {
    title: 'Préférences de notification',
    notifyOnUserAccessRequest: "Nouvelles demandes d'accès des utilisateurs",
  },
```

`core/i18n/resources/mn/usersView.js`:

```js
  prefs: {
    title: 'Мэдэгдлийн тохиргоо',
    notifyOnUserAccessRequest: 'Шинэ хэрэглэгчийн хандалтын хүсэлт',
  },
```

`core/i18n/resources/pt/usersView.js`:

```js
  prefs: {
    title: 'Preferências de notificação',
    notifyOnUserAccessRequest: 'Novas solicitações de acesso de usuários',
  },
```

`core/i18n/resources/ru/usersView.js`:

```js
  prefs: {
    title: 'Настройки уведомлений',
    notifyOnUserAccessRequest: 'Новые запросы на доступ',
  },
```

Note in the commit body that the five non-English strings are best-effort and want a native-speaker review pass.

- [ ] **Step 3: Verify every file parses and has the keys**

Run:

```bash
node -e "
for (const l of ['en','es','fr','mn','pt','ru']) {
  const m = require('./core/i18n/resources/'+l+'/usersView.js')
  const v = (m.default || m).prefs
  if (!v || !v.title || !v.notifyOnUserAccessRequest) throw new Error('missing prefs keys in '+l)
  console.log(l, '->', v.title, '/', v.notifyOnUserAccessRequest)
}
"
```

Expected: six lines printed, no error. If this repo's `core/` files cannot be `require`d directly because of ESM/alias syntax, fall back to:

```bash
npx eslint core/i18n/resources/*/usersView.js && grep -c "notifyOnUserAccessRequest" core/i18n/resources/*/usersView.js
```

Expected: no lint errors, and `1` for each of the six files.

- [ ] **Step 4: Commit**

```bash
git add core/i18n/resources/*/usersView.js
git commit -m "feat(i18n): add notification preferences labels for users view"
```

---

### Task 4: Frontend — preference checkbox in User Edit, plus Fieldset cleanup

**Files:**
- Modify: `webapp/views/App/views/Users/UserEdit/UserEdit.js`

**Interfaces:**
- Consumes: `User.getPrefNotifyOnUserAccessRequest` / `User.assocPrefNotifyOnUserAccessRequest` (Task 1); i18n keys `usersView:prefs.title` and `usersView:prefs.notifyOnUserAccessRequest` (Task 3); the pre-existing `UserActions.updateUserPrefs({ user })` action from `@webapp/store/user` (posts to `/api/user/:userUuid/prefs`).
- Produces: nothing consumed by later tasks.

**Context you need:**
- `user` (destructured from `useEditUser`) is the **logged-in** user; `userToUpdate` is the user being edited. `editingLoggedInUser = User.isEqual(user)(userToUpdate)` already exists at line ~91.
- The file already has a save-aggregation pattern for the AI panel (`aiSettingsDirty` / `aiSaveRef` / `onSaveAll` at lines 67-74). The new pref follows it exactly.
- The shared `Fieldset` component translates its `legend` prop internally via `useI18n`, so pass the **i18n key**, not translated text. Same for `Checkbox`'s `label`.

- [ ] **Step 1: Update imports**

Add `Fieldset` to the existing `@webapp/components` import (line 11):

```js
import { Button, ButtonDelete, ButtonInvite, ButtonSave, Fieldset } from '@webapp/components'
```

Add Redux imports (the file does not currently import them):

```js
import { useDispatch } from 'react-redux'
```

alongside the existing `react-router` import, and extend the user store import:

```js
import { UserActions } from '@webapp/store/user'
```

**Delete** the `useI18n` import (line 20) — see Step 4 for why:

```js
import { useI18n } from '@webapp/store/system'   // ← remove this line
```

- [ ] **Step 2: Add state and save wiring**

Next to the existing AI-panel state (lines 67-68), add:

```js
  const dispatch = useDispatch()
  const [notificationPrefsDirty, setNotificationPrefsDirty] = useState(false)
  const [notifyOnUserAccessRequest, setNotifyOnUserAccessRequest] = useState(() =>
    User.getPrefNotifyOnUserAccessRequest(user)
  )
```

Then replace `onSaveAll` (lines 69-74) with:

```js
  const onSaveAll = useCallback(async () => {
    const saves = []
    if (dirty) saves.push(onSave())
    if (aiSettingsDirty) saves.push(aiSaveRef.current?.())
    if (notificationPrefsDirty) {
      saves.push(
        dispatch(
          UserActions.updateUserPrefs({
            user: User.assocPrefNotifyOnUserAccessRequest(notifyOnUserAccessRequest)(user),
          })
        )
      )
    }
    await Promise.all(saves)
    setNotificationPrefsDirty(false)
  }, [aiSettingsDirty, dirty, dispatch, notificationPrefsDirty, notifyOnUserAccessRequest, onSave, user])
```

- [ ] **Step 3: Add the fieldset to the self-only block**

Inside the `{editingLoggedInUser && !showSurveyGroup && ( ... )}` fragment (line 188), after `<UserAiSettingsPanel .../>`, add:

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

`systemAdmin` is already computed at line ~86 (`User.isSystemAdmin(userToUpdate)`); combined with the enclosing `editingLoggedInUser`, this gives "system admin editing their own profile".

- [ ] **Step 4: Convert the map API keys fieldset and drop the dead `i18n`**

Replace the raw `<fieldset className="map-api-keys">` / `<legend>{i18n.t('user.mapApiKeys.title')}</legend>` wrapper (lines 192-193 and its closing `</fieldset>` at line 213) with the shared component:

The full replacement block (the `FormItem` contents are unchanged from the current file, reproduced here so this step is self-contained):

```jsx
            <Fieldset className="map-api-keys" legend="user.mapApiKeys.title">
              <FormItem label="user.mapApiKeys.mapProviders.planet">
                <Input
                  disabled={!canEditEmail}
                  value={User.getMapApiKey({ provider: 'planet' })(userToUpdate)}
                  validation={Validation.getFieldValidation(`${User.keysProps.mapApiKeyByProvider}.planet`)(validation)}
                  onChange={(value) =>
                    onUpdate(User.assocMapApiKey({ provider: 'planet', apiKey: value })(userToUpdate))
                  }
                />
                <Button
                  label="common.test"
                  onClick={() =>
                    onMapApiKeyTest({
                      provider: 'planet',
                      apiKey: User.getMapApiKey({ provider: 'planet' })(userToUpdate),
                    })
                  }
                />
              </FormItem>
            </Fieldset>
```

Keep the surrounding `{canUseMap && ( ... )}` guard and its `// show map api keys only when editing the current user` comment as they are.

That legend was the **only** use of `i18n` in this file, so now also delete the hook call at line ~76:

```js
  const i18n = useI18n()   // ← remove
```

(The import was already removed in Step 1.) Skipping either deletion fails ESLint with `no-unused-vars`.

- [ ] **Step 5: Enable the Save button for pref-only changes**

Update the `ButtonSave` `disabled` prop (line ~239):

```jsx
            <ButtonSave
              onClick={onSaveAll}
              disabled={!canSave || (!dirty && !aiSettingsDirty && !notificationPrefsDirty)}
              className="btn-save"
            />
```

- [ ] **Step 6: Lint and build**

Run:

```bash
npx eslint --cache --fix webapp/views/App/views/Users/UserEdit/UserEdit.js && yarn build-dev
```

Expected: no lint errors (in particular no `no-unused-vars` for `i18n`/`useI18n`), and the client build completes successfully.

- [ ] **Step 7: Commit**

```bash
git add webapp/views/App/views/Users/UserEdit/UserEdit.js
git commit -m "feat(users): add access-request notification preference to user profile"
```

---

### Task 5: End-to-end manual verification

**Files:** none modified — this task verifies Tasks 1-4 together.

**Interfaces:**
- Consumes: everything from Tasks 1-4.
- Produces: a verified feature.

**Context:** There is no component-test or API-test harness in this repo for these layers (unit tests cover `core/` only; e2e is Playwright with its own auth fixtures). This task is a scripted manual pass. Report the actual observed result of each check — if a step cannot be run in this environment, say so explicitly instead of marking it passed.

- [ ] **Step 1: Start the app**

Run: `yarn watch`

Wait for the webpack dev server (port 9000) and backend (port 9090) to come up, then log in as a system admin.

- [ ] **Step 2: Verify visibility rules**

- Open your own profile (User menu → your name). Expected: a "Notification preferences" fieldset with a checked "New user access requests" checkbox.
- Open **another** user's profile as admin. Expected: the fieldset is **absent**.
- Log in as a non-admin and open your own profile. Expected: the fieldset is **absent**.

- [ ] **Step 3: Verify persistence**

As the system admin on your own profile: uncheck the box, confirm the Save button becomes enabled, click Save, then reload the page.

Expected: the checkbox is still unchecked after reload.

Confirm in the DB:

```sql
SELECT email, prefs FROM "user" WHERE email = '<your admin email>';
```

Expected: `prefs` contains `"notifyOnUserAccessRequest": false`, and previously existing prefs (e.g. `language`, `surveys`) are still present — the endpoint does a `prefs || $1::jsonb` merge, so nothing should have been dropped.

- [ ] **Step 4: Verify the email filter**

With at least two system admins in the system — one opted out (Step 3), one untouched — submit a new user access request from the public access-request form.

Expected: the untouched admin receives the "user access request" email; the opted-out admin does not. If the environment has no working SMTP, verify instead by logging the recipient list or by re-running the Task 2 Step 2 SQL and confirming the opted-out admin's email is no longer returned.

- [ ] **Step 5: Verify the map fieldset still renders**

On your own profile, confirm the "Map API keys" fieldset still shows its translated legend and the Planet API key input + Test button work as before. This guards the Task 4 Step 4 refactor.

- [ ] **Step 6: Run the full unit suite**

Run: `yarn test:unit`

Expected: all tests pass, including the 9 new ones from Task 1.

- [ ] **Step 7: Commit any fixes**

If Steps 1-6 surfaced defects, fix them and commit. If everything passed with no changes needed, there is nothing to commit — do not create an empty commit.
