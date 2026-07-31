# Survey Invite via QR Code (arena) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a survey admin generate a temporary, multi-use QR code from the Users page that grants a chosen survey role to any already-authenticated Arena user who scans it (via the Arena Mobile app), with the admin's browser showing a live "X joined" feed.

**Architecture:** A new `userQrInviteService.js` (sibling to the existing `userInviteService.js`) reuses that file's authorization rule (`checkCanInviteToGroup`, exported for this purpose) and `UserManager.addUserToGroup` — the exact function the email-invite flow already uses to grant a role to an existing user. Token storage/expiry is delegated entirely to `@openforis/arena-server`'s new `SurveyInviteTokenService` (built in a separate, already-completed plan for that repo: `survey-invite-via-qr-code-arena-server.md`), fetched via `ServiceRegistry.getInstance().getService(ServerServiceType.surveyInviteToken)` — the same pattern this repo already uses for `userTempAuthToken` (`server/modules/user/service/userService.js:438,536,585`). Three new HTTP routes are added to the existing `server/modules/user/api/userApi.js`: create-token (admin only), preview (any logged-in user — used by the mobile app to show what they're about to join), and accept (any logged-in user — grants the role and notifies the admin's browser over the existing `WebSocketServer`/`WebSocketEvents` mechanism, mirroring `userRoleUpdate`/`userRemovedFromSurvey`). The web admin UI is a new `UserInviteQrDialog` modal modeled directly on the existing `QRCodeLoginDialog`, reusing `DropdownUserRole`, `QRCode`, and `useOnWebSocketEvent`.

**Tech Stack:** Node.js/Express, pg-promise (via existing manager/repository layers, no new SQL in this repo — the new table lives in `@openforis/arena-server`), React 18, `qrcode.react` (already wrapped by `webapp/components/QRCode.js`), Jest (`test/integration`, bundled via webpack, runs against a real Postgres).

## Global Constraints

- **Depends on the `arena-server` plan being implemented and released first**: this plan assumes `@openforis/arena-server` exports `ServerServiceType.surveyInviteToken` and a service with `create({ surveyUuid, groupUuid, createdByUserUuid, expirationMinutes })`, `getByTokenHash(token)`, `deleteExpired()`. If `arena/package.json`'s `@openforis/arena-server` version predates that release, bump it first (`yarn add @openforis/arena-server@<new-version>`) — do not attempt to stub or duplicate the token table in this repo.
- Token default expiry: **60 minutes**.
- Token is **multi-use until expiry** — do not add any "delete on first read" behavior on this side either; that guarantee lives entirely in `arena-server`'s `getByTokenHash`.
- The admin picks the role via the same `DropdownUserRole` component and `Authorizer.getUserGroupsCanAssign` restrictions the email invite already uses (`showOnlySurveyGroups`) — no separate/duplicated role-permission logic.
- Reuse `UserManager.addUserToGroup` for the actual role grant — do not write new SQL to insert into `auth_group_user`.
- ESLint runs on commit via lint-staged (`eslint --cache --fix`) over `{common,core,server,test,webapp}/**/*.js`. `no-console` is an error. JSDoc is required on exported functions (description ending in a period, `@param`/`@returns` with types).
- `preview` and `accept` endpoints are for the **mobile app** (a separate repo/plan) to call — this repo's webapp only calls the create-token endpoint. Do not build webapp UI for preview/accept.

---

### Task 1: Export `checkCanInviteToGroup` from `userInviteService.js`

**Files:**
- Modify: `server/modules/user/service/userInviteService.js:90-108` (the `_checkCanInviteToGroup` function)

**Interfaces:**
- Consumes: nothing new.
- Produces: `checkCanInviteToGroup({ user, group, surveyInfo }): void` (throws `UnauthorizedError` on failure) — a named export with the same body as the existing private `_checkCanInviteToGroup`, relied on by Task 2.

**Context:** `_checkCanInviteToGroup` already implements every authorization rule the QR-invite creation needs (only system admins invite system admins; only system admins/survey managers invite survey managers; unpublished surveys only accept admin-tier invites). It's currently unexported and only used inside this file's own `inviteUsers`. Add a one-line alias export instead of moving/renaming the function, to keep the diff minimal and the existing internal call site (`inviteUsers`, line 199) untouched.

- [ ] **Step 1: Add the export**

In `server/modules/user/service/userInviteService.js`, immediately after the closing `}` of `_checkCanInviteToGroup` (line 108), add:

```js
// Exported for reuse by userQrInviteService.js (same authorization rules apply to QR-based invites)
export const checkCanInviteToGroup = _checkCanInviteToGroup
```

- [ ] **Step 2: Lint**

Run: `npx eslint --cache --fix server/modules/user/service/userInviteService.js`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add server/modules/user/service/userInviteService.js
git commit -m "refactor(user): export checkCanInviteToGroup for reuse by QR invites"
```

---

### Task 2: `userQrInviteService.js` — token creation

**Files:**
- Create: `server/modules/user/service/userQrInviteService.js`
- Test: `test/integration/tests/userQrInviteServiceTest.js`

**Interfaces:**
- Consumes: `checkCanInviteToGroup` (Task 1); `AuthManager.fetchGroupByUuid` (`server/modules/auth/manager/authManager.js`); `SurveyManager.fetchSurveyById` (`server/modules/survey/manager/surveyManager.js`); `ServerServiceType.surveyInviteToken` service from `@openforis/arena-server`.
- Produces: `createQrInviteToken({ user, surveyId, groupUuid, expirationMinutes = 60 }): Promise<{ token: string, dateExpiresAt: Date }>` — relied on by Task 4's create-token route.

- [ ] **Step 1: Write the failing test**

Create `test/integration/tests/userQrInviteServiceTest.js`:

```js
import { uuidv4 } from '../../../core/uuid'
import * as AuthGroup from '../../../core/auth/authGroup'
import * as Survey from '../../../core/survey/survey'
import * as User from '../../../core/user/user'

import * as SurveyManager from '../../../server/modules/survey/manager/surveyManager'
import { getContextUser } from '../config/context'

import * as UserQrInviteService from '../../../server/modules/user/service/userQrInviteService'

describe('User QR Invite Service', () => {
  test('createQrInviteToken returns a token and expiry, scoped to the survey and group', async () => {
    const user = getContextUser()
    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(user),
      name: `do_not_use__test_survey_qr_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey (QR invite)',
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user, surveyInfo: surveyInfo })
    const surveyId = Survey.getId(survey)
    const surveyInfoStored = Survey.getSurveyInfo(survey)
    const group = Survey.getAuthGroupByName(surveyInfoStored)(AuthGroup.groupNames.dataEditor)

    const result = await UserQrInviteService.createQrInviteToken({
      user,
      surveyId,
      groupUuid: AuthGroup.getUuid(group),
    })

    expect(result.token).toBeDefined()
    expect(result.dateExpiresAt).toBeDefined()

    await SurveyManager.deleteSurvey(surveyId)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test:integration -- userQrInviteServiceTest`

Expected: FAIL — `Cannot find module '../../../server/modules/user/service/userQrInviteService'`.

- [ ] **Step 3: Implement `createQrInviteToken`**

Create `server/modules/user/service/userQrInviteService.js`:

```js
import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as AuthManager from '@server/modules/auth/manager/authManager'

import { checkCanInviteToGroup } from './userInviteService'

const _getSurveyInviteTokenService = () =>
  ServiceRegistry.getInstance().getService(ServerServiceType.surveyInviteToken)

/**
 * Creates a temporary, multi-use QR-invite token that grants the given role to any
 * already-authenticated user who redeems it, until it expires.
 *
 * @param {object} params - The parameters.
 * @param {object} params.user - The admin generating the token.
 * @param {number} params.surveyId - Id of the survey the token grants access to.
 * @param {string} params.groupUuid - Uuid of the auth group (role) to grant.
 * @param {number} [params.expirationMinutes=60] - Minutes until the token expires.
 * @returns {Promise<{token: string, dateExpiresAt: Date}>} The plain token (shown once) and its expiry.
 */
export const createQrInviteToken = async ({ user, surveyId, groupUuid, expirationMinutes = 60 }) => {
  const group = await AuthManager.fetchGroupByUuid(groupUuid)
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
  const surveyInfo = Survey.getSurveyInfo(survey)

  checkCanInviteToGroup({ user, group, surveyInfo })

  const service = _getSurveyInviteTokenService()
  const { token, dateExpiresAt } = await service.create({
    surveyUuid: Survey.getUuid(surveyInfo),
    groupUuid,
    createdByUserUuid: User.getUuid(user),
    expirationMinutes,
  })
  return { token, dateExpiresAt }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test:integration -- userQrInviteServiceTest`

Expected: PASS.

- [ ] **Step 5: Lint**

Run: `npx eslint --cache --fix server/modules/user/service/userQrInviteService.js test/integration/tests/userQrInviteServiceTest.js`

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/modules/user/service/userQrInviteService.js test/integration/tests/userQrInviteServiceTest.js
git commit -m "feat(user): add createQrInviteToken to userQrInviteService"
```

---

### Task 3: `userQrInviteService.js` — preview and accept

**Files:**
- Modify: `server/modules/user/service/userQrInviteService.js`
- Modify: `test/integration/tests/userQrInviteServiceTest.js`

**Interfaces:**
- Consumes: `createQrInviteToken` (Task 2); `UserManager.fetchUserByUuid`, `UserManager.addUserToGroup` (`server/modules/user/manager/userManager.js`); `SystemError` (`@core/systemError`).
- Produces:
  - `previewQrInvite({ surveyId, token }): Promise<{ surveyName: string, groupName: string, invitedByName: string }>`
  - `acceptQrInvite({ user, surveyId, token }): Promise<{ surveyId: number, surveyName: string, groupName: string, createdByUserUuid: string }>` — throws `SystemError('appErrors:userInviteQrTokenInvalidOrExpired')`, `SystemError('appErrors:userHasRole')`, or `SystemError('appErrors:userIsAdmin')`.
  - Both relied on by Task 4's preview/accept routes.

- [ ] **Step 1: Add appError i18n keys**

In `core/i18n/resources/en/appErrors.js`, add (near the existing `userHasRole`/`userIsAdmin` keys, ~line 87):

```js
  userInviteQrTokenInvalidOrExpired: 'This QR invite is invalid or has expired',
```

- [ ] **Step 2: Write the failing tests**

Append to `test/integration/tests/userQrInviteServiceTest.js` (inside the existing `describe` block, after the first `test`):

```js
  test('previewQrInvite and acceptQrInvite grant the role to an existing user', async () => {
    const adminUser = getContextUser()
    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(adminUser),
      name: `do_not_use__test_survey_qr_accept_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey (QR invite accept)',
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user: adminUser, surveyInfo: surveyInfo })
    const surveyId = Survey.getId(survey)
    const surveyInfoStored = Survey.getSurveyInfo(survey)
    const group = Survey.getAuthGroupByName(surveyInfoStored)(AuthGroup.groupNames.dataEditor)

    const { token } = await UserQrInviteService.createQrInviteToken({
      user: adminUser,
      surveyId,
      groupUuid: AuthGroup.getUuid(group),
    })

    const invitee = await UserManager.insertUser({
      user: adminUser,
      email: `qr-invite-test-invitee-${uuidv4()}@openforis-arena.org`,
      password: null,
      status: User.userStatus.ACCEPTED,
      group: null,
    })

    const preview = await UserQrInviteService.previewQrInvite({ surveyId, token })
    expect(preview.surveyName).toBe(Survey.getName(surveyInfoStored))
    expect(preview.groupName).toBe(AuthGroup.getName(group))
    expect(preview.invitedByName).toBe(User.getName(adminUser))

    const accepted = await UserQrInviteService.acceptQrInvite({ user: invitee, surveyId, token })
    expect(accepted.groupName).toBe(AuthGroup.getName(group))

    const inviteeReloaded = await UserManager.fetchUserByUuid(User.getUuid(invitee))
    const inviteeAuthGroups = User.getAuthGroups(inviteeReloaded)
    expect(inviteeAuthGroups.some((g) => AuthGroup.getSurveyUuid(g) === Survey.getUuid(surveyInfoStored))).toBe(true)

    // token is multi-use: a second distinct user can redeem the same token before it expires
    const secondInvitee = await UserManager.insertUser({
      user: adminUser,
      email: `qr-invite-test-invitee-2-${uuidv4()}@openforis-arena.org`,
      password: null,
      status: User.userStatus.ACCEPTED,
      group: null,
    })
    const acceptedSecond = await UserQrInviteService.acceptQrInvite({ user: secondInvitee, surveyId, token })
    expect(acceptedSecond.groupName).toBe(AuthGroup.getName(group))

    await SurveyManager.deleteSurvey(surveyId)
  })

  test('acceptQrInvite rejects an unknown token', async () => {
    const adminUser = getContextUser()
    const surveyInfo = Survey.newSurvey({
      ownerUuid: User.getUuid(adminUser),
      name: `do_not_use__test_survey_qr_reject_${uuidv4()}`,
      label: 'DO NOT USE! Test Survey (QR invite reject)',
      languages: ['en'],
    })
    const survey = await SurveyManager.insertSurvey({ user: adminUser, surveyInfo: surveyInfo })
    const surveyId = Survey.getId(survey)

    await expect(
      UserQrInviteService.acceptQrInvite({ user: adminUser, surveyId, token: uuidv4() })
    ).rejects.toThrow()

    await SurveyManager.deleteSurvey(surveyId)
  })
```

Add the two new imports this appends need, at the top of the test file:

```js
import * as UserManager from '../../../server/modules/user/manager/userManager'
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn test:integration -- userQrInviteServiceTest`

Expected: FAIL — `UserQrInviteService.previewQrInvite is not a function`.

- [ ] **Step 4: Implement `previewQrInvite` and `acceptQrInvite`**

In `server/modules/user/service/userQrInviteService.js`, add these imports (extending the existing import block):

```js
import * as AuthGroup from '@core/auth/authGroup'
import SystemError from '@core/systemError'

import * as UserManager from '../manager/userManager'
```

Then append, after `createQrInviteToken`:

```js
const _fetchSurveyGroupAndTokenCreator = async ({ surveyId, token }) => {
  const service = _getSurveyInviteTokenService()
  const tokenFound = await service.getByTokenHash(token)
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
  const surveyInfo = Survey.getSurveyInfo(survey)

  if (!tokenFound || tokenFound.surveyUuid !== Survey.getUuid(surveyInfo)) {
    throw new SystemError('appErrors:userInviteQrTokenInvalidOrExpired')
  }

  const group = await AuthManager.fetchGroupByUuid(tokenFound.groupUuid)
  const createdByUser = await UserManager.fetchUserByUuid(tokenFound.createdByUserUuid)
  return { surveyInfo, group, createdByUser }
}

/**
 * Returns survey/role/inviter details for a QR-invite token, without granting anything.
 * Used by the mobile app to show a confirmation screen before the user accepts.
 *
 * @param {object} params - The parameters.
 * @param {number} params.surveyId - Id of the survey the token claims to grant access to.
 * @param {string} params.token - The plain token, as scanned from the QR code.
 * @returns {Promise<{surveyName: string, groupName: string, invitedByName: string}>} Preview details.
 */
export const previewQrInvite = async ({ surveyId, token }) => {
  const { surveyInfo, group, createdByUser } = await _fetchSurveyGroupAndTokenCreator({ surveyId, token })
  return {
    surveyName: Survey.getName(surveyInfo),
    groupName: AuthGroup.getName(group),
    invitedByName: User.getName(createdByUser),
  }
}

/**
 * Grants the role encoded in a QR-invite token to the given (already authenticated) user.
 *
 * @param {object} params - The parameters.
 * @param {object} params.user - The user redeeming the token (already logged in).
 * @param {number} params.surveyId - Id of the survey the token claims to grant access to.
 * @param {string} params.token - The plain token, as scanned from the QR code.
 * @returns {Promise<{surveyId: number, surveyName: string, groupName: string, createdByUserUuid: string}>} Result summary.
 */
export const acceptQrInvite = async ({ user, surveyId, token }) => {
  const { surveyInfo, group, createdByUser } = await _fetchSurveyGroupAndTokenCreator({ surveyId, token })

  // Re-check the token creator is still allowed to grant this role: defense in depth,
  // in case their permissions changed after the token was generated.
  checkCanInviteToGroup({ user: createdByUser, group, surveyInfo })

  const surveyUuid = Survey.getUuid(surveyInfo)
  const alreadyHasRole = User.getAuthGroups(user).some((g) => AuthGroup.getSurveyUuid(g) === surveyUuid)
  if (alreadyHasRole) {
    throw new SystemError('appErrors:userHasRole')
  }
  if (User.isSystemAdmin(user)) {
    throw new SystemError('appErrors:userIsAdmin')
  }

  await UserManager.addUserToGroup({ user: createdByUser, surveyInfo, group, userToAdd: user })

  return {
    surveyId: Survey.getIdSurveyInfo(surveyInfo),
    surveyName: Survey.getName(surveyInfo),
    groupName: AuthGroup.getName(group),
    createdByUserUuid: User.getUuid(createdByUser),
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn test:integration -- userQrInviteServiceTest`

Expected: PASS, all 3 tests.

- [ ] **Step 6: Lint**

Run: `npx eslint --cache --fix server/modules/user/service/userQrInviteService.js test/integration/tests/userQrInviteServiceTest.js core/i18n/resources/en/appErrors.js`

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add server/modules/user/service/userQrInviteService.js test/integration/tests/userQrInviteServiceTest.js core/i18n/resources/en/appErrors.js
git commit -m "feat(user): add previewQrInvite and acceptQrInvite to userQrInviteService"
```

---

### Task 4: API routes + WebSocket notification

**Files:**
- Modify: `server/modules/user/api/userApi.js`
- Modify: `common/webSocket/webSocketEvents.js`

**Interfaces:**
- Consumes: `UserQrInviteService.{createQrInviteToken, previewQrInvite, acceptQrInvite}` (Tasks 2-3); `AuthMiddleware.{requireUserInvitePermission, requireLoggedInUser}` (`server/modules/auth/authApiMiddleware.js`); `WebSocketServer` from `@openforis/arena-server`.
- Produces: three HTTP routes — relied on by Task 6 (webapp client) and by the (separately planned) `arena-mobile` client:
  - `POST /api/survey/:surveyId/users/invite/qr` — body `{ groupUuid }` → `{ qrInviteToken: { token, dateExpiresAt } }`
  - `GET /api/survey/:surveyId/users/invite/qr/:token/preview` → `{ preview: { surveyName, groupName, invitedByName } }`
  - `POST /api/survey/:surveyId/users/invite/qr/accept` — body `{ token }` → `{ survey: { name } }`
  - New WebSocket event `WebSocketEvents.surveyInviteAccepted`, emitted to the token creator with `{ surveyId, userUuid, userName }`.

- [ ] **Step 1: Add the WebSocket event constant**

In `common/webSocket/webSocketEvents.js`, add to the `// User events` group (next to `userRoleUpdate`/`userRemovedFromSurvey`):

```js
  surveyInviteAccepted: 'surveyInviteAccepted',
```

- [ ] **Step 2: Add the imports**

In `server/modules/user/api/userApi.js`, extend the existing import block:

```js
import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType, WebSocketServer } from '@openforis/arena-server'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as UserQrInviteService from '../service/userQrInviteService'
```

(`ServiceRegistry`/`ServerServiceType` are already imported at the top of this file for the `UserExportService` — only add `WebSocketServer` to that existing `@openforis/arena-server` import if it's not already combined; otherwise add a separate line.)

- [ ] **Step 3: Add the three routes**

In `server/modules/user/api/userApi.js`, immediately after the existing `POST /survey/:surveyId/users/invite` route block (right before the `app.post('/user/request-access', ...)` route), add:

```js
  app.post('/survey/:surveyId/users/invite/qr', AuthMiddleware.requireUserInvitePermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)
      const { groupUuid } = Request.getBody(req)
      const user = Request.getUser(req)

      const qrInviteToken = await UserQrInviteService.createQrInviteToken({ user, surveyId, groupUuid })

      res.json({ qrInviteToken })
    } catch (error) {
      next(error)
    }
  })

  app.get(
    '/survey/:surveyId/users/invite/qr/:token/preview',
    AuthMiddleware.requireLoggedInUser,
    async (req, res, next) => {
      try {
        const { surveyId, token } = Request.getParams(req)

        const preview = await UserQrInviteService.previewQrInvite({ surveyId, token })

        res.json({ preview })
      } catch (error) {
        next(error)
      }
    }
  )

  app.post(
    '/survey/:surveyId/users/invite/qr/accept',
    AuthMiddleware.requireLoggedInUser,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)
        const { token } = Request.getBody(req)
        const user = Request.getUser(req)

        const result = await UserQrInviteService.acceptQrInvite({ user, surveyId, token })

        WebSocketServer.notifyUser(result.createdByUserUuid, WebSocketEvents.surveyInviteAccepted, {
          surveyId: result.surveyId,
          userUuid: User.getUuid(user),
          userName: User.getName(user),
        })

        res.json({ survey: { name: result.surveyName } })
      } catch (error) {
        next(error)
      }
    }
  )
```

`User` (for `User.getUuid`/`User.getName`) is already imported at the top of `userApi.js`; if it isn't, add `import * as User from '@core/user/user'`.

- [ ] **Step 4: Lint**

Run: `npx eslint --cache --fix server/modules/user/api/userApi.js common/webSocket/webSocketEvents.js`

Expected: no errors.

- [ ] **Step 5: Manual verification with a running server**

Run: `yarn watch`, log in as a survey admin in the browser, open the browser dev console, and run:

```js
fetch('/api/survey/<your-survey-id>/users/invite/qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ groupUuid: '<a-dataEditor-group-uuid-from-your-survey>' }),
}).then((r) => r.json()).then(console.log)
```

Expected: `{ qrInviteToken: { token: '<uuid>', dateExpiresAt: '<ISO date ~1h from now>' } }`. Then call the preview route with that token and confirm it returns survey/role/inviter names. There is no automated HTTP-level test harness in this repo for these routes (integration tests exercise the service layer directly, per Tasks 2-3) — this manual pass is the acceptance check for the routing/wiring itself.

- [ ] **Step 6: Commit**

```bash
git add server/modules/user/api/userApi.js common/webSocket/webSocketEvents.js
git commit -m "feat(user): add QR invite create/preview/accept API routes"
```

---

### Task 5: Cleanup scheduler

**Files:**
- Create: `server/system/schedulers/surveyInviteTokensCleanup.js`
- Modify: `server/system/appCluster.js`

**Interfaces:**
- Consumes: `ServerServiceType.surveyInviteToken` service's `deleteExpired()` (from `@openforis/arena-server`, per Task 5 of the `arena-server` plan).
- Produces: nothing consumed by later tasks — registers a daily job.

- [ ] **Step 1: Create the scheduler**

Create `server/system/schedulers/surveyInviteTokensCleanup.js`, copied from `server/system/schedulers/userTempAuthTokensCleanup.js` with the service swapped:

```js
import * as schedule from 'node-schedule'

import { ServiceRegistry } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import { ServerServiceType } from '@openforis/arena-server'

const Logger = Log.getLogger('SurveyInviteTokensCleanup')

const items = 'expired survey invite tokens'
const task = `deleting ${items}`

const deleteExpiredSurveyInviteTokens = async () => {
  try {
    Logger.debug(task)

    const serviceRegistry = ServiceRegistry.getInstance()
    const surveyInviteTokenService = serviceRegistry.getService(ServerServiceType.surveyInviteToken)
    const count = await surveyInviteTokenService.deleteExpired()
    Logger.debug(`${count} ${items} deleted`)
  } catch (error) {
    Logger.error(`Error ${task}: ${error.toString()}`)
  }
}

export const init = async () => {
  await deleteExpiredSurveyInviteTokens()

  Logger.debug('Schedule job to be executed every day at 01:00')
  schedule.scheduleJob('0 1 * * *', async () => deleteExpiredSurveyInviteTokens())
}
```

- [ ] **Step 2: Register it**

In `server/system/appCluster.js`, add the import (next to `UserTempAuthTokensCleanup`):

```js
import * as SurveyInviteTokensCleanup from './schedulers/surveyInviteTokensCleanup'
```

And, in the `// ====== Schedulers` block, add (next to `await UserTempAuthTokensCleanup.init()`):

```js
  await SurveyInviteTokensCleanup.init()
```

- [ ] **Step 3: Lint**

Run: `npx eslint --cache --fix server/system/schedulers/surveyInviteTokensCleanup.js server/system/appCluster.js`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add server/system/schedulers/surveyInviteTokensCleanup.js server/system/appCluster.js
git commit -m "feat(user): schedule daily cleanup of expired survey invite tokens"
```

---

### Task 6: Webapp API client method

**Files:**
- Modify: `webapp/service/api/user/index.js`
- Modify: `webapp/service/api/index.js:135-147`

**Interfaces:**
- Consumes: the `POST /api/survey/:surveyId/users/invite/qr` route (Task 4).
- Produces: `API.createSurveyInviteQrToken({ surveyId, groupUuid }): Promise<{ token: string, dateExpiresAt: string }>` — relied on by Task 7.

- [ ] **Step 1: Add the client method**

In `webapp/service/api/user/index.js`, add next to `createTempAuthToken`:

```js
export const createSurveyInviteQrToken = async ({ surveyId, groupUuid }) => {
  const {
    data: { qrInviteToken },
  } = await axios.post(`/api/survey/${surveyId}/users/invite/qr`, { groupUuid })

  return qrInviteToken
}
```

- [ ] **Step 2: Re-export it from the API barrel**

`webapp/service/api/index.js` re-exports each service module through an explicit named list, not `export *`. In the existing `./user` block (`webapp/service/api/index.js:135-147`), add `createSurveyInviteQrToken` next to `createTempAuthToken`:

```js
export {
  createAccessRequest,
  acceptAccessRequest,
  fetchSurveyUserResetPasswordUrl,
  fetchUser,
  fetchUserResetPasswordUrl,
  fetchUserName,
  fetchUsersBySurvey,
  fetchUserSurveys,
  fetchUsers,
  changeUserPassword,
  createTempAuthToken,
  createSurveyInviteQrToken,
} from './user'
```

- [ ] **Step 3: Lint**

Run: `npx eslint --cache --fix webapp/service/api/user/index.js webapp/service/api/index.js`

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/service/api/user/index.js webapp/service/api/index.js
git commit -m "feat(webapp): add createSurveyInviteQrToken API client method"
```

---

### Task 7: `UserInviteQrDialog` + entry point + i18n

**Files:**
- Create: `webapp/views/App/views/Users/UserInviteQr/UserInviteQrDialog.js`
- Create: `webapp/views/App/views/Users/UserInviteQr/UserInviteQrDialog.scss`
- Create: `webapp/views/App/views/Users/UserInviteQr/index.js`
- Modify: `webapp/views/App/views/Users/UsersListSurvey/HeaderLeft/HeaderLeft.js`
- Modify: `core/i18n/resources/en/usersView.js`

**Interfaces:**
- Consumes: `API.createSurveyInviteQrToken` (Task 6); `WebSocketEvents.surveyInviteAccepted` (Task 4); existing `DropdownUserRole`, `QRCode`, `Modal`/`ModalBody`/`ModalFooter`, `useOnWebSocketEvent`, `useSurveyId`.
- Produces: nothing consumed by later tasks — this is the last in-repo task.

- [ ] **Step 1: Add i18n keys**

In `core/i18n/resources/en/usersView.js`, add (next to the existing `inviteUser: 'Invite'` key):

```js
  inviteUserQr: 'Invite via QR code',
  inviteQr: {
    title: 'Invite via QR code',
    selectRole: 'Select the role to grant',
    instructions: `1. Open the **Arena Mobile** app on your device (must already be logged in)
2. Go to **Join survey via QR code**
3. Scan the QR code displayed on this screen`,
    error: 'Error generating QR code: {{error}}',
    userJoined: '{{userName}} joined',
  },
```

- [ ] **Step 2: Create the dialog component**

Create `webapp/views/App/views/Users/UserInviteQr/UserInviteQrDialog.js`:

```jsx
import './UserInviteQrDialog.scss'

import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import { Button, Markdown, Modal, ModalBody, ModalFooter, QRCode, Spinner } from '@webapp/components'
import { useOnWebSocketEvent } from '@webapp/components/hooks'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import DropdownUserRole from '../DropdownUserRole'

const tokenExpirationMs = 60 * 60 * 1000 // 1 hour, matches the server default

const initialState = {
  error: null,
  loading: false,
  groupUuid: null,
  qrValue: '',
  joinedUsers: [],
}

export const UserInviteQrDialog = (props) => {
  const { onClose } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()

  const [state, setState] = useState(initialState)
  const { error, loading, groupUuid, qrValue, joinedUsers } = state

  const fetchToken = useCallback(
    async (groupUuidToUse) => {
      setState((statePrev) => ({ ...statePrev, error: null, loading: true, qrValue: '' }))
      try {
        const qrInviteToken = await API.createSurveyInviteQrToken({ surveyId, groupUuid: groupUuidToUse })
        const serverUrl = globalThis.location.origin
        const qrData = JSON.stringify({ serverUrl, surveyId, token: qrInviteToken.token })
        setState((statePrev) => ({ ...statePrev, loading: false, qrValue: qrData }))
      } catch (caughtError) {
        const errorMessage = caughtError?.message || String(caughtError) || 'Unknown error'
        setState((statePrev) => ({ ...statePrev, loading: false, error: errorMessage }))
      }
    },
    [surveyId]
  )

  const onGroupChange = useCallback(
    (group) => {
      const groupUuidSelected = AuthGroup.getUuid(group)
      setState((statePrev) => ({ ...statePrev, groupUuid: groupUuidSelected, joinedUsers: [] }))
      fetchToken(groupUuidSelected)
    },
    [fetchToken]
  )

  // refresh the token shortly before it expires, so the QR code shown never goes stale
  useEffect(() => {
    if (!groupUuid) return undefined
    const interval = setInterval(() => fetchToken(groupUuid), tokenExpirationMs)
    return () => clearInterval(interval)
  }, [groupUuid, fetchToken])

  const onInviteAccepted = useCallback((event) => {
    const { userName } = event
    setState((statePrev) => ({ ...statePrev, joinedUsers: [...statePrev.joinedUsers, userName] }))
  }, [])

  useOnWebSocketEvent({ eventName: WebSocketEvents.surveyInviteAccepted, eventHandler: onInviteAccepted })

  return (
    <Modal className="user-invite-qr-dialog" onClose={onClose} showCloseButton title="usersView:inviteQr.title">
      <ModalBody>
        <DropdownUserRole groupUuid={groupUuid} onChange={onGroupChange} showOnlySurveyGroups />

        {(loading || qrValue) && (
          <div className="inner-container">
            <div className="qr-code-container">
              {loading && <Spinner />}
              {qrValue && <QRCode value={qrValue} size={200} />}
            </div>
            <Markdown className="instructions" source={i18n.t('usersView:inviteQr.instructions')} />
          </div>
        )}

        {error && <div className="error-message">{i18n.t('usersView:inviteQr.error', { error })}</div>}

        {joinedUsers.length > 0 && (
          <ul className="joined-users-list">
            {joinedUsers.map((userName, index) => (
              <li key={`${userName}-${index}`}>{i18n.t('usersView:inviteQr.userJoined', { userName })}</li>
            ))}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button className="btn modal-footer__item" onClick={onClose} label="common.close" />
      </ModalFooter>
    </Modal>
  )
}

UserInviteQrDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
}
```

- [ ] **Step 3: Add minimal styles**

Create `webapp/views/App/views/Users/UserInviteQr/UserInviteQrDialog.scss`, reusing the same `.inner-container`/`.qr-code-container` layout as `webapp/views/App/Header/QRCodeLoginDialog/QRCodeLoginDialog.scss`, plus the new joined-users list:

```scss
.user-invite-qr-dialog {
  .inner-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2rem;

    .qr-code-container {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 200px;
      height: 200px;
    }
  }

  .error-message {
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
  }

  .joined-users-list {
    margin-top: 1rem;
    padding-left: 1.2rem;
  }
}
```

- [ ] **Step 4: Barrel export**

Create `webapp/views/App/views/Users/UserInviteQr/index.js`:

```js
export { UserInviteQrDialog } from './UserInviteQrDialog'
```

- [ ] **Step 5: Wire up the entry point**

In `webapp/views/App/views/Users/UsersListSurvey/HeaderLeft/HeaderLeft.js`, replace the file with:

```jsx
import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { useI18n } from '@webapp/store/system'
import { useAuthCanInviteUser } from '@webapp/store/user'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { TestId } from '@webapp/utils/testId'

import { UserInviteQrDialog } from '../../UserInviteQr'

const HeaderLeft = () => {
  const i18n = useI18n()
  const canInvite = useAuthCanInviteUser()
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  const onOpenQrDialog = useCallback(() => setQrDialogOpen(true), [])
  const onCloseQrDialog = useCallback(() => setQrDialogOpen(false), [])

  return (
    <div>
      {canInvite && (
        <>
          <Link data-testid={TestId.userList.inviteBtn} to={appModuleUri(userModules.userInvite)} className="btn btn-s">
            <span className="icon icon-user-plus icon-12px icon-left" />
            {i18n.t('usersView:inviteUser')}
          </Link>
          <button type="button" className="btn btn-s" onClick={onOpenQrDialog}>
            <span className="icon icon-qrcode icon-12px icon-left" />
            {i18n.t('usersView:inviteUserQr')}
          </button>
          {qrDialogOpen && <UserInviteQrDialog onClose={onCloseQrDialog} />}
        </>
      )}
    </div>
  )
}

export default HeaderLeft
```

`icon-qrcode` is a real class in this project's icon font (`webapp/style/ico.scss`), consistent with `icon-user-plus` used by the existing Link.

- [ ] **Step 6: Lint**

Run: `npx eslint --cache --fix webapp/views/App/views/Users/UserInviteQr webapp/views/App/views/Users/UsersListSurvey/HeaderLeft/HeaderLeft.js core/i18n/resources/en/usersView.js`

Expected: no errors.

- [ ] **Step 7: Manual browser verification**

Run: `yarn watch`, log in as a survey admin, open a survey's Users page, click "Invite via QR code", select a role, confirm a QR code renders. Open the browser console and manually emit a fake WebSocket event (or, more realistically, complete Task 4's manual `fetch` accept call from a second logged-in browser/session using the same token) — confirm the "X joined" list updates live without closing the dialog.

- [ ] **Step 8: Commit**

```bash
git add webapp/views/App/views/Users/UserInviteQr webapp/views/App/views/Users/UsersListSurvey/HeaderLeft/HeaderLeft.js core/i18n/resources/en/usersView.js
git commit -m "feat(webapp): add Invite via QR code dialog"
```

---

### Task 8: End-to-end manual verification

**Files:** none modified — this task verifies Tasks 1-7 together.

- [ ] **Step 1: Run the full test suite**

Run: `yarn test:unit && yarn test:integration`

Expected: all tests pass, including the 3 new `userQrInviteServiceTest.js` tests.

- [ ] **Step 2: Full manual pass**

With `yarn watch` running and two different logged-in browser sessions (or one browser + the `fetch` calls from Task 4 Step 5 standing in for a second user):

1. As a survey admin, open "Invite via QR code", pick a `dataEditor` role.
2. As a second, different Arena user (not yet a member of that survey), call the preview route with the shown token, confirm survey/role/inviter names are correct, then call the accept route.
3. Confirm the admin's dialog shows the "joined" notification without a page reload.
4. Confirm the second user now has the `dataEditor` role on that survey (check via the Users list, or `SELECT * FROM auth_group_user WHERE user_uuid = ...`).
5. Repeat step 2 with a **third** distinct user and the **same** token (before it expires) — confirm it succeeds too, proving multi-use.
6. Wait past expiry (or manually set `date_expires_at` in the past for that token row) and confirm a further accept attempt fails with the "invalid or expired" error.

- [ ] **Step 3: Commit any fixes**

If Steps 1-2 surfaced defects, fix them and commit. If everything passed with no changes needed, there is nothing to commit — do not create an empty commit.

---

## Handoff to the `arena-mobile` repo

The mobile app's own plan (`arena-mobile`'s `docs/superpowers/plans/2026-07-31-survey-invite-via-qr-code-arena-mobile.md`, generated separately) implements the scan-and-confirm screen against the two endpoints this plan adds for it: `GET /api/survey/:surveyId/users/invite/qr/:token/preview` and `POST /api/survey/:surveyId/users/invite/qr/accept`.
