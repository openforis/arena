# Restrict record view/edit to matching qualifier values for UserGroup members

## Context

Branch `feat/user-grouping` already has the data model and a write-time behavior for the "qualifier" feature: a `UserGroup` can define `qualifiers` (`[{name, value}]`, `core/user/userGroup/userGroup.ts`), a survey attribute can be flagged `NodeDef.isQualifier` (single text/code attribute, direct child of the root entity — `core/survey/_survey/surveyNodeDefs.js::canNodeDefBeQualifier`), and when a member of a group creates a new record, `_applyGroupQualifierValues` (in `server/modules/record/manager/_recordManager/recordUpdateManager.js`) auto-fills each qualifier attribute from the user's group and locks it read-only in the form.

What's still missing — and what this plan implements — is the other half already promised by the feature's own tooltip text (`core/i18n/resources/en/common.js`, `nodeDefEdit.basicProps.qualifier.info`): *"Users will only be able to see and modify records belonging to their own group, if they belong to one."* Today, nothing filters the records list or blocks viewing/editing a non-matching record — a group member can see and edit every record in the survey regardless of qualifier values.

Per user decisions:
- **Full enforcement**: filter the Data list/count query AND add a server-side guard blocking direct view/edit/delete/step/owner-change of non-matching records.
- **Multi-group behavior**: if a user belongs to multiple `UserGroup`s in a survey, only the first one (`userGroups[0]`) is considered — consistent with the existing `_applyGroupQualifierValues` behavior.
- System admins remain fully exempt (already true via `User.isSystemAdmin` checks throughout `core/auth/authorizer.ts`); the restriction applies to any other user who belongs to a group with qualifiers, regardless of survey role.

**Important architectural constraint** (confirmed by reading the code): the Express middlewares that currently gate record edit/delete/step/owner routes (`requireRecordEditPermission`, `requireRecordsEditPermission`, `requireRecordStepEditPermission`, `requireRecordOwnerChangePermission`) are re-exported in `server/modules/auth/authApiMiddleware.js` straight from `ApiAuthMiddleware` in the external `@openforis/arena-server` npm package, which internally calls `@openforis/arena-core`'s own bundled copy of `Authorizer.canEditRecord` — a different module from this repo's local `core/auth/authorizer.ts`, and one that fetches only the bare `record` row (no node values), so it has no way to know about qualifiers. Extending this repo's local `core/auth/authorizer.ts` alone would not affect those routes. Rather than patching the external package (a separate repo/publish cycle), this plan adds an **additional, arena-local Express middleware** layered onto the existing ones on each affected route — a self-contained, defense-in-depth check that doesn't require touching `@openforis/arena-server`/`@openforis/arena-core`.

## Approach

### 1. Shared qualifier-matching helper (new file)

Add `server/modules/record/manager/_recordManager/recordQualifierMatcher.js` (sits alongside `recordUpdateManager.js` in the existing `_recordManager` private-helpers folder) exporting:

- `fetchUserQualifierFilters({ user, survey }, client)` — async. Mirrors the existing lookup in `_applyGroupQualifierValues` (recordUpdateManager.js:83-99): get `Survey.getNodeDefsArray(survey).filter(NodeDef.isQualifier)`; if none, return `[]`. Fetch `ServiceRegistry.getInstance().getService(ServerServiceType.userGroup).getManyByUser({ userUuid, surveyUuid })`, take `userGroups[0]`; if none, return `[]`. For each qualifier nodeDef, find a `UserGroup.getQualifiers(userGroup)` entry whose `UserGroupQualifier.getName(q) === NodeDef.getName(nodeDef)` with a non-empty value; collect `{ nodeDef, value }`. Return `[]` (meaning "unrestricted") when the user has no group or the group has no matching qualifiers.
- `recordMatchesQualifierFilters({ record, qualifierFilters })` — sync. For each `{ nodeDef, value }`, find the node via `Record.getNodeChildrenByDefUuid(Record.getRootNode(record), NodeDef.getUuid(nodeDef))(record)[0]`; compare its stored value against `value` the same way `_applyGroupQualifierValues` writes it (code attributes: compare the code portion of the node value; text attributes: direct equality). Return `false` if any filter's node is missing or its value doesn't match; `true` if `qualifierFilters` is empty or every filter matches.

Refactor `_applyGroupQualifierValues` in `recordUpdateManager.js` to call `fetchUserQualifierFilters` instead of duplicating the lookup inline, keeping the two write-time and read-time paths consistent.

### 2. List/count filtering (Data view)

- `server/modules/record/repository/recordRepository.js`: add a `qualifierNodeDefFilters = []` param to `fetchRecordsSummaryBySurveyId` and `countRecordsBySurveyId`. For each `{ nodeDef, value }`, add a WHERE fragment `"${rootEntityTableAlias}"."${NodeDefTable.getColumnName(nodeDef)}" = $/qualifierValueN/` (unique param name per filter), following the exact pattern already used for `ownerUuid`/`cycle`. Force the `n0` RDB-view join whenever `nodeDefRoot && (nodeDefKeys?.length > 0 || qualifierNodeDefFilters.length > 0)` (currently gated only on `nodeDefKeys`). Note: `NodeDefTable.getColumnName(nodeDef)` (verified) returns the plain, unsuffixed column for both text and code attributes — for code attributes this is the raw code column, not the `_label` column, so it's directly comparable to the qualifier's plain-text value with no extra resolution needed.
- In `countRecordsBySurveyId`, extend the existing "delegate to full list and count results" branch (currently `if (!A.isEmpty(search))`) to also trigger `if (!A.isEmpty(qualifierNodeDefFilters))`, since the plain count SQL doesn't join `n0` and has no access to attribute values.
- `server/modules/record/manager/recordManager.js`: `fetchRecordsSummaryBySurveyId`/`countRecordsBySurveyId` already load the full `survey` (with node defs) internally when `includeRootKeyValues` is true — add a `user` param, call `RecordQualifierMatcher.fetchUserQualifierFilters({ user, survey })` right after loading `survey`, and pass the resolved `qualifierNodeDefFilters` down to the repository calls.
- `server/modules/record/api/recordApi.js`: pass `user` (already available via `Request.getUser(req)`) into the `RecordService.fetchRecordsSummaryBySurveyId`/`countRecordsBySurveyId` calls on the `/records/summary` and `/records/summary/count` routes (recordApi.js:185-220), alongside the existing `ownerUuid`.

This means group-restricted users simply never see non-matching records in the Data table or its count — no client-side change needed there, since `useColumns.js`'s existing `Authorizer.canEditRecord`/`canDeleteRecord` per-row checks only ever see rows that already passed the qualifier filter.

### 3. New middleware for direct view/edit/delete/step/owner routes

Add `server/modules/record/api/recordQualifierMiddleware.js` (follows the existing single-purpose middleware convention seen in `server/modules/ai/api/aiMiddleware.js`), exporting:

- `requireRecordMatchesUserGroupQualifiers` — reads `surveyId` and `recordUuid` from the request (params or query, matching how each route already extracts them), loads `survey` via `SurveyManager.fetchSurveyAndNodeDefsBySurveyId` and the record via `RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, fetchForUpdate: false, includeRefData: false })` (the cheapest option combination that still includes node values), computes `qualifierNodeDefFilters` via the shared helper, and calls `next()` if `recordMatchesQualifierFilters` is true, otherwise responds 403 the same way `authApiMiddleware.js`'s `sendForbiddenError` does (reuse `server/utils/unauthorizedError.js`'s `UnauthorizedError`, which already serializes to the same `{ key: 'appErrors:userNotAuthorized', statusCode: 403 }` shape the frontend's generic `ServiceErrors` toast already renders — no new UI component needed).
- `requireRecordsMatchUserGroupQualifiers` — plural variant for the batch endpoints; reads an array of `recordUuid`s and runs the same check for each, denying (403) if any one fails.

Wire the singular middleware into `recordApi.js`, right after the existing permission middleware, on:
- `GET /survey/:surveyId/record` (view)
- `POST /survey/:surveyId/record/:recordUuid/node` (edit)
- `DELETE /survey/:surveyId/record/:recordUuid/node/:nodeUuid` (edit)
- `DELETE /survey/:surveyId/record/:recordUuid` (delete)
- `POST /survey/:surveyId/record/:recordUuid/step` (step change)
- `POST /survey/:surveyId/record/:recordUuid/owner` (owner change)
- `POST /survey/:surveyId/record/:recordUuid/checkin` (start edit session)

Wire the plural middleware onto:
- `POST /survey/:surveyId/records/step` (batch step change)
- `DELETE /survey/:surveyId/records` (batch delete)

### 4. Out of scope (flagged, not implemented here)

`UserGroupQualifiersEditor.tsx` (the admin UI for editing a group's qualifiers) is currently a free-text key/value list with no awareness of the survey's actual `isQualifier` node defs — an admin can type a qualifier name/value that doesn't match any real attribute, or a code that doesn't exist in the category, silently producing a group whose members see zero records. This is a pre-existing data-integrity gap, not something this restriction feature requires fixing, so it's left untouched — worth a follow-up if mismatches turn out to be common in practice.

## Files to change

- `server/modules/record/manager/_recordManager/recordQualifierMatcher.js` (new)
- `server/modules/record/manager/_recordManager/recordUpdateManager.js` (refactor `_applyGroupQualifierValues` to reuse the new helper)
- `server/modules/record/repository/recordRepository.js` (`fetchRecordsSummaryBySurveyId`, `countRecordsBySurveyId`)
- `server/modules/record/manager/recordManager.js` (`fetchRecordsSummaryBySurveyId`, `countRecordsBySurveyId`)
- `server/modules/record/api/recordApi.js` (pass `user` through to list/count calls; wire new middleware onto the 9 routes listed above)
- `server/modules/record/api/recordQualifierMiddleware.js` (new)

## Verification

1. Unit tests (`test/unit/tests/`, alongside existing `031userGroup.test.js`/`034canNodeDefBeQualifier.test.js`) for `recordQualifierMatcher.js`'s `recordMatchesQualifierFilters` covering: no filters (unrestricted), matching text qualifier, mismatching text qualifier, matching/mismatching code qualifier, missing node.
2. Integration test (`test/integration/`) exercising: create a UserGroup with a qualifier, create two records with different qualifier-attribute values (one matching, one not), confirm `GET /records/summary` for a group-member user returns only the matching record, and confirm `POST .../node` / `DELETE /record/:recordUuid` on the non-matching record returns 403.
3. Manual/e2e check via `yarn watch`: as a survey admin, create a UserGroup with a qualifier tied to a real `isQualifier`-flagged attribute, add a second test user to that group, log in as that user, confirm the Data table only shows matching records, and confirm opening a non-matching record's URL directly (or editing/deleting it via API) is rejected.
