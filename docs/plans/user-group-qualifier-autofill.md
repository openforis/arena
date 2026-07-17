# Auto-fill qualifier attributes from user group on record creation

## Context

The `feat/user-grouping` branch has already built the two halves of a "user group qualifiers" feature in isolation:

- **Survey side**: a node def can be flagged `NodeDef.isQualifier(nodeDef)` (`core/survey/nodeDef.js:235`), restricted by `Survey.canNodeDefBeQualifier` (`core/survey/_survey/surveyNodeDefs.js:247-250`) to single text/code attributes that are direct children of the root entity. The node def editor checkbox and its tooltip (`webapp/components/survey/NodeDefDetails/BasicProps/BasicProps.js:158-166`) already say: *"When a new record is created by a user belonging to a group, this attribute will be automatically filled with the value specified for it in the qualifiers of the user's group."*
- **User group side**: `UserGroup` (`core/user/userGroup/userGroup.ts`) stores `props.qualifiers` as an array of `{ name, value }` (`core/user/userGroup/userGroupQualifier.ts`), edited today only through the webapp (`UserGroupQualifiersEditor.tsx`).

Neither side is wired together yet — no code matches a qualifier's `name` to a node def, and record creation has no notion of user groups at all. This plan implements that missing link, plus makes the auto-filled attribute non-editable in the UI, while leaving it untouched (blank, editable) when the user has no group or the group has no matching qualifier.

**Group data access — no new export needed.** The group/qualifier data is served by `@openforis/arena-server`, which already contains the DB tables (`user_group`, `user_group_user`, migration `20260713124754-create-user-group-tables`) and an internal `UserGroupServiceServer.getManyByUser({ userUuid, surveyUuid })`. That service isn't a *named* export of the package, but it doesn't need to be: `ServerServiceType.userGroup` is already exported from `@openforis/arena-server`'s public index, and `registerServices()` — called automatically inside `ArenaServer.init()`, which this app already invokes at `server/system/appCluster.js:29` — already registers `UserGroupServiceServer` under that key into the `ServiceRegistry` singleton from `@openforis/arena-core` (also already a dependency here). This repo already uses the exact same service-locator pattern for a different service type in `server/utils/downloadAuthTokenUtils.js` and `server/system/schedulers/userTempAuthTokensCleanup.js`:

```js
import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

const userGroupService = ServiceRegistry.getInstance().getService(ServerServiceType.userGroup)
const userGroups = await userGroupService.getManyByUser({ userUuid, surveyUuid })
```

(Bonus, not needed for this task but worth noting: the full user-groups CRUD REST API is also already mounted automatically — `Api.init(express)`, called inside `ArenaServer.init()`, already calls `UserGroupApi.init(express)` — so the webapp's existing `/api/survey/:surveyId/user-groups` calls already work against the currently installed version; no server route file needs to be added in this repo for group management either.)

## Implementation

### 1. New node meta flag: `qualifierValueApplied`

File: `core/record/_node/nodeMeta.js`

Follow the exact existing pattern used for `defaultValue`/`isDefaultValueApplied`/`assocIsDefaultValueApplied` (lines 12-17, 22, 44-56):

- Add `qualifierValueApplied: 'qualifierValueApplied'` to `metaKeys`.
- Add reader `isQualifierValueApplied = R.pathOr(false, [keys.meta, metaKeys.qualifierValueApplied])`.
- Add writer `assocIsQualifierValueApplied(value)` mirroring `assocIsDefaultValueApplied` (delete the key when falsy, matching the "false by default" convention).
- Export both from the `NodeMeta` object.

File: `core/record/node.js` — add `isQualifierValueApplied` to the existing destructured re-export block at line ~119-126 (`export const { metaKeys, getMeta, isChildApplicable, ... } = NodeMeta`).

This flag marks a specific **node instance** (not the node def) as auto-filled, so it doesn't affect other records or get reset on reopen.

### 2. Server: apply qualifier values when a record is first created

Record creation only calls into node-creation logic once, the moment a genuinely empty record is opened: `RecordService.checkIn` (`server/modules/record/service/recordService.js:198-227`) posts a `recordInit` thread message only when `Record.getNodesArray(record).length === 0`, which is handled by `processRecordInitMsg` (`server/modules/record/service/update/thread/recordsUpdateThread.js:165-181`) calling `RecordManager.initNewRecord` (`server/modules/record/manager/_recordManager/recordUpdateManager.js:37-67`). This never re-runs for an already-initialized record, so it's the safe, one-shot hook point — no risk of clobbering user-entered values on reopen.

In `recordUpdateManager.js`, after `initNewRecord`'s existing call to `persistNode({ ...rootNode... })` creates the root entity and its descendants (min-count children, via arena-core's `RecordNodesUpdater.createDescendants`), add a new step that:

1. Finds qualifier node defs: `Survey.getNodeDefsArray(survey).filter(NodeDef.isQualifier)`. If empty, skip entirely (no group lookup needed).
2. Fetches the current user's group for this survey via the service locator: `ServiceRegistry.getInstance().getService(ServerServiceType.userGroup).getManyByUser({ userUuid: User.getUuid(user), surveyUuid: Survey.getUuid(survey) })` (imports: `ServiceRegistry` from `@openforis/arena-core`, `ServerServiceType` from `@openforis/arena-server` — see above). Take the first result — the app's own UI already treats group membership as single-group-per-survey (`webapp/views/App/views/Users/UserGroupEdit/UserGroupMembersEditor/useUserGroupMembersEditor.ts` reassigns rather than allowing multiple). If there's no group, stop here — nothing gets set, attributes stay editable (default behavior already satisfies this).
3. For each qualifier node def, find a matching qualifier in the group by name: `UserGroup.getQualifiers(userGroup).find((q) => UserGroupQualifier.getName(q) === NodeDef.getName(nodeDef))`. If no match, or the matched value is empty, skip this node def (leave unset/editable).
4. Resolve the node value:
   - **Code attribute** (`NodeDef.isCode(nodeDef)`): look up the category item by code via `CategoryItemProviderDefault.getItemByCode({ survey, categoryUuid: NodeDef.getCategoryUuid(nodeDef), code: qualifierValue })` (same provider already used in `recordCreationManager.js:79-120`'s sampling-point flow). If no item matches the code, skip (leave unset/editable — there's nothing valid to set). If found, build the value with `Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item), code: qualifierValue })`.
   - **Text attribute**: the value is just the raw string (text isn't in `valuePropsByType`, `core/survey/nodeValueProps.js`, so no wrapping needed).
5. Find the already-created node instance for this def under the root (`Record.getNodeChildrenByDefUuid(rootNode, NodeDef.getUuid(nodeDef))(record)`, single result since qualifiers can't be multiple) — it may already exist (blank, from min-count descendant creation) or not (optional attribute, minCount 0). Build the node to persist: `Node.assocValue(value)(existingNode ?? Node.newNode(NodeDef.getUuid(nodeDef), Record.getUuid(record), rootNode))`, then `Node.assocIsQualifierValueApplied(true)` on it.
6. Persist it through the existing `persistNode(...)` (same function `initNewRecord` already uses) so it goes through the normal insert-or-update, dependents-update, and RDB-persist pipeline — no new persistence path needed. Thread the returned `record` through each iteration.

Reference implementation to follow for the code-attribute-by-code lookup and value shape: `_fetchKeyValuesBySamplingPointDataItem` / `createRecordFromSamplingPointDataItem` in `server/modules/record/manager/_recordManager/recordCreationManager.js:55-120` — same category-item-by-code pattern, though that flow builds the whole record before first insert while this one updates already-persisted nodes via `persistNode`.

### 3. Webapp: make the auto-filled attribute non-editable

File: `webapp/components/survey/SurveyForm/nodeDefs/nodeDefSwitch.js`

`useEntryProps` (line 60-94) already resolves the node instances for a nodeDef under its parent into `nodes` (via `Record.getNodeChildrenByDefUuid`). In the component body:

- Near line 220 (`const editable = parentNode ? Node.isChildEditable(nodeDefUuid)(parentNode) : true`), add: `const qualifierValueApplied = entryProps.nodes[0] && Node.isQualifierValueApplied(entryProps.nodes[0])` (safe no-op for entities/multiple attributes, since qualifier defs are always single attributes with at most one node).
- Line 279's merged `readOnly` computation — extend it: `readOnly: readOnlyProp || readOnly || keyFieldLocked || !editable || qualifierValueApplied`.

This only affects the specific node instance that was auto-filled; if the user's group/qualifier doesn't match, the flag is never set and the attribute behaves exactly as it does today (editable).

## Verification

- Run the existing unit tests to confirm nothing broke: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js` (existing qualifier-related tests: `test/unit/tests/034canNodeDefBeQualifier.test.js`, `031userGroup.test.js`, `032userGroupValidator.test.js`).
- Manual end-to-end check via `yarn watch`:
  1. In a survey, flag a root-level text attribute and a root-level code attribute as qualifiers (checkbox added in a prior commit).
  2. Using the existing Users > User Groups UI (already functional against the live `UserGroupApi` routes), create a group with qualifiers matching the two attribute names, and add the test user as a member.
  3. Create a new record as that user: confirm both attributes are pre-filled (text: verbatim string; code: matching category item selected) and rendered read-only.
  4. Create a new record as a user not in any group, or in a group without a matching qualifier: confirm the attributes are blank and editable, matching current behavior.
  5. Confirm reopening an already-initialized record does not re-trigger or overwrite the auto-filled value if the user later edits it.
