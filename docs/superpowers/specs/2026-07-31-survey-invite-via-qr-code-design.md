# Feature: Invite a user to a survey via a temporary QR code

## Context

A survey admin currently invites people by email (`webapp/views/App/views/Users/UserInvite`), which requires typing addresses and only works well for people who don't yet have an Arena account. For people who already have an Arena account and are physically present (e.g. a field-data-collection workshop), the admin wants a faster path: show a QR code on screen, the attendee opens the **Arena Mobile** app (already logged in with their own account), scans it, and is immediately granted a role on the current survey. The code should expire automatically (e.g. after 1 hour) so it can't be reused later or abused if someone photographs the screen.

This is feasible with moderate effort because Arena already has ~80% of the required plumbing, just built for a different purpose: a **"log in a new device by scanning a QR code"** feature (`QRCodeLoginDialog` in the web app + `QrScannerModal` in the mobile app + a short-lived, hashed, single-use `user_temp_auth_token` table + `WebSocketServer.notifyUser` for the scan acknowledgement). This plan adapts that exact pattern for survey invitations instead of logins.

The codebase spans three repositories, all checked out locally as siblings:
- **`arena-server`** (`/home/stefano/dev/projects/openforis/arena-server`) — private npm dependency (`@openforis/arena-server`) that owns **all** DB migrations/schema and low-level auth/session/WebSocket plumbing. `arena`'s own `server/db` has no local migration mechanism (confirmed: no `server/db/*migrat*` files), so any new table must be added here and released as a new package version before `arena` can consume it (see recent commit `9cb44c29c use latest arena-server`).
- **`arena`** (this repo) — hosts the survey/user business logic (`server/modules/user/service/userInviteService.js`, `server/modules/user/manager/userManager.js`) and the React admin web UI.
- **`arena-mobile`** (`/home/stefano/dev/projects/openforis/arena-mobile`) — the Arena Mobile app (Expo/React Native), already has `expo-camera`/`barcode-detector` and a working `QrScannerModal` component used today for the QR-login flow.

Decisions confirmed with the user:
- Plan covers **all three repos** end-to-end.
- The admin **picks the role/group** to grant (same `DropdownUserRole` / `Authorizer.getUserGroupsCanAssign` restrictions as the email invite), not a fixed role.
- The QR token is **multi-use until expiry** — many people can scan the same code during the (default 1-hour) window, unlike the existing single-use login token.
- The mobile app shows an **explicit confirmation screen** (survey name, role, inviter) before joining — no silent auto-join.

---

## Part 1 — `arena-server`: new `survey_invite_token` table + API

Model this closely on the existing `user_temp_auth_token` feature but keep it a **separate** table/service, since the semantics differ (scoped to a survey+role, multi-use, not tied to a single target user):
- Model/table reference: `src/model/userTempAuthToken/userTempAuthToken.ts`, `src/db/table/schemaPublic/userTempAuthToken.ts`
- Service reference: `src/service/userTempAuthToken/{create,getByTokenHash,revoke,cleanupExpired}.js`
- API reference: `src/api/auth/authTempToken.js` (create) and `src/api/auth/login.ts` (`AuthLogin.init`, lines 171-208, the `loginTemp` handler — mirror its token-validation/expiry/error-handling shape, not its login side-effects)
- Migration references: `src/db/dbMigrator/migration/public/migrations/{20260118215307-add-table-user-temp-auth-token,20260123092621-add-column-user-temp-auth-token-hash}.ts` + their `sqls/*.sql` files

**New migration** — table `survey_invite_token`:
```sql
CREATE TABLE IF NOT EXISTS survey_invite_token (
    token_hash        varchar(64)  PRIMARY KEY,
    survey_uuid        uuid        NOT NULL REFERENCES survey(uuid) ON DELETE CASCADE,
    group_uuid          uuid       NOT NULL REFERENCES auth_group(uuid) ON DELETE CASCADE,
    created_by_user_uuid uuid      NOT NULL REFERENCES "user"(uuid),
    date_created        TIMESTAMP  NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    date_expires_at     TIMESTAMP  NOT NULL DEFAULT (now() AT TIME ZONE 'UTC' + INTERVAL '1 hour')
);
```
Token itself follows the same pattern as `userTempAuthToken`: server generates `crypto.randomUUID()`, only the SHA-256 hash (`hashToken`, `src/service/userTempAuthToken/utils.js`) is persisted, plaintext is returned once to the creator.

**New service** `src/service/surveyInviteToken/` — `create({ surveyUuid, groupUuid, createdByUserUuid, expirationMinutes = 60 })`, `getByTokenHash` (does **not** delete — multi-use, unlike `revoke`), `deleteExpired` (for the daily cleanup scheduler, mirroring `server/system/schedulers/userTempAuthTokensCleanup.js` in the `arena` repo).

**New API endpoints** (under `arena-server`'s `ApiEndpoint.auth` namespace or a new `surveyInvite` namespace — follow existing endpoint-definition convention in `src/api/endpoint/`):
- `POST /survey/:surveyUuid/invite/qr/token` — admin-only (mirrors `requireUserInvitePermission`), creates and returns a token + `dateExpiresAt`.
- `POST /survey/invite/qr/accept` — **requires the caller to already be authenticated** (`requireLoggedInUser`, unlike `loginTemp` which authenticates an anonymous device). Body: `{ token }`. Looks up the token by hash, checks not expired, loads `survey`/`group`, then delegates to `arena`'s existing group-assignment logic — expose this as a thin wrapper the `arena` repo calls into, OR (simpler, avoids duplicating business logic like `_checkCanInviteToGroup`/`_checkUserCanBeInvited` that already live in `arena`) have this endpoint live in the `arena` repo instead and only use `arena-server` for the token CRUD service. **Recommendation:** keep token issuance/lookup in `arena-server` (it owns the DB table), but implement both API routes in `arena`'s own `server/modules/user/api/userApi.js`, calling into `UserTempAuthTokenService`-style methods exposed by `arena-server`'s `ServiceRegistry` — this matches how `arena`'s `userInviteService.js` already calls `UserManager.addUserToGroup` for the "existing user" branch, keeping survey-invite business rules where the rest of the invite logic already lives.
- Add WebSocket event `surveyInviteAccepted` to signal the admin's browser (mirrors `tempLoginSuccessful`); emit via `WebSocketServer.notifyUser(createdByUserUuid, WebSocketEvent.surveyInviteAccepted, { surveyUuid, userUuid, userName })` from wherever the accept endpoint ultimately lives.

**Cleanup job**: add a scheduler in `arena`'s `server/system/schedulers/` (parallel to `userTempAuthTokensCleanup.js`) that calls the new `deleteExpired`, registered in `server/system/appCluster.js` next to the existing temp-token cleanup registration.

**Versioning note**: this requires bumping `@openforis/arena-server` in `arena/package.json` (currently `^1.3.23`) once the migration/service/endpoints are released, same as the recent `9cb44c29c use latest arena-server` commit.

---

## Part 2 — `arena`: business logic + admin web UI

**Business logic** (`server/modules/user/`):
- Reuse `_checkCanInviteToGroup` and the "existing user, already accepted" branch of `_inviteUser` in `server/modules/user/service/userInviteService.js` (lines 90-108, 150-158) as the authorization + role-assignment template. The QR-accept handler should call `UserManager.addUserToGroup({ user: createdByUser, surveyInfo, group, userToAdd: scanningUser }, t)` (`server/modules/user/manager/userManager.js:77`) exactly like the email flow does — this already writes the `auth_group_user` row and the `ActivityLog.type.userInvite` entry, so no new persistence logic is needed for the actual role grant.
- New file `server/modules/user/service/userQrInviteService.js` (sibling to `userInviteService.js`) with `createQrInviteToken({ user, surveyId, groupUuid })` and `acceptQrInvite({ user, token })`, calling the `arena-server`-backed token service for create/lookup and `UserManager.addUserToGroup` for the grant. Guard `acceptQrInvite` with the same checks as `_checkUserCanBeInvited` (`userInviteService.js:49-66`) — reject if the scanning user already has a role in the survey, is a system admin, etc.
- New routes in `server/modules/user/api/userApi.js` (sibling to the existing `POST /survey/:surveyId/users/invite` at line 26): `POST /survey/:surveyId/users/invite/qr` (create token, `requireUserInvitePermission`) and `POST /survey/:surveyId/users/invite/qr/accept` (`requireLoggedInUser`).

**Admin web UI** (`webapp/views/App/views/Users/`):
- New component `UserInviteQr/UserInviteQrDialog.js`, modeled directly on `webapp/views/App/Header/QRCodeLoginDialog/QRCodeLoginDialog.js`:
  - Role picker: reuse `DropdownUserRole` (`webapp/views/App/views/Users/DropdownUserRole`) exactly as `UserInvite.js` does (lines 77-86), scoped with `showOnlySurveyGroups` via `Authorizer.getUserGroupsCanAssign`.
  - On role selection, call a new `API.createSurveyInviteQrToken({ surveyId, groupUuid })` (add to `webapp/service/api/user/index.js`, next to `createTempAuthToken` at line 75) → `POST /survey/:surveyId/users/invite/qr`.
  - Render with the existing `QRCode` component (`webapp/components/QRCode.js`), encoding `{ serverUrl, surveyId, token }`.
  - Auto-refresh the token shortly before `dateExpiresAt` (same `setInterval` pattern as `QRCodeLoginDialog.js:67-83`), but on a ~1-hour cadence instead of 60s.
  - Listen for the new `surveyInviteAccepted` WebSocket event (`common/webSocket/webSocketEvents.js`, add next to `tempLoginSuccessful` at line 34) via `useOnWebSocketEvent`, and show a running "X people joined" list/toast rather than a single one-shot success state (since the token is multi-use) — this is the one meaningful UI deviation from `QRCodeLoginDialog`.
- Entry point: add a button/menu item near the existing "Invite" action in `webapp/views/App/views/Users/Users.js` / `UsersList`, opening `UserInviteQrDialog` alongside the existing email `UserInvite` view.

---

## Part 3 — `arena-mobile`: scan-and-join flow

- New screen `src/screens/SurveyInviteQrScreen` (or a modal reachable from the survey list/selection screen), reusing `src/components/QrScannerModal/QrScannerModal.tsx` unchanged (it's generic — just takes `onData`/`onDismiss`/`titleKey`).
- Parse the scanned payload with a `parseSurveyInviteQrData` function mirroring `parseLoginQrCodeData` in `src/screens/SettingsRemoteConnectionScreen/SettingsRemoteConnectionScreen.tsx:41-57`, expecting `{ serverUrl, surveyId, token }`.
- New service method in `src/service/surveyService.ts` (using the existing `RemoteService` HTTP client the file already imports, same authenticated-call pattern as the rest of that file) — `fetchQrInviteDetails({ token })` (calls a lightweight preview endpoint, or just decodes what's needed) and `acceptQrInvite({ token })` → `POST /survey/:surveyId/users/invite/qr/accept`, sent with the user's existing session/auth token (unlike `loginWithTempAuthToken`, this does **not** log the user out/in — they're already authenticated).
- New Redux action, e.g. `SurveyActions.acceptQrInvite({ token, navigation })` in `src/state/survey/actions.ts`, modeled on `RemoteConnectionActions.loginWithTempAuthToken` (`src/state/remoteConnection/actions.ts:243-264`) but simpler — no `onLoginResponse`/2FA handling needed:
  1. Show the **confirmation dialog** (survey name, role/group label, inviter name — returned by the accept-preview or embedded in a first "peek" call) using the existing `ConfirmActions.show` pattern (see `_doLogout`/`clearUserCredentials` for the dialog shape).
  2. On confirm, call `acceptQrInvite`.
  3. On success, refresh the user's survey list (`SurveyActions` already has a survey-fetch action — reuse it, same as `SurveyActions.fetchCurrentSurveyUserGroupIfSurveySelected()` called after login at `actions.ts:114`) so the newly joined survey appears immediately.
- Entry point: a "Join survey via QR code" button, placed alongside survey selection (wherever the user browses/switches surveys), not in `SettingsRemoteConnectionScreen` (that screen is for logged-out device pairing, not for an already-authenticated user).

---

## Security notes to carry into implementation
- Token is never stored in plaintext (SHA-256 hash only, exactly like `user_temp_auth_token`).
- Expiry defaults to 1 hour, enforced server-side on every accept call, not just at issuance.
- Reuse the existing invite authorization rules (`_checkCanInviteToGroup`, `_checkUserCanBeInvited`) so QR-invites can't grant system-admin/survey-manager roles or bypass the "survey not published" restriction that email invites already enforce.
- Since the token is multi-use and visible to anyone who can see the screen, keep the default expiry short and let the admin manually invalidate it (a "Revoke" button in `UserInviteQrDialog` calling a `DELETE` on the token) in addition to auto-expiry.

## Verification
- `arena-server`: add unit/integration tests for the new token service (create/getByTokenHash/expiry) mirroring existing `userTempAuthToken` tests if present; run its test suite.
- `arena`: add an integration test under `test/integration/` for `userQrInviteService` (create token → accept as a second user → assert `auth_group_user` row exists), following the existing pattern for `userInviteService`; manually test in the browser: generate a QR from the Users screen, confirm it renders and refreshes, confirm the role dropdown reuses the same restrictions as the email invite.
- `arena-mobile`: manually test end-to-end against a local `arena` server — log in as two different accounts on two devices/simulators, generate a QR on the web admin screen, scan with the second mobile account, confirm the confirmation dialog shows correct survey/role/inviter, accept, and verify the survey appears in that user's survey list and the admin's browser shows the "joined" notification via WebSocket.
