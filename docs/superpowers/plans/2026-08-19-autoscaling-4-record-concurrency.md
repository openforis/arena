# Heroku Auto-Scaling — Record Concurrency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With N Heroku dynos, two users (or two tabs) editing the same record must not silently clobber each other's changes or see stale validation state, a record's WebSocket delivery must work regardless of which dyno holds the socket vs. which dyno processes the edit, and a survey-structure change must invalidate every dyno's cached copy immediately instead of after a 10-minute idle timeout.

**Architecture:** Each dyno keeps its own per-dyno worker thread (`RecordsUpdateThread`) with an in-memory `surveysDataCache`/`recordsCache` — unchanged, this design exists for CPU offloading and stays. Three things move to Postgres: (1) `recordSocketsMap.js`'s in-memory `socketIdsByRecordUuid` Map becomes a thin wrapper around `RecordSocketAssociationRepository` (already implemented in `@openforis/arena-server`) so a record's socket check-in and a later node update can land on different dynos and still find each other; (2) every node persist/delete/init/reload in `recordsUpdateThread.js` acquires a transaction-scoped Postgres advisory lock keyed by `hashtext(recordUuid)` before touching the record, and re-fetches from the DB if the cached copy's `date_modified` doesn't match the DB's current value (another dyno committed a change since this dyno cached it); (3) `clearSurveyDataFromThread`/`clearRecordDataFromThread` publish on the `ClusterBus` (already implemented in `@openforis/arena-server`) instead of only messaging this dyno's own local thread, so every dyno invalidates its cache immediately.

**Tech Stack:** `RecordSocketAssociationRepository`, `ClusterBus`, `WebSocketServer` (all from `@openforis/arena-server`), Postgres `pg_advisory_xact_lock`/`hashtext`, existing `RecordManager`/`RecordsUpdateThread` worker-thread infrastructure.

## Global Constraints

- No Redis — Postgres-only, per the design spec's decision table (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md` §3).
- Requires `docs/superpowers/plans/2026-08-19-autoscaling-0-dependency-setup.md` (both tasks — this plan needs `RecordSocketAssociationRepository`, only exported from arena-server's package entry point after Task 1 of that plan, and `ClusterBus` — already exported today, but only reachable through the sibling checkout after Task 2's portal link).
- **Verified during research, not something this plan needs to add**: `record.date_modified` is already bumped inside the same transaction as every node persist/delete (`server/modules/record/manager/_recordManager/recordUpdateManager.js` — `_afterNodesUpdate` calls `RecordRepository.updateRecordDateModified({ surveyId, recordUuid }, t)` inside the same `client.tx(...)` that `persistNode`/`deleteNode` open internally, confirmed at the call site). This plan only needs to *read* it for the staleness check (Task 3) — no new column, no new write path.
- **`RecordManager.persistNode(params, client = db)` and `RecordManager.deleteNode(user, survey, record, nodeUuid, timezoneOffset, nodesUpdateListener, nodesValidationListener, t = db)` already open their own `client.tx(async (t) => {...})` internally** (`_updateNodeAndValidateRecordUniqueness` in `server/modules/record/manager/_recordManager/recordUpdateManager.js`). Passing an already-open transaction client as `client`/`t` is supported (pg-promise nests it on the same connection) — this is how Task 3 makes the advisory lock (acquired on an outer transaction) cover the same underlying Postgres transaction as the node write, so it's held for the write's whole duration and auto-released on commit/rollback. Note the inconsistent parameter naming/position between the two functions: `persistNode`'s is a trailing `client` inside an options object; `deleteNode`'s is a trailing **positional** `t` argument.
- `WebSocketServer.isSocketConnected(socketId)` is now `async` in the sibling repo's `feat/auto-scaling` branch (`../arena-server/src/webSocket/server.ts:1838`: `static async isSocketConnected(socketId: string): Promise<boolean>`) — it was synchronous in the currently-published `1.3.27`. `server/modules/record/service/update/surveyRecordsThreadService.js`'s existing `if (WebSocketServer.isSocketConnected(socketId))` check does **not** currently `await` this call; once the dependency is bumped (Plan 0), that `if` would always be truthy (a `Promise` object is always truthy), silently breaking the "self-heal on stale socket" branch. Task 2 below fixes this as part of the same rewrite (unavoidable — this file needs touching anyway for the async `getSocketIdsByRecordUuid` change).

---

### Task 1: Replace `recordSocketsMap.js`'s in-memory Map with `RecordSocketAssociationRepository`

**Files:**
- Modify: `server/modules/record/service/update/recordSocketsMap.js`
- Modify: `server/modules/record/service/recordService.js:211,253,282-327,329-341`
- Modify: `server/modules/auth/api/authApi.js:70`
- Test: `test/unit/tests/recordSocketsMap.test.js` (new)

**Interfaces:**
- Consumes: `RecordSocketAssociationRepository` from `@openforis/arena-server` (`assocSocket`, `dissocSocket`, `dissocSocketBySocketId`, `dissocSocketsByRecordUuid`, `getSocketIdsByRecordUuid` — all verified against `../arena-server/src/repository/recordSocketAssociation/*.ts`, all `async`, all DB-backed).
- Produces: `RecordSocketsMap.assocSocket({ recordUuid, socketId }): Promise<void>`, `.dissocSocket({ recordUuid, socketId }): Promise<void>`, `.dissocSocketBySocketId(socketId): Promise<void>`, `.dissocSocketsByRecordUuid(recordUuid): Promise<void>`, `.getSocketIdsByRecordUuid(recordUuid): Promise<string[]>` — **all now return Promises; `getSocketIdsByRecordUuid` now returns an `Array`, not a `Set`** (previously `Set<string>`). Consumed by Task 2 (`surveyRecordsThreadService.js`'s `notifyRecordUpdateToSockets`/`notifyRecordDeleteToSockets`, which already iterate with `.forEach`/`for...of`, compatible with either type — no further change needed there beyond Task 2's own async rewrite).

**Note (established while executing an earlier plan in this series, and refined further while executing this one):** `jest.mock('@openforis/arena-server', ...)` does not work reliably in this repo's bundled unit-test setup (object-spread-in-factory + webpack's single shared external-module object across the whole bundle making load order matter) — use `jest.spyOn(RealModule, 'methodName')` instead, which mutates the method directly on the shared object. But `jest.spyOn` only works if the code under test does a **live property lookup at call time** (`SomeNamespace.someMethod(...)`) — it does NOT work if the code captured the function via **destructuring at module-load time** (`const { someMethod } = SomeNamespace`), since that copies the function reference once, before any `beforeAll`/spy setup runs, and the local binding never changes afterward even if the source object's property is later reassigned. This changes `recordSocketsMap.js`'s implementation below from a destructuring re-export to explicit wrapper functions that look up `RecordSocketAssociationRepository`'s methods fresh on every call — functionally identical in production, but testable via `jest.spyOn`.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/recordSocketsMap.test.js`:

```js
import { RecordSocketAssociationRepository } from '@openforis/arena-server'
import * as RecordSocketsMap from '../../../server/modules/record/service/update/recordSocketsMap'

describe('recordSocketsMap', () => {
  let assocSocketSpy
  let getSocketIdsByRecordUuidSpy

  beforeAll(() => {
    assocSocketSpy = jest.spyOn(RecordSocketAssociationRepository, 'assocSocket')
    getSocketIdsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'getSocketIdsByRecordUuid')
  })

  afterAll(() => {
    assocSocketSpy.mockRestore()
    getSocketIdsByRecordUuidSpy.mockRestore()
  })

  beforeEach(() => {
    assocSocketSpy.mockReset().mockResolvedValue(undefined)
    getSocketIdsByRecordUuidSpy.mockReset().mockResolvedValue(['socket-1', 'socket-2'])
  })

  test('assocSocket forwards to RecordSocketAssociationRepository', async () => {
    await RecordSocketsMap.assocSocket({ recordUuid: 'record-1', socketId: 'socket-1' })
    expect(assocSocketSpy).toHaveBeenCalledWith({
      recordUuid: 'record-1',
      socketId: 'socket-1',
    })
  })

  test('getSocketIdsByRecordUuid forwards and resolves with the repository result', async () => {
    const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid('record-1')
    expect(getSocketIdsByRecordUuidSpy).toHaveBeenCalledWith('record-1')
    expect(socketIds).toEqual(['socket-1', 'socket-2'])
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "recordSocketsMap"`
Expected: FAIL — `recordSocketsMap.js` still uses a local `Map`, doesn't import `RecordSocketAssociationRepository`.

- [ ] **Step 3: Rewrite `recordSocketsMap.js`**

Replace the full file content:

```js
import { RecordSocketAssociationRepository } from '@openforis/arena-server'

export const assocSocket = (...args) => RecordSocketAssociationRepository.assocSocket(...args)
export const dissocSocket = (...args) => RecordSocketAssociationRepository.dissocSocket(...args)
export const dissocSocketBySocketId = (...args) => RecordSocketAssociationRepository.dissocSocketBySocketId(...args)
export const dissocSocketsByRecordUuid = (...args) =>
  RecordSocketAssociationRepository.dissocSocketsByRecordUuid(...args)
export const getSocketIdsByRecordUuid = (...args) =>
  RecordSocketAssociationRepository.getSocketIdsByRecordUuid(...args)
```

(Explicit wrapper functions rather than `export const { ... } = RecordSocketAssociationRepository` destructuring — functionally identical in production, but destructuring would capture each function reference once at module-load time, which `jest.spyOn(RecordSocketAssociationRepository, ...)` cannot retroactively affect. These wrappers do a live property lookup on every call, so tests can spy on `RecordSocketAssociationRepository`'s methods directly.)

- [ ] **Step 4: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "recordSocketsMap"`
Expected: PASS.

- [ ] **Step 5: Await the now-async calls in `recordService.js`**

In `server/modules/record/service/recordService.js`:

Change line 211 (inside `checkIn`, already an `async` function) from:

```js
  RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })
```

to:

```js
  await RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })
```

Change line 253 (inside `checkOut`, already an `async` function) from:

```js
  RecordsUpdateThreadService.dissocSocket({ recordUuid, socketId })
```

to:

```js
  await RecordsUpdateThreadService.dissocSocket({ recordUuid, socketId })
```

Change `_sendNodeUpdateMessage` (currently a synchronous arrow function) from:

```js
const _sendNodeUpdateMessage = ({ socketId, user, recordUuid, msg }) => {
  RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })

  const thread = RecordsUpdateThreadService.getOrCreatedThread()
  thread.postMessage(msg, user)
}
```

to:

```js
const _sendNodeUpdateMessage = async ({ socketId, user, recordUuid, msg }) => {
  await RecordsUpdateThreadService.assocSocket({ recordUuid, socketId })

  const thread = RecordsUpdateThreadService.getOrCreatedThread()
  thread.postMessage(msg, user)
}
```

Change the `persistNode` export's call to `_sendNodeUpdateMessage` (line 321) from:

```js
  _sendNodeUpdateMessage({
    socketId,
    user,
    recordUuid,
    msg: { type: RecordsUpdateThreadMessageTypes.nodePersist, surveyId, cycle, draft, node, user, timezoneOffset },
  })
```

to:

```js
  await _sendNodeUpdateMessage({
    socketId,
    user,
    recordUuid,
    msg: { type: RecordsUpdateThreadMessageTypes.nodePersist, surveyId, cycle, draft, node, user, timezoneOffset },
  })
```

`deleteNode`'s call (originally line 329-330, `export const deleteNode = ({...}) => _sendNodeUpdateMessage({...})`) needs no change — it's a direct-return arrow function, so it already correctly returns `_sendNodeUpdateMessage`'s (now-)Promise to its own caller.

- [ ] **Step 6: Await the now-async call in `authApi.js`**

In `server/modules/auth/api/authApi.js:70`, inside the already-`async` `/auth/logout` handler, change:

```js
      RecordService.dissocSocketFromUpdateThread(socketId)
```

to:

```js
      await RecordService.dissocSocketFromUpdateThread(socketId)
```

- [ ] **Step 7: Run the broader record test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "record"`
Expected: PASS, no regressions.

- [ ] **Step 8: Commit**

```bash
git add server/modules/record/service/update/recordSocketsMap.js server/modules/record/service/recordService.js server/modules/auth/api/authApi.js test/unit/tests/recordSocketsMap.test.js
git commit -m "feat: back record-socket associations with a DB table so check-in and delivery can happen on different dynos"
```

---

### Task 2: Fix `notifyRecordUpdateToSockets`/`notifyRecordDeleteToSockets` for the now-async socket lookups

**Files:**
- Modify: `server/modules/record/service/update/surveyRecordsThreadService.js`
- Modify: `server/modules/record/service/recordService.js:175`
- Test: `test/unit/tests/surveyRecordsThreadServiceNotify.test.js` (new)

**Interfaces:**
- Consumes: `RecordSocketsMap.getSocketIdsByRecordUuid`/`.dissocSocket`/`.dissocSocketsByRecordUuid` (Task 1, now `async`), `WebSocketServer.isSocketConnected` (now `async` per Global Constraints).
- Produces: `RecordsUpdateThreadService.notifyRecordDeleteToSockets({ socketIdUser, recordUuid, notifySameUser }): Promise<void>` (was sync-returning `undefined` before, now returns a Promise — its one external caller, `recordService.js:175`, is updated in this task to `await` it).

- [ ] **Step 1: Write the failing test**

**Note (established while executing this plan's Task 1, and an earlier plan in this series):** `jest.mock('@openforis/arena-server', ...)` does not work reliably in this repo's bundled unit-test setup (object-spread-in-factory issues plus webpack's single shared external-module object across the whole bundle making load order matter) — use `jest.spyOn(RealModule, 'methodName')` instead. This also requires `recordSocketsMap.js` (Task 1) to use live-lookup wrapper functions rather than destructuring, specifically so spying on `RecordSocketAssociationRepository`'s methods correctly propagates through to `surveyRecordsThreadService.js`'s calls to `RecordSocketsMap.getSocketIdsByRecordUuid(...)` etc. — already done in Task 1, nothing further needed here beyond spying at the `RecordSocketAssociationRepository`/`WebSocketServer` layer directly (the deepest layer both call chains resolve through at call time).

Create `test/unit/tests/surveyRecordsThreadServiceNotify.test.js`:

```js
import { WebSocketServer, WebSocketEvent, RecordSocketAssociationRepository } from '@openforis/arena-server'
import { RecordsUpdateThreadService } from '../../../server/modules/record/service/update/surveyRecordsThreadService'

describe('RecordsUpdateThreadService notify functions', () => {
  let getSocketIdsByRecordUuidSpy
  let dissocSocketsByRecordUuidSpy
  let isSocketConnectedSpy
  let notifySocketSpy

  beforeAll(() => {
    getSocketIdsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'getSocketIdsByRecordUuid')
    dissocSocketsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'dissocSocketsByRecordUuid')
    isSocketConnectedSpy = jest.spyOn(WebSocketServer, 'isSocketConnected')
    notifySocketSpy = jest.spyOn(WebSocketServer, 'notifySocket')
  })

  afterAll(() => {
    getSocketIdsByRecordUuidSpy.mockRestore()
    dissocSocketsByRecordUuidSpy.mockRestore()
    isSocketConnectedSpy.mockRestore()
    notifySocketSpy.mockRestore()
  })

  beforeEach(() => {
    getSocketIdsByRecordUuidSpy.mockReset()
    dissocSocketsByRecordUuidSpy.mockReset().mockResolvedValue(undefined)
    isSocketConnectedSpy.mockReset()
    notifySocketSpy.mockReset()
  })

  test('notifyRecordDeleteToSockets awaits the async socket lookup before notifying', async () => {
    getSocketIdsByRecordUuidSpy.mockResolvedValue(['socket-1', 'socket-2'])

    await RecordsUpdateThreadService.notifyRecordDeleteToSockets({
      socketIdUser: 'socket-1',
      recordUuid: 'record-1',
      notifySameUser: false,
    })

    expect(notifySocketSpy).toHaveBeenCalledTimes(1)
    expect(notifySocketSpy).toHaveBeenCalledWith('socket-2', WebSocketEvent.recordDelete, 'record-1')
    expect(dissocSocketsByRecordUuidSpy).toHaveBeenCalledWith('record-1')
  })
})
```

(`WebSocketEvent` is a plain object of string constants, not a function — it doesn't need spying/mocking, just a normal import, used directly in the assertion above.)

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "notify functions"`
Expected: FAIL — the current `notifyRecordDeleteToSockets` treats `getSocketIdsByRecordUuid`'s return value synchronously (iterating a `Promise` with `.forEach` does nothing, since a Promise has no `.forEach`, so this would actually throw a `TypeError` today once Task 1 lands, or simply never call `notifySocket` in this mocked test).

- [ ] **Step 3: Rewrite the notify functions to await the async socket lookup and connectivity check**

In `server/modules/record/service/update/surveyRecordsThreadService.js`, add a logger import (none exists in this file today) and replace the `// ====== WebSocket notification` section:

Change the import block from:

```js
import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import ThreadManager from '@server/threads/threadManager'

import { RecordsUpdateThreadMessageTypes } from './thread/recordsThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'
```

to:

```js
import { WebSocketEvent, WebSocketServer } from '@openforis/arena-server'

import * as Log from '@server/log/log'
import ThreadManager from '@server/threads/threadManager'

import { RecordsUpdateThreadMessageTypes } from './thread/recordsThreadMessageTypes'
import { SurveyRecordsThreadMap } from './surveyRecordsThreadMap'
import * as RecordSocketsMap from './recordSocketsMap'

const Logger = Log.getLogger('SurveyRecordsThreadService')
```

Change the `handleMessageFromThread` function (inside `_createThread`) from:

```js
  const handleMessageFromThread = (msg) => {
    const { type, content } = msg
    if (type === RecordsUpdateThreadMessageTypes.threadKill) {
      if (SurveyRecordsThreadMap.isZombie(threadKey)) {
        clearTimeout(threadTimeouts[threadKey])
        delete threadTimeouts[threadKey]

        const thread = getThreadByKey(threadKey)
        thread.terminate()
      }
    } else {
      notifyRecordUpdateToSockets({ eventType: type, content })
    }
  }
```

to:

```js
  const handleMessageFromThread = (msg) => {
    const { type, content } = msg
    if (type === RecordsUpdateThreadMessageTypes.threadKill) {
      if (SurveyRecordsThreadMap.isZombie(threadKey)) {
        clearTimeout(threadTimeouts[threadKey])
        delete threadTimeouts[threadKey]

        const thread = getThreadByKey(threadKey)
        thread.terminate()
      }
    } else {
      notifyRecordUpdateToSockets({ eventType: type, content }).catch((error) =>
        Logger.error(`error notifying record update to sockets: ${error}`)
      )
    }
  }
```

Change the `// ====== WebSocket notification` section from:

```js
// ====== WebSocket notification

const { assocSocket, dissocSocket, dissocSocketBySocketId } = RecordSocketsMap

const notifyRecordUpdateToSockets = ({ eventType, content }) => {
  const { recordUuid } = content
  const socketIds = RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (WebSocketServer.isSocketConnected(socketId)) {
      WebSocketServer.notifySocket(socketId, eventType, content)
    } else {
      // socket has been disconnected without checking out the record
      RecordSocketsMap.dissocSocket({ recordUuid, socketId })
    }
  })
}

const notifyRecordDeleteToSockets = ({ socketIdUser, recordUuid, notifySameUser = true }) => {
  // Notify other users viewing or editing the record it has been deleted
  const socketIds = RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (socketId !== socketIdUser || notifySameUser) {
      WebSocketServer.notifySocket(socketId, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  RecordSocketsMap.dissocSocketsByRecordUuid(recordUuid)
}
```

to:

```js
// ====== WebSocket notification

const { assocSocket, dissocSocket, dissocSocketBySocketId } = RecordSocketsMap

const notifyRecordUpdateToSockets = async ({ eventType, content }) => {
  const { recordUuid } = content
  const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  for (const socketId of socketIds) {
    if (await WebSocketServer.isSocketConnected(socketId)) {
      WebSocketServer.notifySocket(socketId, eventType, content)
    } else {
      // socket has been disconnected without checking out the record
      await RecordSocketsMap.dissocSocket({ recordUuid, socketId })
    }
  }
}

const notifyRecordDeleteToSockets = async ({ socketIdUser, recordUuid, notifySameUser = true }) => {
  // Notify other users viewing or editing the record it has been deleted
  const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid(recordUuid)
  socketIds.forEach((socketId) => {
    if (socketId !== socketIdUser || notifySameUser) {
      WebSocketServer.notifySocket(socketId, WebSocketEvent.recordDelete, recordUuid)
    }
  })
  await RecordSocketsMap.dissocSocketsByRecordUuid(recordUuid)
}
```

- [ ] **Step 4: Await the now-async call in `recordService.js`**

In `server/modules/record/service/recordService.js:175`, inside `deleteRecord` (already an `async` function), change:

```js
  RecordsUpdateThreadService.notifyRecordDeleteToSockets({ socketIdUser: socketId, recordUuid, notifySameUser })
```

to:

```js
  await RecordsUpdateThreadService.notifyRecordDeleteToSockets({ socketIdUser: socketId, recordUuid, notifySameUser })
```

- [ ] **Step 5: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "notify functions"`
Expected: PASS.

- [ ] **Step 6: Run the broader record test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "record"`
Expected: PASS, no regressions.

- [ ] **Step 7: Commit**

```bash
git add server/modules/record/service/update/surveyRecordsThreadService.js server/modules/record/service/recordService.js test/unit/tests/surveyRecordsThreadServiceNotify.test.js
git commit -m "fix: await the now-async socket lookup and connectivity check in record-update WebSocket notification"
```

---

### Task 3: Advisory lock and staleness check for record mutations

**Files:**
- Modify: `server/modules/record/repository/recordRepository.js`
- Modify: `server/modules/record/manager/recordManager.js`
- Modify: `server/modules/record/service/update/thread/recordsUpdateThread.js`
- Test: `test/integration/tests/_record/recordConcurrencyLockTest.js` + `test/integration/tests/013recordConcurrencyLockTest.js` (new — this task needs a real Postgres connection to test advisory locking meaningfully, so it belongs in `test/integration/`, not `test/unit/`, matching the existing two-file convention already used for record-update tests at `test/integration/tests/003recordUpdatertest.js` and `test/integration/tests/_record/recordUpdateManagerTest.js`)

**Interfaces:**
- Consumes: `RecordManager.fetchRecordAndNodesByUuid`, `RecordManager.persistNode`, `RecordManager.deleteNode`, `RecordManager.initNewRecord` (all pre-existing, verified signatures per Global Constraints above), `db` from `@server/db/db`.
- Produces: `RecordRepository.fetchRecordDateModified({ surveyId, recordUuid }, client?): Promise<Date|null>` (new), re-exported as `RecordManager.fetchRecordDateModified`.

- [ ] **Step 1: Add `fetchRecordDateModified` to the record repository**

In `server/modules/record/repository/recordRepository.js`, add near `updateRecordDateModified` (the existing function already using `getSchemaSurvey`/`DbUtils.selectDate` — follow the same pattern):

```js
export const fetchRecordDateModified = async ({ surveyId, recordUuid }, client = db) => {
  const row = await client.oneOrNone(
    `SELECT ${DbUtils.selectDate('date_modified')} AS date_modified
     FROM ${getSchemaSurvey(surveyId)}.record
     WHERE uuid = $1`,
    [recordUuid]
  )
  return row?.date_modified ?? null
}
```

- [ ] **Step 2: Re-export it from `RecordManager`**

In `server/modules/record/manager/recordManager.js`, change:

```js
export {
  countRecordsBySurveyIdGroupedByStep,
  fetchRecordByUuid,
  fetchRecordsByUuids,
  fetchRecordsUuidAndCycle,
  fetchRecordCreatedCountsByDates,
  fetchRecordCreatedCountsByDatesAndUser,
  fetchRecordCreatedCountsByUser,
  fetchRecordCountsByStep,
  insertRecordsInBatch,
  updateRecordDateModifiedFromValues,
  updateRecordMergedInto,
} from '../repository/recordRepository'
```

to:

```js
export {
  countRecordsBySurveyIdGroupedByStep,
  fetchRecordByUuid,
  fetchRecordDateModified,
  fetchRecordsByUuids,
  fetchRecordsUuidAndCycle,
  fetchRecordCreatedCountsByDates,
  fetchRecordCreatedCountsByDatesAndUser,
  fetchRecordCreatedCountsByUser,
  fetchRecordCountsByStep,
  insertRecordsInBatch,
  updateRecordDateModifiedFromValues,
  updateRecordMergedInto,
} from '../repository/recordRepository'
```

- [ ] **Step 3: Write the failing integration test**

This repo's integration tests follow a two-file convention (verified against `test/integration/tests/_record/recordUpdateManagerTest.js` and `test/integration/tests/003recordUpdatertest.js`): the actual `async` test bodies live in a `_record/`-prefixed module and get wired up via `describe`/`test` in a numbered top-level file. Follow the same split.

Create `test/integration/tests/_record/recordConcurrencyLockTest.js`:

```js
import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser, fetchFullContextSurvey } from '../../config/context'

import * as RecordUtils from '../../../utils/recordUtils'

export const advisoryLockSerializesConcurrentTransactionsTest = async () => {
  const recordUuid = 'test-record-uuid-for-lock'
  const order = []

  const txA = db.tx(async (t) => {
    await t.none('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
    order.push('A-acquired')
    await new Promise((resolve) => setTimeout(resolve, 200))
    order.push('A-releasing')
  })

  // give txA a head start to acquire the lock first
  await new Promise((resolve) => setTimeout(resolve, 50))

  const txB = db.tx(async (t) => {
    await t.none('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
    order.push('B-acquired')
  })

  await Promise.all([txA, txB])

  expect(order).toEqual(['A-acquired', 'A-releasing', 'B-acquired'])
}

export const fetchRecordDateModifiedReflectsCommittedUpdateTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)

  const record = await RecordUtils.insertAndInitRecord(user, survey, true)
  const recordUuid = Record.getUuid(record)

  const before = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid })

  await new Promise((resolve) => setTimeout(resolve, 10)) // ensure a distinguishable timestamp
  await RecordManager.updateRecordDateModified({ surveyId, recordUuid })

  const after = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid })

  expect(after.getTime()).toBeGreaterThan(before.getTime())
}
```

Create `test/integration/tests/013recordConcurrencyLockTest.js` (013 is the next free numeric prefix — `012userDependentStateUpdateTest.js` is currently the last one):

```js
import * as RecordConcurrencyLockTest from './_record/recordConcurrencyLockTest'

describe('Record Concurrency Lock Test', () => {
  test(
    'Advisory lock serializes concurrent transactions',
    RecordConcurrencyLockTest.advisoryLockSerializesConcurrentTransactionsTest
  )
  test(
    'fetchRecordDateModified reflects committed update',
    RecordConcurrencyLockTest.fetchRecordDateModifiedReflectsCommittedUpdateTest
  )
})
```

- [ ] **Step 4: Run it and confirm it fails**

Integration tests are webpack-bundled into one file first (`test/integration/config/webpack.config.js` → `dist/__tests__/bundle.integration.js`), then run with jest's `-t` name filter, per `package.json`'s `build:test:integration`/`jest:integration` scripts:

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "Record Concurrency Lock Test"`
Expected: FAIL — `RecordManager.fetchRecordDateModified` doesn't exist yet (Steps 1–2 above add it).

- [ ] **Step 5: Add the advisory-lock helper and staleness-aware record fetch to `recordsUpdateThread.js`**

In `server/modules/record/service/update/thread/recordsUpdateThread.js`, add the `db` import:

```js
import { db } from '@server/db/db'
```

Add a module-level helper (near the top, after the `Logger` declaration):

```js
const acquireRecordLockAndRun = ({ recordUuid, fn }) =>
  db.tx(async (t) => {
    await t.none('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
    return fn(t)
  })
```

Replace the `getOrFetchRecord` method:

```js
  async getOrFetchRecord({ msg, recordUuid }) {
    const { surveyId, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    let record = recordsCache.get(recordUuid)

    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user })
      recordsCache.set(recordUuid, record)
    }
    return record
  }
```

with a version that also takes the transaction client and checks staleness:

```js
  async getOrFetchRecord({ msg, recordUuid, t }) {
    const { surveyId, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    const cachedRecord = recordsCache.get(recordUuid)
    const dbDateModified = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid }, t)

    const cachedDateModified = cachedRecord ? Record.getDateModified(cachedRecord) : null
    const isCacheFresh =
      cachedRecord && dbDateModified && cachedDateModified && cachedDateModified.getTime() === dbDateModified.getTime()

    if (isCacheFresh) {
      return cachedRecord
    }

    // No cached copy, or another dyno committed a change since this dyno cached the record - refetch.
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user }, t)
    recordsCache.set(recordUuid, record)
    return record
  }
```

- [ ] **Step 6: Wrap the four message handlers with the lock**

Replace `processRecordInitMsg`:

```js
  async processRecordInitMsg(msg) {
    const { surveyId, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })

    record = await RecordManager.initNewRecord({
      user,
      survey,
      record,
      timezoneOffset,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated.bind(this)({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated.bind(this)({ record, validations }),
    })
    recordsCache.set(recordUuid, record)
  }
```

with:

```js
  async processRecordInitMsg(msg) {
    const { surveyId, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, t)

        record = await RecordManager.initNewRecord(
          {
            user,
            survey,
            record,
            timezoneOffset,
            nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated.bind(this)({ record, updatedNodes }),
            nodesValidationListener: (validations) =>
              this.handleNodesValidationUpdated.bind(this)({ record, validations }),
          },
          t
        )
        recordsCache.set(recordUuid, record)
      },
    })
  }
```

Replace `processRecordReloadMsg`:

```js
  async processRecordReloadMsg(msg) {
    const { surveyId, recordUuid, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    if (recordsCache.has(recordUuid)) {
      const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user })
      recordsCache.set(recordUuid, record)
    }
  }
```

with:

```js
  async processRecordReloadMsg(msg) {
    const { surveyId, recordUuid, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    if (!recordsCache.has(recordUuid)) return

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user }, t)
        recordsCache.set(recordUuid, record)
      },
    })
  }
```

Replace `processRecordNodePersistMsg`:

```js
  async processRecordNodePersistMsg(msg) {
    const { node, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    const recordUuid = Node.getRecordUuid(node)
    let record = await this.getOrFetchRecord({ msg, recordUuid })

    record = await RecordManager.persistNode({
      user,
      survey,
      record,
      node,
      timezoneOffset,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
    })
    recordsCache.set(recordUuid, record)
  }
```

with:

```js
  async processRecordNodePersistMsg(msg) {
    const { node, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    const recordUuid = Node.getRecordUuid(node)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await this.getOrFetchRecord({ msg, recordUuid, t })

        record = await RecordManager.persistNode(
          {
            user,
            survey,
            record,
            node,
            timezoneOffset,
            nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
            nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
          },
          t
        )
        recordsCache.set(recordUuid, record)
      },
    })
  }
```

Replace `processRecordNodeDeleteMsg`:

```js
  async processRecordNodeDeleteMsg(msg) {
    const { nodeUuid, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    let record = await this.getOrFetchRecord({ msg, recordUuid })
    record = await RecordManager.deleteNode(
      user,
      survey,
      record,
      nodeUuid,
      timezoneOffset,
      (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      (validations) => this.handleNodesValidationUpdated({ record, validations })
    )
    recordsCache.set(recordUuid, record)
  }
```

with:

```js
  async processRecordNodeDeleteMsg(msg) {
    const { nodeUuid, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await this.getOrFetchRecord({ msg, recordUuid, t })
        record = await RecordManager.deleteNode(
          user,
          survey,
          record,
          nodeUuid,
          timezoneOffset,
          (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
          (validations) => this.handleNodesValidationUpdated({ record, validations }),
          t
        )
        recordsCache.set(recordUuid, record)
      },
    })
  }
```

- [ ] **Step 7: Run the integration test again to verify it passes**

Run: `yarn build:test:integration && jest dist/__tests__/bundle.integration.js -t "Record Concurrency Lock Test"`
Expected: PASS.

- [ ] **Step 8: Run the full existing record integration and unit suites**

Run: `yarn test:integration` and `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "record"`
Expected: PASS, no regressions — pay particular attention to `test/integration/tests/003recordUpdatertest.js` and `test/integration/tests/_record/recordUpdateManagerTest.js`, since `getOrFetchRecord`'s signature changed (added `t`) and every node-persist/delete message handler's control flow changed.

- [ ] **Step 9: Commit**

```bash
git add server/modules/record/repository/recordRepository.js server/modules/record/manager/recordManager.js server/modules/record/service/update/thread/recordsUpdateThread.js test/integration/tests/_record/recordConcurrencyLockTest.js test/integration/tests/013recordConcurrencyLockTest.js
git commit -m "feat: serialize cross-dyno record edits with a Postgres advisory lock and a date_modified staleness check"
```

---

### Task 4: Cluster-wide survey/record cache invalidation

**Files:**
- Modify: `server/modules/record/service/update/surveyRecordsThreadService.js`
- Test: extend `test/unit/tests/surveyRecordsThreadServiceNotify.test.js` (from Task 2)

**Interfaces:**
- Consumes: `ClusterBus` from `@openforis/arena-server` (`onEvent(handler): void`, `publish(event: { targetType, targetId, eventType, message }): Promise<void>` — verified against `../arena-server/src/clusterBus/clusterBus.ts`; `onEvent` delivers every event to every registered handler on every dyno, including the publisher's own — handlers must filter by `targetType`).
- Produces: no change to `clearSurveyDataFromThread`/`clearRecordDataFromThread`'s external signatures — same callers (`surveyService.js`, `recordService.js`, `FlatDataImportJob.js`) need no changes.

- [ ] **Step 1: Write the failing test**

**Note:** `ClusterBus.onEvent(handler)` is called once as a side effect at module-load time (registering the handler into `ClusterBus`'s real internal list), which happens when this test file's `import { RecordsUpdateThreadService } from '...'` line first runs — before any `beforeAll`/`jest.spyOn` setup could possibly run (ES module imports are hoisted and evaluated before any other code in the file, including code textually placed between import statements). So a spy on `ClusterBus.onEvent` set up in `beforeAll` would always be too late to capture the real registration call. Instead, per Step 3 below, the handler function is defined as a named function and exported under a test-only name (matching the `_notifyJobUpdateForTest` pattern used elsewhere in this series), so the test can invoke it directly without needing to intercept the registration call at all.

Add to `test/unit/tests/surveyRecordsThreadServiceNotify.test.js`:

```js
import { ClusterBus } from '@openforis/arena-server'
import { _handleClusterEventForTest as handleClusterEvent } from '../../../server/modules/record/service/update/surveyRecordsThreadService'

describe('RecordsUpdateThreadService cluster-bus integration', () => {
  let publishSpy

  beforeAll(() => {
    publishSpy = jest.spyOn(ClusterBus, 'publish')
  })

  afterAll(() => {
    publishSpy.mockRestore()
  })

  beforeEach(() => {
    publishSpy.mockReset().mockResolvedValue(undefined)
  })

  test('clearSurveyDataFromThread publishes a cluster event instead of only messaging the local thread', () => {
    RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId: 42, cycle: '0', draft: false })

    expect(publishSpy).toHaveBeenCalledWith({
      targetType: 'recordsUpdateThread',
      targetId: 'survey-42',
      eventType: 'surveyClear',
      message: { surveyId: 42, cycle: '0', draft: false },
    })
  })

  test("a received surveyClear cluster event posts to this dyno's local thread", () => {
    // Call the exported handler directly - no local thread exists in this unit test
    // (getThread() returns undefined when none was created), so this just needs to not
    // throw; full end-to-end behavior is covered by the integration test in Step 7.
    expect(() =>
      handleClusterEvent({
        targetType: 'recordsUpdateThread',
        targetId: 'survey-42',
        eventType: 'surveyClear',
        message: { surveyId: 42, cycle: '0', draft: false },
      })
    ).not.toThrow()
  })

  test('a cluster event with an unrelated targetType is ignored', () => {
    expect(() =>
      handleClusterEvent({
        targetType: 'somethingElse',
        targetId: 'x',
        eventType: 'surveyClear',
        message: {},
      })
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "cluster event"`
Expected: FAIL — `clearSurveyDataFromThread` doesn't call `ClusterBus.publish` yet, and `_handleClusterEventForTest` isn't exported from `surveyRecordsThreadService.js` yet.

- [ ] **Step 3: Add the cluster-bus subscription and rewrite the two clear functions**

In `server/modules/record/service/update/surveyRecordsThreadService.js`, add to the import block (extending Task 2's edit):

```js
import { ClusterBus, WebSocketEvent, WebSocketServer } from '@openforis/arena-server'
```

Add, near the top of the file (after the `Logger` declaration from Task 2, before `_createThread`):

```js
const clusterEventTargetType = 'recordsUpdateThread'
const clusterEventTypes = { surveyClear: 'surveyClear', recordClear: 'recordClear' }

const handleClusterEvent = (event) => {
  const { targetType, eventType, message } = event
  if (targetType !== clusterEventTargetType) return

  const thread = getThread()
  if (!thread) return

  if (eventType === clusterEventTypes.surveyClear) {
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.surveyClear, ...message })
  } else if (eventType === clusterEventTypes.recordClear) {
    thread.postMessage({ type: RecordsUpdateThreadMessageTypes.recordClear, ...message })
  }
}

// Exported under a test-only name so tests can invoke it directly, without needing to intercept
// the ClusterBus.onEvent registration call below (which runs at module-load time, before any
// test's jest.spyOn setup could possibly run).
export const _handleClusterEventForTest = handleClusterEvent

ClusterBus.onEvent(handleClusterEvent)
```

Replace `clearSurveyDataFromThread` and `clearRecordDataFromThread`:

```js
const clearSurveyDataFromThread = ({ surveyId, cycle = null, draft = false }) => {
  ClusterBus.publish({
    targetType: clusterEventTargetType,
    targetId: `survey-${surveyId}`,
    eventType: clusterEventTypes.surveyClear,
    message: { surveyId, cycle, draft },
  }).catch((error) => Logger.error(`error publishing surveyClear cluster event: ${error}`))
}

const clearRecordDataFromThread = ({ surveyId, cycle, draft, recordUuid }) => {
  ClusterBus.publish({
    targetType: clusterEventTargetType,
    targetId: recordUuid,
    eventType: clusterEventTypes.recordClear,
    message: { surveyId, cycle, draft, recordUuid },
  }).catch((error) => Logger.error(`error publishing recordClear cluster event: ${error}`))
}
```

(Postgres delivers `NOTIFY` back to the publisher's own `LISTEN` session too — per `ClusterBus`'s own documented behavior in `../arena-server/src/clusterBus/clusterBus.ts:76-78` — so the publishing dyno invalidates its own local thread through the exact same `onEvent` handler as every other dyno, with no separate direct-postMessage code path needed. This also means invalidation on the originating dyno is no longer synchronous — it now round-trips through Postgres `NOTIFY`, typically single-digit milliseconds locally — every existing caller of `clearSurveyDataFromThread`/`clearRecordDataFromThread` already treats it as fire-and-forget, not awaited, so this is not a behavior-breaking change for any of them.)

- [ ] **Step 4: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "cluster event"`
Expected: PASS.

- [ ] **Step 5: Run the broader record test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "record"`
Expected: PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add server/modules/record/service/update/surveyRecordsThreadService.js test/unit/tests/surveyRecordsThreadServiceNotify.test.js
git commit -m "feat: broadcast survey/record thread-cache invalidation cluster-wide instead of only to the local thread"
```

---

### Task 5: Verify multi-dyno record collaboration and cache invalidation locally

**Files:** none (manual verification, per the design spec's test plan §7).

- [ ] **Step 1: Build and start two instances against the same DB on different ports**

```bash
yarn build:server:dev
PORT=9090 node dist/index.js &
PORT=9091 node dist/index.js &
```

- [ ] **Step 2: Two-session collaborative edit test**

Open the same record in two browser sessions, one pointed at `:9090`, one at `:9091`. Edit a field in one session; confirm the other session's node value and validation state update live, matching the design spec's edge case ("Two users (or two tabs) editing the same record can silently clobber each other's changes, or see stale/incorrect validation state").

- [ ] **Step 3: Survey structure change propagation test**

With both sessions still open, publish a survey-structure change (e.g. add a node def) from a third request. Confirm both dynos serve the updated structure to their respective sessions immediately, not after the old 10-minute idle timeout.

- [ ] **Step 4: Stop both instances**

```bash
kill %1 %2
```

This task has no commit — it's a manual verification step confirming Tasks 1–4 work end-to-end, per the design spec's "Local multi-instance simulation" test plan (item 1).

---

## Follow-ups discovered during research, intentionally out of scope for this plan

- `TempFileManager.keepFileForLaterUse` has no callers anywhere in `server/` — the "preview an import, confirm it later" flow appears to have never been fully wired up (pre-existing, unrelated to auto-scaling). Covered as a note in `docs/superpowers/plans/2026-08-19-autoscaling-2-chunked-upload-storage.md`.
- `server/system/appCluster.js` references `SurveysFilesPropsCleanup.init()` (commented out) with no matching import — dead/broken code even if uncommented, and that scheduler has no recurring cron at all (`init()` only runs once, immediately, on boot). Pre-existing, unrelated to auto-scaling.
- The `job` table's `survey_id NOT NULL` constraint means global (no-surveyId) jobs (`SurveysListExportJob`, `MessageSendJob`) are never persisted for cross-dyno polling — documented as a known, accepted gap in `docs/superpowers/plans/2026-08-19-autoscaling-3-job-queue-persistence.md`'s Global Constraints.
