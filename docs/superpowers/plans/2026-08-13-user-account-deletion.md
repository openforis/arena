# Admin User-Account Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a system admin fully delete a user account (new `DELETE /user/:userUuid` endpoint), and have the survey-import stress test clean up its own throwaway accounts with it.

**Architecture:** A new `UserService.deleteUser` runs entirely inside one DB transaction: it rejects self-delete and last-admin-delete, blocks (409) if the target still owns any survey or authored any message, reassigns every record the target owns (across every survey they belong to) to the acting admin, then deletes the user row and lets the existing `ON DELETE CASCADE` foreign keys clean up the rest. The stress test's `httpApi.ts` gains a `deleteUser` client call and `createUser` starts returning the new user's uuid; `surveyImportStressTest.ts` collects those uuids and deletes them after survey cleanup, gated by the existing `--keep` flag.

**Tech Stack:** Node.js/Express (server), pg-promise (DB), TypeScript (`test/load/*.ts`, run via `node --experimental-strip-types`, tested with `node:test`).

## Global Constraints

- No webapp UI for this endpoint (out of scope — see spec).
- No change to `arena-server`'s DB migrations/FK behavior (separate repo/release; documented as a known trade-off, not fixed here).
- No notification email or websocket event on account deletion.
- No new stress-test CLI flag — user cleanup reuses the existing `--keep` flag.
- Reference spec: `docs/superpowers/specs/2026-08-13-user-account-deletion-design.md`.

---

### Task 1: `UserService.deleteUser` + `DELETE /user/:userUuid` endpoint

**Files:**
- Modify: `server/modules/survey/manager/surveyManager.js:221-229`
- Modify: `server/modules/user/service/userService.js:1-22` (imports), `:557-559` (new function)
- Modify: `server/modules/user/api/userApi.js:436-449`

**Interfaces:**
- Produces: `UserService.deleteUser({ user, userUuidToDelete }): Promise<object>` — `user` is the acting admin (from `Request.getUser(req)`), `userUuidToDelete` is a uuid string. Resolves with the deleted user row. Rejects with a `SystemError` (see error keys below) if blocked.
- Produces: `DELETE /user/:userUuid` HTTP route, system-admin only, `{ status: 'ok' }` (200) on success, JSON `{ status: 'error', key, params }` with the matching status code on failure (via the existing `Response.sendErr` error middleware — no new wiring needed there).
- Error keys used: `appErrors:userCannotDeleteSelf` (400), `appErrors:userNotFound` (404), `appErrors:userCannotDeleteLastSystemAdmin` (409), `appErrors:userCannotDeleteOwnsSurveys` (409, params `{ surveyNames }` — comma-joined string), `appErrors:userCannotDeleteHasMessages` (409, params `{ count }`).

- [ ] **Step 1: Add the `fetchUserSurveys` passthrough export to `surveyManager.js`**

`fetchUserSurveysInfo` (the only existing way to list a user's surveys) hardcodes `client = db` internally, so it can't run inside our transaction. `SurveyRepository.fetchUserSurveys` (the lower-level function it wraps) already accepts a `client` param — expose it directly.

In `server/modules/survey/manager/surveyManager.js`, find:

```js
// ====== READ
export const {
  countOwnedSurveys,
  countUserSurveys,
  fetchAllSurveyIds,
  fetchSurveysByName,
  fetchSurveyIdsAndNames,
  fetchDependencies,
  fetchFilesTotalSpace,
} = SurveyRepository
```

Replace with:

```js
// ====== READ
export const {
  countOwnedSurveys,
  countUserSurveys,
  fetchAllSurveyIds,
  fetchSurveysByName,
  fetchSurveyIdsAndNames,
  fetchDependencies,
  fetchFilesTotalSpace,
  fetchUserSurveys,
} = SurveyRepository
```

- [ ] **Step 2: Update `userService.js` imports**

In `server/modules/user/service/userService.js`, find:

```js
import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'
```

Replace with:

```js
import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'
```

Then find:

```js
import SystemError from '@core/systemError'
```

Replace with:

```js
import SystemError, { StatusCodes } from '@core/systemError'
```

- [ ] **Step 3: Add `UserService.deleteUser`**

In `server/modules/user/service/userService.js`, `deleteUserFromSurvey` currently ends at line 557 (the closing `}` right before the blank line and `export const deleteExpiredInvitationsUsersAndSurveys = ...`). Insert the new function between them:

```js
export const deleteUser = async ({ user, userUuidToDelete }) =>
  db.tx(async (t) => {
    if (User.getUuid(user) === userUuidToDelete) {
      throw new SystemError('appErrors:userCannotDeleteSelf', {}, StatusCodes.BAD_REQUEST)
    }

    const userToDelete = await UserManager.fetchUserByUuid(userUuidToDelete, t)
    if (!userToDelete) {
      throw new SystemError('appErrors:userNotFound', { userUuid: userUuidToDelete }, StatusCodes.NOT_FOUND)
    }

    if (User.isSystemAdmin(userToDelete)) {
      const adminsCount = await UserManager.countSystemAdministrators(t)
      if (adminsCount <= 1) {
        throw new SystemError('appErrors:userCannotDeleteLastSystemAdmin', {}, StatusCodes.CONFLICT)
      }
    }

    // Surveys the target owns block deletion at the DB level (survey.owner_uuid has no ON DELETE
    // action). Blocked, not auto-reassigned: transferring survey ownership is too significant to do
    // silently as a side effect of deleting an account.
    const ownedSurveys = await SurveyManager.fetchUserSurveys({ user: userToDelete, onlyOwn: true, draft: true }, t)
    if (ownedSurveys.length > 0) {
      const surveyNames = ownedSurveys.map((survey) => Survey.getName(Survey.getSurveyInfo(survey))).join(', ')
      throw new SystemError('appErrors:userCannotDeleteOwnsSurveys', { surveyNames }, StatusCodes.CONFLICT)
    }

    // Messages the target authored block deletion the same way (message.created_by_user_uuid has no
    // ON DELETE action). MessageService has no by-author query, so fetch all and filter.
    const messageService = ServiceRegistry.getInstance().getService(ServerServiceType.message)
    const messages = await messageService.getAll(t)
    const ownMessagesCount = messages.filter((message) => message.createdByUserUuid === userUuidToDelete).length
    if (ownMessagesCount > 0) {
      throw new SystemError('appErrors:userCannotDeleteHasMessages', { count: ownMessagesCount }, StatusCodes.CONFLICT)
    }

    // Records the target owns (record.owner_uuid) also block deletion, and can't be nulled out
    // (NOT NULL) -- reassign them to the acting admin, across every survey the target belongs to.
    // A no-op for surveys where they own no records, so safe to call unconditionally.
    const memberSurveys = await SurveyManager.fetchUserSurveys({ user: userToDelete, draft: true }, t)
    for (const survey of memberSurveys) {
      const surveyId = Survey.getId(survey)
      await RecordManager.updateRecordsOwner(
        { surveyId, fromOwnerUuid: userUuidToDelete, toOwnerUuid: User.getUuid(user) },
        t
      )
    }

    // Everything else (sessions, tokens, 2FA, group membership, activity log, invitations this user
    // sent/received, access requests they processed) is cleaned up by the existing ON DELETE CASCADE
    // foreign keys in arena-server's schema -- see the spec's "Cascade side effects" section.
    return UserManager.deleteUser(userUuidToDelete, t)
  })
```

- [ ] **Step 4: Add the `DELETE /user/:userUuid` route**

In `server/modules/user/api/userApi.js`, the `==== DELETE` section currently ends with:

```js
  // ==== DELETE
  app.delete('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserRemovePermission, async (req, res, next) => {
    try {
      const { surveyId, userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUserFromSurvey({ user, userUuidToRemove: userUuid, surveyId })

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
```

Insert a new route before the closing `}` of `init`:

```js
  // ==== DELETE
  app.delete('/survey/:surveyId/user/:userUuid', AuthMiddleware.requireUserRemovePermission, async (req, res, next) => {
    try {
      const { surveyId, userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUserFromSurvey({ user, userUuidToRemove: userUuid, surveyId })

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/user/:userUuid', AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const { userUuid } = Request.getParams(req)
      const user = Request.getUser(req)

      await UserService.deleteUser({ user, userUuidToDelete: userUuid })

      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
```

`AuthMiddleware.requireAdminPermission` already exists (`server/modules/auth/authApiMiddleware.js:14`, from `@openforis/arena-server`'s `ApiAuthMiddleware`, already used by the `message` API for the same system-admin-only gate) — no change needed there.

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint --cache --fix server/modules/survey/manager/surveyManager.js server/modules/user/service/userService.js server/modules/user/api/userApi.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add server/modules/survey/manager/surveyManager.js server/modules/user/service/userService.js server/modules/user/api/userApi.js
git commit -m "$(cat <<'EOF'
Add admin user-account deletion endpoint

DELETE /user/:userUuid (system-admin only) reassigns the target's
records to the acting admin, blocks on owned surveys/messages
(both a hard DB constraint), and rejects self-delete and deleting
the last system admin.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

This task's correctness is verified end-to-end in Task 4 (no DB is available for a fast unit-test cycle here — see the spec's "Verification plan").

---

### Task 2: Stress test — `httpApi.ts` client functions

**Files:**
- Modify: `test/load/lib/httpApi.ts`
- Modify: `test/load/lib/httpApi.test.ts`

**Interfaces:**
- Consumes: nothing new from Task 1 beyond the HTTP contract (`POST /api/user` now matters because we read `body.user.uuid`; `DELETE /api/user/:userUuid` is the new endpoint from Task 1).
- Produces: `createUser(...): Promise<string>` (was `Promise<void>`) — resolves the created user's uuid. `deleteUser({ baseUrl, authToken, userUuid, fetchImpl? }): Promise<void>` — new.

- [ ] **Step 1: Write the failing tests**

In `test/load/lib/httpApi.test.ts`, update the import line:

```ts
import {
  login,
  buildImportFormData,
  importSurveyZip,
  getJobStatus,
  deleteSurvey,
  fetchSurveysByNamePrefix,
  createUser,
  deleteUser,
  LOGIN_RATE_LIMIT_MAX_RETRIES,
  LOGIN_RATE_LIMIT_DEFAULT_RETRY_MS,
  LOGIN_RATE_LIMIT_MAX_RETRY_MS,
} from './httpApi.ts'
```

Replace the existing `createUser resolves when the response is ok and has no validation field` test with:

```ts
test('createUser resolves the created user uuid when the response is ok', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return jsonResponse({ user: { uuid: 'user-uuid-1' } })
  }

  const userUuid = await createUser({
    baseUrl: 'http://x',
    authToken: 'tok',
    name: 'n',
    email: 'a@b.com',
    password: 'pw',
    fetchImpl,
  })

  assert.equal(userUuid, 'user-uuid-1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok')
})

test('createUser throws when the response has no user uuid', async () => {
  const fetchImpl = async () => jsonResponse({ user: {} })

  await assert.rejects(
    () => createUser({ baseUrl: 'http://x', authToken: 'tok', name: 'n', email: 'a@b.com', password: 'pw', fetchImpl }),
    /Create user a@b\.com failed: response had no user uuid/
  )
})
```

Append two new tests at the end of the file:

```ts
test('deleteUser resolves on a successful delete', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return new Response(null, { status: 200 })
  }

  await deleteUser({ baseUrl: 'http://x', authToken: 'tok', userUuid: 'user-uuid-1', fetchImpl })

  assert.equal(calls[0].url, 'http://x/api/user/user-uuid-1')
  assert.equal(calls[0].options.method, 'DELETE')
  assert.equal(calls[0].options.headers.Authorization, 'Bearer tok')
})

test('deleteUser throws with status and body detail on a failed delete', async () => {
  const fetchImpl = async () => jsonResponse({ key: 'appErrors:userCannotDeleteOwnsSurveys' }, 409)

  await assert.rejects(
    () => deleteUser({ baseUrl: 'http://x', authToken: 'tok', userUuid: 'user-uuid-1', fetchImpl }),
    /Delete user user-uuid-1 failed \(status 409\).*userCannotDeleteOwnsSurveys/
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --experimental-strip-types --test test/load/lib/httpApi.test.ts`
Expected: FAIL — `deleteUser` is not exported yet, and `createUser` still resolves `undefined`/doesn't validate the uuid, so the new/updated assertions fail (or the import itself throws `SyntaxError: The requested module './httpApi.ts' does not provide an export named 'deleteUser'`).

- [ ] **Step 3: Implement the changes in `httpApi.ts`**

Replace `createUser`'s body (keep the signature line and JSDoc, change only the return type and the tail):

Find:

```ts
/**
 * Creates a new user account. The caller must be a system admin.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token of a system admin user.
 * @param params.name - Full name for the new user.
 * @param params.email - Email address for the new user (must be unique).
 * @param params.password - Password for the new user.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns Resolves when the user has been created.
 */
export const createUser = async ({
  baseUrl,
  authToken,
  name,
  email,
  password,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  name: string
  email: string
  password: string
  fetchImpl?: FetchImpl
}): Promise<void> => {
  const response = await fetchImpl(`${baseUrl}/api/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: JSON.stringify({ name, email, password, props: { title: 'preferNotToSay' } }),
    }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Create user ${email} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (body.validation) {
    throw new Error(`Create user ${email} failed validation: ${JSON.stringify(body.validation)}`)
  }
}
```

Replace with:

```ts
/**
 * Creates a new user account. The caller must be a system admin.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token of a system admin user.
 * @param params.name - Full name for the new user.
 * @param params.email - Email address for the new user (must be unique).
 * @param params.password - Password for the new user.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns The created user's uuid.
 */
export const createUser = async ({
  baseUrl,
  authToken,
  name,
  email,
  password,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  name: string
  email: string
  password: string
  fetchImpl?: FetchImpl
}): Promise<string> => {
  const response = await fetchImpl(`${baseUrl}/api/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: JSON.stringify({ name, email, password, props: { title: 'preferNotToSay' } }),
    }),
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Create user ${email} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
  const body = await response.json()
  if (body.validation) {
    throw new Error(`Create user ${email} failed validation: ${JSON.stringify(body.validation)}`)
  }
  if (!body.user?.uuid) {
    throw new Error(`Create user ${email} failed: response had no user uuid`)
  }
  return body.user.uuid
}

/**
 * Deletes a user account. The caller must be a system admin.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token of a system admin user.
 * @param params.userUuid - UUID of the user to delete.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns Resolves when the user has been deleted.
 */
export const deleteUser = async ({
  baseUrl,
  authToken,
  userUuid,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  userUuid: string
  fetchImpl?: FetchImpl
}): Promise<void> => {
  const response = await fetchImpl(`${baseUrl}/api/user/${userUuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  if (!response.ok) {
    const body = await readBody(response)
    throw new Error(`Delete user ${userUuid} failed (status ${response.status}): ${JSON.stringify(body)}`)
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --experimental-strip-types --test test/load/lib/httpApi.test.ts`
Expected: PASS, all tests including the two new/updated ones.

- [ ] **Step 5: Commit**

```bash
git add test/load/lib/httpApi.ts test/load/lib/httpApi.test.ts
git commit -m "$(cat <<'EOF'
Have createUser return the new user's uuid; add deleteUser

Needed so the stress test can clean up the throwaway accounts it
provisions, via the new DELETE /api/user/:userUuid endpoint.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Stress test — collect and delete created users

**Files:**
- Modify: `test/load/lib/report.ts`
- Modify: `test/load/surveyImportStressTest.ts`
- Modify: `test/load/surveyImportStressTest.test.ts`
- Modify: `test/load/lib/config.ts`
- Modify: `test/load/README.md`

**Interfaces:**
- Consumes: `createUser` (now `Promise<string>`) and `deleteUser` from Task 2's `httpApi.ts`.
- Produces: `ResultEntry.userUuid?: string | null` (new optional field). `runSingleUserImport`'s result always carries the created user's uuid when creation succeeded, even if a later step (login, import) fails. `cleanupUsers({ baseUrl, authToken, userUuids, fetchImpl? }): Promise<{ deletedCount: number; totalCount: number }>` — new, mirrors `cleanupSurveys`.

- [ ] **Step 1: Add the `userUuid` field to `ResultEntry`**

In `test/load/lib/report.ts`, find:

```ts
export interface ResultEntry {
  index: number
  name: string
  outcome: Outcome
  surveyId: number | null
  acceptMs: number | null
  jobMs: number | null
  error: string | null
}
```

Replace with:

```ts
export interface ResultEntry {
  index: number
  name: string
  outcome: Outcome
  surveyId: number | null
  userUuid?: string | null
  acceptMs: number | null
  jobMs: number | null
  error: string | null
}
```

- [ ] **Step 2: Write the failing tests**

In `test/load/surveyImportStressTest.test.ts`, update the import line:

```ts
import {
  runSingleImport,
  runSingleUserImport,
  pollJobUntilTerminal,
  cleanupSurveys,
  cleanupUsers,
} from './surveyImportStressTest.ts'
```

Replace the `runSingleUserImport creates the user, logs in as them, then imports` test's mocked create-user response and add a `userUuid` assertion — find:

```ts
test('runSingleUserImport creates the user, logs in as them, then imports', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const responses = [
    jsonResponse({ user: { id: 1 } }), // POST /api/user
    jsonResponse({ authToken: 'user-tok' }), // POST /auth/login (as the new user)
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 55 }), // poll (terminal, this server response does include surveyId)
  ]
  let call = 0
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return responses[call++]
  }

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 1', email: 'stress_test_1_0@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_0',
    index: 0,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 55)
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal((calls[0].options.headers as any).Authorization, 'Bearer admin-tok')
  assert.equal(calls[1].url, 'http://x/auth/login')
  assert.equal((calls[2].options.headers as any).Authorization, 'Bearer user-tok')
})
```

Replace with:

```ts
test('runSingleUserImport creates the user, logs in as them, then imports', async () => {
  const calls: Array<{ url: string; options: any }> = []
  const responses = [
    jsonResponse({ user: { uuid: 'user-uuid-1' } }), // POST /api/user
    jsonResponse({ authToken: 'user-tok' }), // POST /auth/login (as the new user)
    jsonResponse({ job: { uuid: 'job-1', status: 'pending' } }), // import accept
    jsonResponse({ uuid: 'job-1', status: 'succeeded', surveyId: 55 }), // poll (terminal, this server response does include surveyId)
  ]
  let call = 0
  const fetchImpl = async (url: string, options?: RequestInit) => {
    calls.push({ url, options })
    return responses[call++]
  }

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 1', email: 'stress_test_1_0@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_0',
    index: 0,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'succeeded')
  assert.equal(result.surveyId, 55)
  assert.equal(result.userUuid, 'user-uuid-1')
  assert.equal(calls[0].url, 'http://x/api/user')
  assert.equal((calls[0].options.headers as any).Authorization, 'Bearer admin-tok')
  assert.equal(calls[1].url, 'http://x/auth/login')
  assert.equal((calls[2].options.headers as any).Authorization, 'Bearer user-tok')
})
```

Find the failure-path test right after it:

```ts
test('runSingleUserImport returns rejected-at-http when user creation fails, without attempting login or import', async () => {
  const fetchImpl = async () => new Response('quota exceeded', { status: 403 })

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 2', email: 'stress_test_1_1@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_1',
    index: 1,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.match(result.error as string, /user setup failed/)
  // acceptMs measures only the import POST's latency elsewhere; a setup failure never got that far, so it
  // must report null (not user-creation+login time) to avoid distorting the report's accept-latency stat.
  assert.equal(result.acceptMs, null)
})
```

Add `assert.equal(result.userUuid, null)` to it, and append two new tests right after (still inside the same file, before the `cleanupSurveys` tests further down):

```ts
test('runSingleUserImport returns rejected-at-http when user creation fails, without attempting login or import', async () => {
  const fetchImpl = async () => new Response('quota exceeded', { status: 403 })

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 2', email: 'stress_test_1_1@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_1',
    index: 1,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.match(result.error as string, /user setup failed/)
  // acceptMs measures only the import POST's latency elsewhere; a setup failure never got that far, so it
  // must report null (not user-creation+login time) to avoid distorting the report's accept-latency stat.
  assert.equal(result.acceptMs, null)
  assert.equal(result.userUuid, null)
})

test('runSingleUserImport still reports the created userUuid when login fails after user creation succeeds', async () => {
  // Regression coverage: the account already exists on the server at this point and must still be
  // reported for cleanup, even though the overall result is a failure.
  const responses = [
    jsonResponse({ user: { uuid: 'user-uuid-3' } }), // POST /api/user succeeds
    new Response('locked out', { status: 423 }), // POST /auth/login fails
  ]
  let call = 0
  const fetchImpl = async () => responses[call++]

  const result = await runSingleUserImport({
    baseUrl: 'http://x',
    adminAuthToken: 'admin-tok',
    credentials: { name: 'Load Test User 3', email: 'stress_test_1_2@loadtest.local', password: 'LoadTestUser1Aa!' },
    zipBuffer: Buffer.from('x'),
    zipFileName: 'x.zip',
    surveyName: 'stress_test_1_2',
    index: 2,
    jobTimeoutMs: 5000,
    fetchImpl,
  })

  assert.equal(result.outcome, 'rejected-at-http')
  assert.equal(result.userUuid, 'user-uuid-3')
})
```

Append at the very end of the file (after the last existing test):

```ts
test('cleanupUsers deletes every user it is given, tolerating individual failures', async () => {
  const calls: string[] = []
  const fetchImpl = async (url: string) => {
    calls.push(url)
    if (url.endsWith('/api/user/user-2')) {
      return new Response('cannot delete', { status: 409 })
    }
    return new Response(null, { status: 200 })
  }

  const summary = await cleanupUsers({
    baseUrl: 'http://x',
    authToken: 'tok',
    userUuids: ['user-1', 'user-2', 'user-3'],
    fetchImpl,
  })

  assert.equal(summary.totalCount, 3)
  assert.equal(summary.deletedCount, 2)
  assert.equal(calls.length, 3)
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --experimental-strip-types --test test/load/surveyImportStressTest.test.ts`
Expected: FAIL — `cleanupUsers` isn't exported yet; `result.userUuid` assertions fail against the current implementation.

- [ ] **Step 4: Implement `runSingleUserImport`'s uuid capture and `cleanupUsers`**

In `test/load/surveyImportStressTest.ts`, update the import line:

```ts
import {
  login,
  importSurveyZip,
  getJobStatus,
  deleteSurvey,
  fetchSurveysByNamePrefix,
  createUser,
  deleteUser,
  type FetchImpl,
  type Job,
} from './lib/httpApi.ts'
```

Find `runSingleUserImport`'s body:

```ts
export const runSingleUserImport = async ({
  baseUrl,
  adminAuthToken,
  credentials,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}: {
  baseUrl: string
  adminAuthToken: string
  credentials: UserCredentials
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
  index: number
  jobTimeoutMs: number
  fetchImpl?: FetchImpl
}): Promise<ResultEntry> => {
  let userAuthToken: string
  try {
    await createUser({ baseUrl, authToken: adminAuthToken, ...credentials, fetchImpl })
    userAuthToken = await login({ baseUrl, email: credentials.email, password: credentials.password, fetchImpl })
  } catch (error: any) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      acceptMs: null,
      jobMs: null,
      error: `user setup failed: ${error.message}`,
    }
  }

  return runSingleImport({
    baseUrl,
    authToken: userAuthToken,
    zipBuffer,
    zipFileName,
    surveyName,
    index,
    jobTimeoutMs,
    fetchImpl,
  })
}
```

Replace with:

```ts
export const runSingleUserImport = async ({
  baseUrl,
  adminAuthToken,
  credentials,
  zipBuffer,
  zipFileName,
  surveyName,
  index,
  jobTimeoutMs,
  fetchImpl = fetch,
}: {
  baseUrl: string
  adminAuthToken: string
  credentials: UserCredentials
  zipBuffer: Buffer
  zipFileName: string
  surveyName: string
  index: number
  jobTimeoutMs: number
  fetchImpl?: FetchImpl
}): Promise<ResultEntry> => {
  // Captured as soon as creation succeeds (not just on overall success) so a later failure (e.g. login)
  // still reports the uuid -- the account already exists on the server and needs cleanup either way.
  let userUuid: string | null = null
  let userAuthToken: string
  try {
    userUuid = await createUser({ baseUrl, authToken: adminAuthToken, ...credentials, fetchImpl })
    userAuthToken = await login({ baseUrl, email: credentials.email, password: credentials.password, fetchImpl })
  } catch (error: any) {
    return {
      index,
      name: surveyName,
      outcome: 'rejected-at-http',
      surveyId: null,
      userUuid,
      acceptMs: null,
      jobMs: null,
      error: `user setup failed: ${error.message}`,
    }
  }

  const result = await runSingleImport({
    baseUrl,
    authToken: userAuthToken,
    zipBuffer,
    zipFileName,
    surveyName,
    index,
    jobTimeoutMs,
    fetchImpl,
  })
  return { ...result, userUuid }
}
```

Add `cleanupUsers` right after `cleanupSurveys` (before the `main` function's doc comment):

```ts
/**
 * Deletes every user account created by this run, sequentially and best-effort. A user whose survey
 * failed to clean up earlier in the same run is expected to fail here too -- the server blocks deleting a
 * user who still owns a survey -- so that failure is logged, not swallowed, since it signals the earlier
 * survey cleanup didn't fully succeed.
 * @param params - Function parameters.
 * @param params.baseUrl - Arena server base URL.
 * @param params.authToken - JWT auth token (a system admin token can delete any user).
 * @param params.userUuids - UUIDs of the users to delete.
 * @param [params.fetchImpl] - Fetch implementation to use (defaults to the global fetch).
 * @returns How many users were actually deleted.
 */
export const cleanupUsers = async ({
  baseUrl,
  authToken,
  userUuids,
  fetchImpl = fetch,
}: {
  baseUrl: string
  authToken: string
  userUuids: string[]
  fetchImpl?: FetchImpl
}): Promise<{ deletedCount: number; totalCount: number }> => {
  let deletedCount = 0
  for (const userUuid of userUuids) {
    try {
      await deleteUser({ baseUrl, authToken, userUuid, fetchImpl })
      deletedCount += 1
    } catch (error: any) {
      console.error(`Failed to delete user ${userUuid}: ${error.message}`)
    }
  }
  return { deletedCount, totalCount: userUuids.length }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --experimental-strip-types --test test/load/surveyImportStressTest.test.ts`
Expected: PASS, all tests.

- [ ] **Step 6: Wire user cleanup into `main()`**

In `test/load/surveyImportStressTest.ts`, find:

```ts
  if (!keep) {
    console.log('Cleaning up created surveys...')
    const { deletedCount, totalCount } = await cleanupSurveys({
      baseUrl: url,
      authToken: adminAuthToken,
      namePrefix: `stress_test_${runId}_`,
    })
    console.log(`Deleted ${deletedCount}/${totalCount} surveys created by this run.`)
  } else {
    console.log('Skipping survey cleanup (--keep passed); created surveys were left in place.')
  }
  console.log(
    'Note: the throwaway user accounts created by this run (stress_test_*@loadtest.local) cannot be deleted via the API and remain in the database.'
  )
```

Replace with:

```ts
  if (!keep) {
    console.log('Cleaning up created surveys...')
    const { deletedCount: deletedSurveysCount, totalCount: totalSurveysCount } = await cleanupSurveys({
      baseUrl: url,
      authToken: adminAuthToken,
      namePrefix: `stress_test_${runId}_`,
    })
    console.log(`Deleted ${deletedSurveysCount}/${totalSurveysCount} surveys created by this run.`)

    console.log('Cleaning up created users...')
    const userUuids = results
      .map((result) => result.userUuid)
      .filter((userUuid): userUuid is string => Boolean(userUuid))
    const { deletedCount: deletedUsersCount, totalCount: totalUsersCount } = await cleanupUsers({
      baseUrl: url,
      authToken: adminAuthToken,
      userUuids,
    })
    console.log(`Deleted ${deletedUsersCount}/${totalUsersCount} users created by this run.`)
  } else {
    console.log('Skipping survey and user cleanup (--keep passed); created surveys and users were left in place.')
  }
```

- [ ] **Step 7: Update `config.ts`'s help text**

In `test/load/lib/config.ts`, find:

```ts
  --keep                Do not delete the surveys created by this run
  --help                Show this help message

Notes:
  The server processes survey-creation/import jobs one at a time, globally,
  regardless of --count. This tool produces burst request concurrency, not
  concurrent execution; expect long runs and 'timed-out' outcomes at high
  --count. The throwaway user accounts this tool creates cannot be deleted
  via the API and accumulate in the database across runs (see test/load/README.md).
`
```

Replace with:

```ts
  --keep                Do not delete the surveys and users created by this run
  --help                Show this help message

Notes:
  The server processes survey-creation/import jobs one at a time, globally,
  regardless of --count. This tool produces burst request concurrency, not
  concurrent execution; expect long runs and 'timed-out' outcomes at high
  --count. Surveys and throwaway user accounts created by this run are
  deleted afterward unless --keep is passed.
`
```

- [ ] **Step 8: Update `test/load/README.md`**

Find (from `**Throwaway user accounts are permanent.**` through the end of the file):

```markdown
**Throwaway user accounts are permanent.** Each run provisions `--count`
new user accounts (`stress_test_<runId>_<i>@loadtest.local`, granted
`surveyManager` privileges, random per-run password) to import through, one
account per request, so the burst isn't serialized by the server's
one-job-per-user rule. There is no API to delete a user account, so these
accumulate in the database across runs. Created *surveys* are cleaned up
automatically after each run (unless `--keep` is passed); user accounts are
not.

This doesn't apply to the CI run: the Postgres service container backing
each `test.js.yml` job is destroyed at the end of the run, so leftover
`stress_test_*@loadtest.local` rows never persist.

To remove them manually, run against the Arena database:

```sql
DELETE FROM "user" WHERE email LIKE 'stress_test_%@loadtest.local';
```

Their `auth_group_user` rows are removed automatically by this — the FK has
`ON DELETE CASCADE` on the `user` table (see
`20181130124534-create-auth-tables-up.sql` in `@openforis/arena-server`) —
but double-check that's still the case if you're running against an older
schema version, and delete the matching `auth_group_user` rows by hand if
not.
```

Replace with:

```markdown
**Throwaway user accounts are cleaned up automatically.** Each run
provisions `--count` new user accounts (`stress_test_<runId>_<i>@loadtest.local`,
granted `surveyManager` privileges, random per-run password) to import
through, one account per request, so the burst isn't serialized by the
server's one-job-per-user rule. Both the surveys and the user accounts
created by a run are deleted afterward (unless `--keep` is passed), via
`DELETE /api/survey/:id` and `DELETE /api/user/:userUuid` respectively.

A user whose survey failed to clean up earlier in the same run will also
fail to delete -- the server blocks deleting a user who still owns a survey
-- and that's logged as a per-user cleanup failure, not swallowed, since
it's a signal the survey cleanup didn't fully succeed.
```

- [ ] **Step 9: Commit**

```bash
git add test/load/lib/report.ts test/load/surveyImportStressTest.ts test/load/surveyImportStressTest.test.ts test/load/lib/config.ts test/load/README.md
git commit -m "$(cat <<'EOF'
Delete the stress test's throwaway users after each run

createUser's uuid is now captured as soon as creation succeeds (not
just on overall success) and carried through to the run's results,
so cleanupUsers can delete every account the run created, mirroring
the existing survey cleanup and gated by the same --keep flag.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: End-to-end verification against a real local server

**Files:**
- Create (scratchpad, not committed): a temporary Node verification script.

**Interfaces:**
- Consumes: `DELETE /user/:userUuid` from Task 1, the full stress test CLI from Tasks 2–3.
- Produces: nothing new — this task only verifies Tasks 1–3 actually work against a real Postgres instance, since none of the earlier steps could exercise the DB.

- [ ] **Step 1: Confirm the local DB is up**

Run: `docker ps --filter name=arena-db --format '{{.Names}}: {{.Status}}'`
Expected: a line showing the `arena-db` container `Up`.

If it's not running, start it however this repo's local dev setup normally does (e.g. `docker start arena-db`), then re-check.

- [ ] **Step 2: Build and start the dev server in the background**

Run (background): `yarn dev:server`

Wait for it to accept connections:

```bash
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:9090/auth/login || echo 000)
  if [ "$code" != "000" ]; then echo "server is up (got HTTP $code)"; break; fi
  sleep 2
done
```

Expected: "server is up" printed within ~2 minutes (first build is the slow part).

- [ ] **Step 3: Write the verification script**

Create `/tmp/claude-1000/-home-stefano-dev-projects-openforis-arena/9c49bbd5-c4c1-4b8f-8c52-ad4228033ad5/scratchpad/verifyDeleteUser.mjs` (adjust to the actual scratchpad path in use) with:

```js
const BASE_URL = 'http://localhost:9090'
const ADMIN_EMAIL = 'test@openforis-arena.org'
const ADMIN_PASSWORD = 'Test_123'

let failures = 0
const check = (label, condition) => {
  if (condition) {
    console.log(`OK   ${label}`)
  } else {
    console.error(`FAIL ${label}`)
    failures += 1
  }
}

const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`login failed: ${res.status} ${JSON.stringify(body)}`)
  return body.authToken
}

const createUser = async (authToken, { name, email, password }) => {
  const res = await fetch(`${BASE_URL}/api/user`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: JSON.stringify({ name, email, password, props: { title: 'preferNotToSay' } }) }),
  })
  const body = await res.json()
  if (!res.ok || !body.user?.uuid) throw new Error(`createUser failed: ${res.status} ${JSON.stringify(body)}`)
  return body.user.uuid
}

const deleteUserRequest = async (authToken, userUuid) => {
  const res = await fetch(`${BASE_URL}/api/user/${userUuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

const createMessage = async (authToken, createdByUserUuid) => {
  const res = await fetch(`${BASE_URL}/api/message`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ createdByUserUuid, props: {} }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`createMessage failed: ${res.status} ${JSON.stringify(body)}`)
  return body.uuid
}

const run = async () => {
  const runId = Date.now()
  const adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('logged in as admin')

  // 1) not-found: deleting a nonexistent uuid returns 404
  const notFound = await deleteUserRequest(adminToken, '00000000-0000-0000-0000-000000000000')
  check('unknown uuid -> 404', notFound.status === 404)

  // 2) success path: create a throwaway user, delete it, confirm it's gone
  const uuidA = await createUser(adminToken, {
    name: 'Delete Verify A',
    email: `delete_verify_a_${runId}@loadtest.local`,
    password: 'Test_1234',
  })
  const deleteA = await deleteUserRequest(adminToken, uuidA)
  check('plain user delete -> 200', deleteA.status === 200)

  // 3) owns-messages: create a throwaway user, attribute a message to them, deletion must be blocked
  const uuidB = await createUser(adminToken, {
    name: 'Delete Verify B',
    email: `delete_verify_b_${runId}@loadtest.local`,
    password: 'Test_1234',
  })
  const messageUuid = await createMessage(adminToken, uuidB)
  const blockedByMessage = await deleteUserRequest(adminToken, uuidB)
  check(
    'user who authored a message -> 409 userCannotDeleteHasMessages',
    blockedByMessage.status === 409 && blockedByMessage.body.key === 'appErrors:userCannotDeleteHasMessages'
  )
  const deleteMessageRes = await fetch(`${BASE_URL}/api/message/${messageUuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (!deleteMessageRes.ok) throw new Error(`cleanup: deleting message ${messageUuid} failed`)
  const deleteBAfterMessageGone = await deleteUserRequest(adminToken, uuidB)
  check('same user, after message removed -> 200', deleteBAfterMessageGone.status === 200)

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`)
  process.exitCode = failures === 0 ? 0 : 1
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
```

Note what this script deliberately does **not** cover, and why:

- **Self-delete rejection** and **owns-surveys rejection**: exercised in Steps 4–5 below instead (self-delete needs the admin's own uuid; owns-surveys is easiest to trigger via the stress test tool itself, which Task 3 just built).
- **Last-system-admin rejection**: not exercised live. The only system admin on this local DB is the one every other check in this task depends on (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — actually deleting it would break the rest of the verification and any other local dev work. This guard is the same `countSystemAdministrators` pattern already relied on by `insertSystemAdminUserIfNotExisting` elsewhere in this codebase; verify it by reading `UserService.deleteUser`'s Step 3 code (Task 1) rather than by running it.

- [ ] **Step 4: Run the verification script**

Run: `node /tmp/claude-1000/-home-stefano-dev-projects-openforis-arena/9c49bbd5-c4c1-4b8f-8c52-ad4228033ad5/scratchpad/verifyDeleteUser.mjs` (use the actual scratchpad path)
Expected: `All checks passed.`, exit code 0. If any `FAIL` line prints, stop and fix the corresponding code in Task 1 before continuing.

If the status codes come back right (400/404/409) but `body.key` is missing or generic (e.g. `appErrors.generic`) instead of the specific key: `@openforis/arena-server`'s global error middleware (`ArenaServer.init`, registered in `server/system/appCluster.js` *before* this repo's own `/api` routes are mounted) recognizes its own internal `ServerError` class, not this repo's `@core/systemError` `SystemError`. This would affect every existing `next(error)`-based route in this codebase identically, not just the new one, so it's worth confirming against an existing route (e.g. trigger `appErrors:userNotInvitedToSurvey` from `/survey/:surveyId/user/:userUuid/resetpasswordurl`) before concluding it's specific to this change.

- [ ] **Step 5: Verify self-delete rejection and record reassignment via `psql`**

```bash
admin_uuid=$(docker exec arena-db psql -U arena -d arena -t -A -c "SELECT uuid FROM \"user\" WHERE email='test@openforis-arena.org';")
curl -s -o /tmp/self-delete-response.json -w '%{http_code}\n' -X DELETE "http://localhost:9090/api/user/$admin_uuid" \
  -H "Authorization: Bearer $(curl -s -X POST http://localhost:9090/auth/login -H 'Content-Type: application/json' -d '{"email":"test@openforis-arena.org","password":"Test_123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).authToken')"
cat /tmp/self-delete-response.json
```

Expected: HTTP status `400`, body `{"status":"error","key":"appErrors:userCannotDeleteSelf",...}`.

- [ ] **Step 6: Verify the owns-surveys block, and the full success path, via the stress test tool itself**

```bash
yarn test:load:build-fixture /tmp/verify-survey.zip
node --experimental-strip-types test/load/surveyImportStressTest.ts --zip /tmp/verify-survey.zip --count 1 --keep
```

Expected: summary shows 1 succeeded; final line says surveys and users were left in place (`--keep` passed). Note the printed run id isn't shown directly, so fetch the created user from the DB:

```bash
target_uuid=$(docker exec arena-db psql -U arena -d arena -t -A -c "SELECT uuid FROM \"user\" WHERE email LIKE 'stress_test_%@loadtest.local' ORDER BY email DESC LIMIT 1;")
admin_token=$(curl -s -X POST http://localhost:9090/auth/login -H 'Content-Type: application/json' -d '{"email":"test@openforis-arena.org","password":"Test_123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).authToken')
curl -s -o /tmp/owns-survey-response.json -w '%{http_code}\n' -X DELETE "http://localhost:9090/api/user/$target_uuid" -H "Authorization: Bearer $admin_token"
cat /tmp/owns-survey-response.json
```

Expected: HTTP status `409`, body `key: "appErrors:userCannotDeleteOwnsSurveys"`.

Then run the same command again *without* `--keep` to confirm the full, intended flow (survey cleanup, then user cleanup) succeeds end-to-end:

```bash
node --experimental-strip-types test/load/surveyImportStressTest.ts --zip /tmp/verify-survey.zip --count 3
```

Expected: summary shows 3 succeeded; `Deleted 3/3 surveys created by this run.`; `Deleted 3/3 users created by this run.`. Confirm directly:

```bash
docker exec arena-db psql -U arena -d arena -t -A -c "SELECT count(*) FROM \"user\" WHERE email LIKE 'stress\_test\_%@loadtest.local';"
```

Expected: `0` for the run's own users (pre-existing leftover accounts from before this feature existed may still show a nonzero count from *other* runs — that's expected and not a regression).

- [ ] **Step 7: Stop the background dev server**

Stop the `yarn dev:server` process started in Step 2.

No commit for this task — it's a verification pass, not a code change. If any step fails, go back and fix the relevant code in Task 1, 2, or 3, then re-run from Step 4.

---

## Self-Review Notes

- **Spec coverage:** §1 (DB relationships) — encoded directly in Task 1 Step 3's checks and comments. §2 (`deleteUser`) — Task 1. §3 (API endpoint) — Task 1 Step 4. §4 (stress test wiring) — Tasks 2–3. Verification plan's three points — Task 4.
- **Type consistency:** `ResultEntry.userUuid` (Task 3 Step 1) matches every place it's set (`runSingleUserImport`, Task 3 Step 4) and read (`main()`, Task 3 Step 6; `cleanupUsers`'s caller). `createUser`'s new `Promise<string>` return (Task 2) matches every call site (`runSingleUserImport`, Task 3 Step 4).
- **No placeholders:** every step above has literal code, not a description of code.
