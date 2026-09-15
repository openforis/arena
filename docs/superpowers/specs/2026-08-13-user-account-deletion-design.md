# Admin User-Account Deletion

## Purpose

`test/load/surveyImportStressTest.ts` provisions one throwaway user account
per concurrent import (`stress_test_<runId>_<i>@loadtest.local`). Surveys
created by a run are cleaned up automatically; user accounts are not —
`test/load/README.md` documents this as permanent: "There is no API to
delete a user account, so these accumulate in the database across runs."

This spec adds a real admin capability to delete a user account (service +
API endpoint), then wires the stress test to use it so its throwaway
accounts stop accumulating.

## Scope

1. `UserService.deleteUser` — full account deletion, admin-only, handling
   record ownership and the DB constraints that would otherwise block it.
2. `DELETE /user/:userUuid` API endpoint, system-admin only.
3. Stress test: capture created users' uuids, delete them after each run
   (mirroring the existing survey cleanup), update the README.

Out of scope: a webapp UI for this endpoint (nothing in the brief asks for
one); changing the `arena-server` package's DB migrations (a separate repo
and release cycle — see "Cascade side effects" below for why this matters);
notification emails or websocket events on deletion (not requested, and the
existing survey-scoped `deleteUserFromSurvey` email template doesn't fit a
full account deletion).

## 1. DB relationships that constrain this (confirmed against
`arena-server`'s migration SQL, not assumed)

The `"user"` table lives in the `public` schema; every survey also has its
own `survey_<id>` schema (record, node, activity_log, etc.), created per
survey. A foreign key can reference across schemas within the same
database, so both kinds of tables below actually enforce against a
`DELETE FROM "user"`.

**Blocks deletion outright (no `ON DELETE` action set → Postgres default
`RESTRICT`):**

| Column | Table / schema | Note |
|---|---|---|
| `record.owner_uuid` | `survey_<id>.record` (per survey) | Also `NOT NULL` — nulling it out isn't an option, it must be reassigned |
| `survey.owner_uuid` | `public.survey` | Blocks deletion if the user owns any survey |
| `message.created_by_user_uuid` | `public.message` | Blocks deletion if the user authored any message |

**Cascade-deletes silently (`ON DELETE CASCADE`):**

| Column | Table / schema | What's actually lost |
|---|---|---|
| `activity_log.user_uuid` | `survey_<id>.activity_log` (every survey the user touched) | The user's entire audit trail in every survey |
| `user_invitation.invited_by` | `public.user_invitation` | The invitation record of *other people this user invited* — not just their own |
| `user_access_request.modified_by` | `public.user_access_request` | The access-request record of *other people* this user (as admin) approved/rejected |
| `user_invitation.user_uuid`, `user_reset_password.user_uuid`, `user_refresh_token.user_uuid`, `user_2fa_device.user_uuid`, `auth_group_user.user_uuid`, `user_group_user.user_uuid`, `connected_socket.user_uuid`, `user_temp_auth_token.user_uuid` | `public.*` | The user's own sessions/tokens/2FA/group-membership — uncontroversial |

The cascade-deleted rows in the second table are a pre-existing schema
decision in `arena-server` (a separate repo/npm package, versioned
independently — this repo consumes it as `@openforis/arena-server`). This
repo has no migration mechanism for that package's schema, so nothing here
changes that behavior; it's called out so it's a known, deliberate
trade-off rather than a surprise. Concretely: deleting a user erases their
activity-log history everywhere, and erases the invitation/access-request
rows of *other* people that this user happened to act on as an inviter or
approving admin. If that's ever unacceptable, the fix is a migration in
`arena-server` changing those FKs from `CASCADE` to `SET NULL` (which also
requires making the columns nullable) — a separate, out-of-scope follow-up.

## 2. `UserService.deleteUser({ user, userUuidToDelete })`

New export in `server/modules/user/service/userService.js`, run inside a
single `db.tx` (validation and mutation both inside the transaction, so a
concurrent change between the check and the delete can't slip through).

No prerequisite plumbing needed: `countOwnedSurveys` and `fetchAllSurveyIds`
(used by steps 4 and 6 below) are both already plain passthrough
re-exports on `SurveyManager` (`export const { countOwnedSurveys, ...,
fetchAllSurveyIds, ... } = SurveyRepository`), and both accept a
transaction client as their second/relevant argument, so they run inside
our `db.tx` unmodified. (An earlier version of this implementation used
the enriched `fetchUserSurveysInfo` / listing-query `fetchUserSurveys`
instead, which required adding a re-export for the latter — see the
"blind spot" note in step 4 for why that approach was replaced.)

1. Reject if `userUuidToDelete === User.getUuid(user)` —
   `SystemError('appErrors:userCannotDeleteSelf', {}, StatusCodes.BAD_REQUEST)`.
2. Fetch the target via `UserManager.fetchUserByUuid`; if missing,
   `SystemError('appErrors:userNotFound', { userUuid: userUuidToDelete }, StatusCodes.NOT_FOUND)`.
3. If the target is a system admin, verify they're not the last one
   (`UserManager.countSystemAdministrators`); if so,
   `SystemError('appErrors:userCannotDeleteLastSystemAdmin', {}, StatusCodes.CONFLICT)`.
   (Without this, deleting the last admin strands the app — the
   auto-provisioned bootstrap admin in `insertSystemAdminUserIfNotExisting`
   only runs at server startup, not on demand.)
4. Count surveys owned by the target, using the same unfiltered condition
   as the `survey.owner_uuid` FK itself
   (`SurveyManager.countOwnedSurveys({ user: target }, t)` —
   `SELECT COUNT(*) FROM survey s WHERE s.owner_uuid = $1`, no other
   filters). The UI listing query (`fetchUserSurveys`) was considered and
   rejected here: it excludes templates and temporary surveys and, for a
   non-system-admin target, also requires current `auth_group_user`
   membership — none of which the FK cares about, so it could miss surveys
   that still block the delete. If the count is non-zero,
   `SystemError('appErrors:userCannotDeleteOwnsSurveys', { count }, StatusCodes.CONFLICT)`
   — blocked, not auto-reassigned (survey ownership transfer is a
   significant action; see the earlier design decision). The error reports
   only a count, not survey names, since the FK-scoped count query doesn't
   fetch names and the UI listing query that does isn't safe to reuse here
   (see above).
5. Fetch messages authored by the target (message service `getAll(t)`,
   filtered client-side by `createdByUserUuid` — the `MessageService`
   interface has no dedicated by-author query, but does accept the
   transaction client). If non-empty,
   `SystemError('appErrors:userCannotDeleteHasMessages', { count }, StatusCodes.CONFLICT)`
   — same reasoning, blocked.
6. Reassign records: for every survey in the instance
   (`SurveyManager.fetchAllSurveyIds(t)` — `SELECT id FROM survey`, no
   filters), call the existing `RecordManager.updateRecordsOwner({
   surveyId, fromOwnerUuid: userUuidToDelete, toOwnerUuid: User.getUuid(user)
   }, t)` — the same helper `UserService.deleteUserFromSurvey` already uses
   for the single-survey case. Reassigns to the acting admin (the caller),
   per the confirmed decision. Iterating every survey (rather than the
   membership-filtered `fetchUserSurveys` listing) avoids the same blind
   spot as step 4: a target can own records in a survey without currently
   being a member of it. A no-op (0 rows) for surveys where the target owns
   no records, so this is safe to call unconditionally rather than
   pre-checking, and no more expensive than the FK check Postgres already
   runs against every survey schema to allow the delete at all.
7. Delete the user row: `UserManager.deleteUser(userUuidToDelete, t)`
   (already exists, currently only used by the expired-invitation cleanup
   job). DB cascade handles everything in the second table above.
8. Return the deleted user.

All five error keys above are flat (`appErrors:userCannotDeleteSelf`, not a
nested `appErrors:user.cannotDeleteSelf`), matching this codebase's existing
`appErrors` convention (e.g. `appErrors:userInvalid`).

No email/websocket notification — not requested, and reusing
`deleteUserFromSurvey`'s "you were removed from a survey" email template
would send the wrong message for a full account deletion.

## 3. API endpoint

`server/modules/user/api/userApi.js`, new route in the `==== DELETE`
section:

```js
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
```

`requireAdminPermission` already exists in `@openforis/arena-server`
(`Users.isSystemAdmin` check, already used by the `message` API for the
same "system admin only" gate) but isn't currently re-exported by this
repo's `authApiMiddleware.js` — add it to the destructured
`ApiAuthMiddleware` import there. No new permission logic needed.

This is deliberately system-admin-only (`requireAdminPermission`), not the
survey-scoped `requireUserRemovePermission` the existing
`/survey/:surveyId/user/:userUuid` endpoint uses — full account deletion is
strictly more powerful than removing a user from one survey.

## 4. Stress test wiring (`test/load/`)

- **`lib/httpApi.ts`**: `createUser` currently discards the response body
  (`Promise<void>`). Change it to parse `body.user` and return its `uuid`
  (`Promise<string>`), since the new cleanup step needs it. Add
  `deleteUser({ baseUrl, authToken, userUuid, fetchImpl })` calling
  `DELETE ${baseUrl}/api/user/${userUuid}`, same shape as `deleteSurvey`.
- **`surveyImportStressTest.ts`**:
  - `runSingleUserImport` captures the uuid `createUser` now returns and
    includes it on its returned `ResultEntry` as `userUuid` (nullable —
    absent when user setup itself failed, matching how `surveyId` is
    already nullable on failure).
  - New `cleanupUsers({ baseUrl, authToken, userUuids, fetchImpl })`,
    mirroring `cleanupSurveys`: best-effort, sequential, catches and logs
    per-user failures rather than throwing (a user whose survey failed to
    clean up in the same run will still own that survey, so their deletion
    is *expected* to fail with `appErrors:userCannotDeleteOwnsSurveys` —
    that's a signal worth logging, not swallowing entirely).
  - `main()`: after survey cleanup, collect `userUuid`s from `results` and
    call `cleanupUsers`, gated by the same `--keep` flag survey cleanup
    already uses (both are "leave this run's artifacts in place for
    inspection"). Replace the closing "cannot be deleted via the API"
    console note with a summary of how many users were deleted.
- **`README.md`**: remove the "Throwaway user accounts are permanent"
  limitation; note instead that both surveys and user accounts are cleaned
  up after each run (unless `--keep`).

## Verification plan

1. Unit tests for the new/changed pure logic:
   `test/load/lib/httpApi.test.ts` — `createUser` returns the parsed uuid,
   `deleteUser` builds the right request; `surveyImportStressTest.test.ts`
   — `cleanupUsers` best-effort behavior (partial failure doesn't throw,
   returns the right counts), matching the existing `cleanupSurveys` test
   coverage.
2. Manual run against a local dev server
   (`node --experimental-strip-types test/load/surveyImportStressTest.ts --zip <fixture> --count 5`):
   confirm the summary reports users deleted, and that
   `SELECT * FROM "user" WHERE email LIKE 'stress_test_%'` is empty
   afterward.
3. Exercise the blocking paths directly (integration or manual, against a
   throwaway account, not the stress test): attempt to delete a user who
   owns a survey → 409 with the survey names; who authored a message → 409;
   who owns records in a survey they're a member of → succeeds, records
   reassigned to the caller; the last system admin → 409; self-delete →
   400.

## Non-goals

- No webapp UI for this endpoint.
- No change to `arena-server`'s FK cascade behavior (documented as a known
  trade-off, not fixed here).
- No notification email or websocket event on account deletion.
- No new CLI flag for the stress test — user cleanup reuses `--keep`.
