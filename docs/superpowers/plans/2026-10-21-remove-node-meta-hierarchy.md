# Remove the node meta hierarchy (`meta.h`) – plan

Branch: `remove-node-meta-hierarchy`

## Goal

Stop storing `meta.h` (array of ancestor node uuids) in the `node` table and in the record nodes, and derive
the ancestors from `parent_uuid` / `parentUuid` instead.

- `meta.h` duplicates `parent_uuid`: every node stores all its ancestors, so it grows with depth × nodes
  and is the biggest part of `node.meta` in most surveys.
- It must be kept consistent by hand (`newNode`, `recordsCombiner._recalculateNodeHierarchy`,
  `RecordCloner`), and it is validated on mobile import because it can be wrong.

Out of scope: node **def** `meta.h` (stays), node `meta.hCode` (stays).

Repositories involved: **arena-core** (most of the readers), **arena**, **arena-mobile**, **arena-server**
(only for the survey schema DB migration). They are migrated and released together.

## Current usages

### arena-core (`src/`)

| Where | Use |
|---|---|
| `node/node.ts` (`NodeMetaKeys.h`, `NodeMeta.h`), `node/index.ts`, `index.ts` | type + exports |
| `node/factory.ts:23` | `NodeFactory` sets `meta.h` from the parent node |
| `node/nodes.ts:55` | `Nodes.getHierarchy` |
| `record/_records/recordGetters.ts:247` | `Records.isDescendantOf(node, ancestor)` (no record param) |
| `record/_records/recordNodesIndexUpdater.ts:16-18` | `addNodes` sorts nodes by `meta.h.length` (parents first) |
| `record/_records/recordPagesValidation.ts:37,121` | `nodeBelongsToPage`, `nodeIsUnderEntity` |
| `record/recordExpressionEvaluator/node/identifier/nodesFinder.ts:48-66` | ancestor / common ancestor of the context node, by index in `h` (**all expression evaluation**) |
| `record/recordCloner.ts:27-30,53-66` | sort by depth, remap `h` to the new uuids |
| `record/recordPrettyPrinter.ts:68,101` | indentation depth |

### arena – core / webapp

| Where | Use |
|---|---|
| `core/record/_node/nodeMeta.js:10,43` | `metaKeys.hierarchy`, `getHierarchy`; `compactMeta` keeps `h` |
| `core/record/node.js:134` | `Node.isDescendantOf(ancestor)(node)` |
| `core/record/node.js:152,160` | `newNode` / `newNodePlaceholder` set `h` (all `Node.newNode` callers: record updater, Collect/ODK import, record check job, webapp entity/code components, `store/ui/record/actions/create.js`) |
| `core/record/_record/recordsCombiner.js:180-184,203` | recalculates `h` on merge / replace |
| `core/record/_record/recordNodesCompactor.ts:54` | interns `h` uuids |
| webapp | no direct use; indirectly via arena-core (page validation hooks, expressions) |

### arena – server JS

| Where | Use |
|---|---|
| `record/manager/_recordManager/nodeUpdateManager.js:325` | `Node.isDescendantOf`: file nodes of a deleted preview subtree |
| `record/manager/_recordManager/nodeUpdateManager.js:340-342` | `nodeDelete` activity log content stores `h` (never read back) |
| `record/service/update/thread/recordsUpdateThread.js:32` | `getNodeAndDescendants` via `Node.isDescendantOf` |
| `recordCreationManager.js:105`, `surveyRdb/repository/dataTableUpdateRepository.js:81-84`, `mobile/.../recordsImportJob.js:255` | sort nodes by `h.length` (parents before children, FK) |
| `mobile/.../recordNodeChecks.js:54-62,90` | "invalid meta hierarchy" check on mobile import |
| `record/repository/nodeRepository.js:228-232,271-273,336-363` | insert / batch insert / update write `h` |

### arena – SQL

| Where | Use |
|---|---|
| `nodeRepository.js:71-76` `_getAncestorUuidSelectField` | `(meta->'h'->>i)::uuid AS ancestor_uuid`, used by `dataTableInsertRepository.js` to **populate the RDB data tables** (child attributes joined to their table entity) |
| `nodeRepository.js:184-221` `fetchFileValueNodesByNodeDefUuids` | `meta->'h' ?| (...)`: file nodes under purged node defs |
| `common/model/db/tables/node/select.js:52-61` | `parentUuid IN jsonb_array_elements_text(meta->'h')`: **data explorer edit mode** (attributes inside single entities); also `node/read.js:20` (`fetchNodes`, apparently unused) |
| `surveyRdb/repository/nodeHierarchyDisaggregatedViewRepository.js:32` | `_node_hierarchy_disaggregated` view → `_node_keys_hierarchy` view → validation report, node keys, activity log |

No DB migration creates or indexes `meta.h`; the `node` table already has `parent_uuid` (FK `ON DELETE CASCADE`,
index `node_parent_uuid_idx`). Node deletion does not depend on `h`.

### arena-mobile

- Records are stored as JSON in `record.content` (no node table); no SQL on `$.meta.h`.
- Direct use: `src/screens/RecordEditor/PagesNavigationTree/useTreeData.ts:28` (`Nodes.getHierarchy(currentEntity)`).
- Test fixture: `src/service/demoSurvey.test.ts:512`.
- Indirect: arena-core `NodeFactory`, `addNodes` sort (on record load when `_nodesIndex` is missing), `RecordCloner`
  (`cloneRecordsIntoDefaultCycle`), expression `nodesFinder`.
- Records exchanged with the server (download: `records/export`; upload: mobile import zip) carry full node meta.

## Replacement strategy

The whole record is in memory wherever the in-memory readers run, so ancestors can be obtained walking
`parentUuid` (`Records.getParent`, `getAncestor`, `visitAncestorsAndSelf`, already allocation-free).
The depth of a node equals the length of its node def `meta.h`, which can be used wherever the survey is available.

### arena-core (minor release, `feat:` PR title)

arena-core, arena, arena-server and arena-mobile are migrated together and arena-core has no other consumers,
so nothing is deprecated: what is no longer used is deleted in the same change, released as a minor version.

1. Change / add record-aware getters (curried, record last, allocation-free where possible):
   - `Records.isDescendantOf(node, ancestor)(record)`: walks up from `node` via `parentUuid` (signature changes:
     the record is now needed);
   - `Records.getNodeDepth(node)(record)`: number of `parentUuid` hops.
2. Replace the readers:
   - `nodesFinder`: ancestor = `Records.getAncestor(nodeContext, nodeDefReferenced.parentUuid)` (context entity included
     when it is an entity, as now); common ancestor = `getAncestor` with the last common node def of the two node defs `meta.h`
     (already done in `recordGetters.ts:330` for dependents).
   - `recordPagesValidation`: `visitAncestorsAndSelf` / `isDescendantOf`.
   - `recordNodesIndexUpdater.addNodes`: sort by depth computed once per call (`Map<uuid, depth>` memoized over
     `parentUuid`, using both the nodes being added and the record nodes), or a parents-first traversal; no per-comparison walk.
   - `RecordCloner`: same depth sort; remove the `h` remapping (keep `parentUuid` remapping).
   - `RecordPrettyPrinter`: `getNodeDepth`.
3. `NodeFactory` no longer sets `meta.h`.
4. Delete `Nodes.getHierarchy`, `NodeMetaKeys` (`h` is its only key), `NodeMeta.h` and their exports.
5. Tests: build records without `meta.h` (update `RecordBuilder` / fixtures) and run the record updater,
   expression evaluator, pages validation and cloner suites on them.

### arena

Code (after bumping arena-core; keep arena-core deduped with arena-server):

1. `core/record`:
   - `Node.isDescendantOf` → arena-core `Records.isDescendantOf(node, ancestor)(record)`; update
     `nodeUpdateManager.js:325`, `recordsUpdateThread.js:32`; delete `Node.isDescendantOf`.
   - `newNode` / `newNodePlaceholder`: stop setting `h`.
   - `recordsCombiner`: keep `parentUuid` fix-up, drop `h` recalculation.
   - `recordNodesCompactor`: drop `h` interning; `nodeMeta`: delete `metaKeys.hierarchy` and `getHierarchy`.
2. Server sorts by depth (`recordCreationManager`, `dataTableUpdateRepository`, mobile `recordsImportJob`): sort by
   `NodeDef.getMetaHierarchy(nodeDef).length` (survey available, O(1)).
3. `recordNodeChecks`: replace the `h` check with a parent check: parent node exists in the record and its node def
   is `NodeDef.getParentUuid(nodeDef)` (stricter and independent of `h`).
4. Writes: `insertNode`, `insertNodesInBatch`, `updateNode(s)` strip `h` from meta (old backups and records uploaded
   by old mobile versions still carry it); `nodeDelete` activity log content without `h`.
5. SQL:
   - **`_getAncestorUuidSelectField` (RDB population)**: the depth difference between a node and `ancestorDef` is known
     per node def but `c` selects nodes of several defs/depths. Build a bounded parent chain:
     `LEFT JOIN node p1 ON p1.uuid = n.parent_uuid LEFT JOIN node p2 ON p2.uuid = p1.parent_uuid ...` up to the
     max depth difference (from node defs `meta.h`), and select
     `COALESCE(CASE WHEN p1.node_def_uuid = $ancestorDef THEN p1.uuid END, CASE WHEN p2... END, ...)`.
     Joins are on the `node` primary key; depth is small (usually 1-3).
   - **`select.js` data explorer edit**: same bounded chain (or `EXISTS` on the chain) instead of
     `jsonb_array_elements_text(meta->'h')`. Remove `node/read.js` `fetchNodes` if confirmed unused.
   - **`fetchFileValueNodesByNodeDefUuids`**: use the node **def** hierarchy:
     `nd.uuid IN (...) OR nd.meta->'h' ?| ARRAY[...]` (all nodes of those defs and their descendants are purged anyway);
     no node-level hierarchy needed.
   - **`_node_hierarchy_disaggregated` view**: rewrite with `WITH RECURSIVE` over `parent_uuid`. Risk: Postgres does
     not push the consumers' filters (record / node uuids) into a recursive CTE, so the view would walk the whole survey.
     Preferred: drop the view and let the consumers (`_node_keys_hierarchy` view users: validation report, node keys,
     activity log) seed the recursive CTE with the nodes of the current page (functions or query builders instead of views).
     Benchmark on a large survey (survey stress-test data) before/after.
   - RDB views are recreated on survey publish / RDB refresh: make sure existing surveys get the new views
     (data migration step that regenerates the views, or full RDB refresh).
6. Test data: `test/load/lib/sampleSurveyZip.ts` (node `h`), unit tests `nodeMetaCompact.test.ts`,
   `recordNodesCompactor.test.ts`; add integration tests for data explorer edit mode and RDB population with nested
   single entities, and for preview node deletion with files.

### DB data migration (arena-server + arena)

- arena-server: new survey schema migration (`yarn dbmigrate:create --name=update-node-meta-remove-hierarchy --schema=survey`),
  templated on `20261008100000-update-node-meta-remove-default-values`: `UPDATE node SET meta = meta - 'h' WHERE meta ? 'h'`.
  Large surveys: consider batching by record. Down migration not possible (data loss) → empty/no-op.
- arena: per-survey data migration step in `surveyDataMigrationSteps.ts` with `migrateAfterCommit` running
  `vacuumFullNodeTable` (as in step 2.9.8) to reclaim space; RDB views regeneration step (see above).

### arena-mobile

1. Bump arena-core to the new release.
2. `useTreeData.ts:28`: use `Records.getAncestorsAndSelf(currentEntity)(record)` (or `visitAncestorsAndSelf`).
3. `demoSurvey.test.ts:512`: remove `meta.h` from the fixture.
4. Records already stored in SQLite keep `h`: harmless once nothing reads it. Optionally strip it in
   `DataMigrationService` (rewrite `record.content`, with a new `PRAGMA user_version` bump) to save space;
   the server strips it on import anyway.

## Mobile app / server compatibility check

Installed app versions read `h` through their arena-core (expressions, index sort, cloning): with records downloaded
from a server that no longer sends `h`, data entry breaks silently. When downloading records the app is online,
so the user can update it: the server must tell the app that it is too old, and the app must say so.

Current state:

- the app already checks the store version (`react-native-check-version` in `VersionNumberInfoButton.tsx`,
  `UpdateStatus.notUpToDate` + store `url`), but only to show an icon next to the version number;
- the server exposes `GET /api/version` (Arena version), not used by the app;
- the app sends its `appInfo` only inside the uploaded zip (`info.json`), the server ignores it;
- `POST /api/survey/:surveyId/records/export` (records download) is used only by the app.

Proposed mechanism (a generic one, reusable for future breaking changes):

1. **arena** `common/` (e.g. `common/mobile/mobileAppCompatibility.ts`), two constants:
   - `minMobileAppVersionRecordsDownload`: records download (and survey download for mobile);
   - `minMobileAppVersionRecordsUpload`: mobile records import.

   Both start at `0.0.0` (no app blocked). This change raises only the download one; the upload one stays
   unused for now (old apps uploading records with `h` are fine, the server strips it) and is there for future changes.
2. **arena-mobile**: send `X-Arena-Mobile-App-Version` (and platform) on every request (`RemoteService` /
   `apiAxios`, next to the auth headers).
3. **arena** server: middleware on the mobile endpoints, configured with the constant of the endpoint
   (download: records export + export download, survey download for mobile; upload: `POST /mobile/survey/:surveyId`):
   if the header version (missing header = `0.0.0`, i.e. an app older than this mechanism) is lower than the minimum,
   respond `426 Upgrade Required` with a `SystemError` key `appVersionNotSupported` and params `{ minVersion }`.
4. **arena** server: extend `GET /api/version` with both minimum versions, so the app can check proactively.
5. **arena-mobile**:
   - after login / on connection, and before records download, sync, upload or survey update: call `api/version`;
     if the app version is lower than the minimum of the operation, show a blocking dialog
     ("This version of Arena Mobile is not compatible with the server, please update it") with an
     **Update** button opening the store url (reuse `checkVersion()` / `updateUrl` from `VersionNumberInfoButton`);
   - map the `426` / `appVersionNotSupported` response to the same dialog (fallback for any request);
   - localize the messages (all supported languages).
6. Versions released before this mechanism send no header: once the minimum is raised they get the `426`,
   shown as a generic error, not as the update dialog. Hence the compatibility check ships **first, in its own PRs
   and releases** (minimums at `0.0.0`), well before the `meta.h` removal, so most devices already have it when
   the minimum is raised. Optionally the `426` response body carries an English `message`, in case the old app
   displays the server message.

## Work split / rollout

Two separate pieces of work, each with one PR per involved repository:

1. **Mobile app compatibility check** (arena + arena-mobile): steps 1-6 above, minimums at `0.0.0`.
   Released and published to the stores first.
2. **Node meta hierarchy removal** (arena-core, arena-server, arena, arena-mobile), released together:
   - arena-core minor release;
   - arena-server survey schema migration;
   - arena: code changes, `minMobileAppVersionRecordsDownload` raised to the arena-mobile version shipping the
     new arena-core;
   - arena-mobile: arena-core bump and code changes.

   On server deploy: DB migration (`meta - 'h'`), VACUUM FULL and RDB views regeneration run per survey.

## Open questions

- Acceptable performance of the recursive CTE for node keys hierarchy (validation report, activity log) on the largest
  surveys: to be measured; fallback is computing the keys hierarchy in JS from the loaded record nodes.
- How an outdated app (before the compatibility check) displays the `426` error: verify on a current build.
- Whether to also strip `h` from records already stored on devices (step 4 in arena-mobile), or leave them.

## Verification

- arena-core: `yarn lint`, `yarn typecheck`, `yarn test:coverage`, including tests on records without `h`.
- arena: `yarn test:unit`, `yarn test:integration`, e2e record editing / data explorer / validation report;
  query plans and timings for RDB population and node keys hierarchy on a large survey.
- arena-mobile: `yarn test:types`, `yarn test`, Maestro suite; manual sync round-trip with server
  (download → edit → upload, merge); an outdated build must show the update dialog (or the error, for builds
  older than the compatibility check) and not download records.
