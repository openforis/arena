# Heroku Auto-Scaling — Cron Scheduler Deduplication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With N Heroku dynos running, make sure each of arena's 7 cron-scheduled cleanup jobs — and the two operations arena runs unconditionally on every dyno boot (`DataMigrator.migrateData`, `UserService.insertSystemAdminUserIfNotExisting`) — executes on at most one dyno per tick/boot, instead of once per dyno.

**Architecture:** Wrap each scheduler's cron callback body, and the two boot-time calls, with `runWithClusterLock({ lockName, fn })` from `@openforis/arena-server` (already implemented there — a non-blocking `pg_try_advisory_lock(hashtext(lockName))`/`pg_advisory_unlock` pair; if another dyno already holds the named lock, `fn` is skipped for this dyno this tick, and `runWithClusterLock` resolves to `false`). Each scheduler gets its own unique lock name so different schedulers don't block each other.

**Tech Stack:** `runWithClusterLock` from `@openforis/arena-server`, existing `node-schedule` cron jobs.

## Global Constraints

- No Redis — Postgres-only, per the design spec's decision table (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md` §3).
- Requires `docs/superpowers/plans/2026-08-19-autoscaling-0-dependency-setup.md` Task 2 (portal-linked `@openforis/arena-server`) to be done first — `runWithClusterLock` is already exported from arena-server's package entry point today (`../arena-server/src/index.ts:6`), so Task 1 of that plan is not strictly required for this one, but the portal link is, since the published `^1.3.27` predates `runWithClusterLock` entirely.
- `runWithClusterLock`'s signature (verified against `../arena-server/src/clusterBus/clusterLock.ts`): `runWithClusterLock(params: { lockName: string; fn: () => Promise<void> }): Promise<boolean>` — `fn` must return `Promise<void>` (no return value is passed through), and the promise resolves `true` if this dyno acquired the lock and ran `fn`, `false` if it was already held elsewhere.

---

### Task 1: Wrap `expiredUserInvitationsCleanup` and `userResetPasswordCleanup` with cluster locks

These two schedulers share an identical shape (`deleteExpiredItems`, weekly at 02:00), so they're done together.

**Files:**
- Modify: `server/system/schedulers/expiredUserInvitationsCleanup.js`
- Modify: `server/system/schedulers/userResetPasswordCleanup.js`

**Interfaces:**
- Consumes: `runWithClusterLock` from `@openforis/arena-server`.

- [ ] **Step 1: Update `expiredUserInvitationsCleanup.js`**

Replace the full file content:

```js
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('ExpiredUserInvitationsCleanup')

import * as UserService from '@server/modules/user/service/userService'

const lockName = 'scheduler-expired-user-invitations-cleanup'
const entriesType = 'users with expired invitations and surveys'

const deleteExpiredItems = async () => {
  await runWithClusterLock({
    lockName,
    fn: async () => {
      try {
        Logger.debug(`Deleting ${entriesType}`)

        const { deletedUsers, deletedSurveyIds } = await UserService.deleteExpiredInvitationsUsersAndSurveys()

        Logger.debug(`${deletedUsers.length} users deleted, ${deletedSurveyIds.length} surveys could be deleted`)
      } catch (error) {
        Logger.error(`Error deleting ${entriesType}: ${error.toString()}`)
      }
    },
  })
}

export const init = async () => {
  await deleteExpiredItems()

  Logger.debug(`Job scheduled to be executed every 7 days at 02:00`)

  schedule.scheduleJob('0 2 */7 * *', deleteExpiredItems)
}
```

- [ ] **Step 2: Update `userResetPasswordCleanup.js`**

Replace the full file content:

```js
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('UserResetPasswordCleanup')

import * as UserService from '@server/modules/user/service/userService'

const lockName = 'scheduler-user-reset-password-cleanup'
const entriesType = 'expired user reset password entries'

const deleteExpiredItems = async () => {
  await runWithClusterLock({
    lockName,
    fn: async () => {
      try {
        Logger.debug(`Deleting ${entriesType}`)

        const count = await UserService.deleteUserResetPasswordExpired()

        Logger.debug(`${count} ${entriesType} deleted`)
      } catch (error) {
        Logger.error(`Error deleting ${entriesType}: ${error.toString()}`)
      }
    },
  })
}

export const init = async () => {
  await deleteExpiredItems()

  Logger.debug(`Job scheduled to be executed every 7 days at 02:00`)

  schedule.scheduleJob('0 2 */7 * *', deleteExpiredItems)
}
```

- [ ] **Step 3: Write an integration-style unit test for the lock behavior**

Create `test/unit/tests/schedulerClusterLock.test.js`:

```js
import { runWithClusterLock } from '@openforis/arena-server'

describe('scheduler cluster lock', () => {
  test('second concurrent call with the same lock name is skipped', async () => {
    const lockName = 'test-scheduler-lock-concurrent'
    let runCount = 0

    const results = await Promise.all([
      runWithClusterLock({ lockName, fn: async () => { runCount += 1 } }),
      runWithClusterLock({ lockName, fn: async () => { runCount += 1 } }),
    ])

    expect(runCount).toBe(1)
    expect(results.filter(Boolean).length).toBe(1)
  })
})
```

- [ ] **Step 4: Run it and confirm it needs a real DB connection**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "scheduler cluster lock"`
Expected: passes if unit tests in this repo run against a live test DB (they do, per `test/unit/` conventions — `pg_try_advisory_lock` requires a real Postgres connection, it cannot be mocked meaningfully). If the unit test harness has no DB access, move this test to `test/integration/tests/` instead, matching the existing convention there, and run via the integration test command instead.

- [ ] **Step 5: Commit**

```bash
git add server/system/schedulers/expiredUserInvitationsCleanup.js server/system/schedulers/userResetPasswordCleanup.js test/unit/tests/schedulerClusterLock.test.js
git commit -m "feat: dedupe expiredUserInvitationsCleanup and userResetPasswordCleanup schedulers across dynos"
```

---

### Task 2: Wrap `recordPreviewCleanup` and `temporarySurveysCleanup` with cluster locks

Same shape as Task 1 (a `(olderThan24Hours)`-parameterized delete function, run once immediately then daily at 00:00).

**Files:**
- Modify: `server/system/schedulers/recordPreviewCleanup.js`
- Modify: `server/system/schedulers/temporarySurveysCleanup.js`

- [ ] **Step 1: Update `recordPreviewCleanup.js`**

Replace the full file content:

```js
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

const Logger = Log.getLogger('RecordPreviewCleanup')

import * as RecordService from '@server/modules/record/service/recordService'

const lockName = 'scheduler-record-preview-cleanup'

const deleteRecordsPreview = async (olderThan24Hours = false) => {
  await runWithClusterLock({
    lockName,
    fn: async () => {
      try {
        Logger.debug('Deleting stale preview records')

        const count = await RecordService.deleteRecordsPreview(olderThan24Hours)

        Logger.debug(`${count} stale preview records deleted`)
      } catch (error) {
        Logger.error(`Error deleting stale preview records: ${error.toString()}`)
      }
    },
  })
}

export const init = async () => {
  await deleteRecordsPreview()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => await deleteRecordsPreview(true))
}
```

- [ ] **Step 2: Update `temporarySurveysCleanup.js`**

Replace the full file content:

```js
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as SurveyService from '@server/modules/survey/service/surveyService'

const Logger = Log.getLogger('TemporarySurveysCleanup')

const lockName = 'scheduler-temporary-surveys-cleanup'
const items = 'stale temporary surveys'
const task = `deleting ${items}`

const deleteTemporarySurveys = async (olderThan24Hours = false) => {
  await runWithClusterLock({
    lockName,
    fn: async () => {
      try {
        Logger.debug(task)

        const count = await SurveyService.deleteTemporarySurveys(olderThan24Hours)

        Logger.debug(`${count} ${items} deleted`)
      } catch (error) {
        Logger.error(`Error ${task}: ${error.toString()}`)
      }
    },
  })
}

export const init = async () => {
  await deleteTemporarySurveys()

  Logger.debug('Schedule job to be executed every day at 00:00')
  schedule.scheduleJob('0 0 * * *', async () => deleteTemporarySurveys(true))
}
```

- [ ] **Step 3: Run existing test suites for these modules**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js`
Expected: no regressions (these schedulers have no dedicated existing tests; this step guards against a typo breaking the wider suite via a bad import).

- [ ] **Step 4: Commit**

```bash
git add server/system/schedulers/recordPreviewCleanup.js server/system/schedulers/temporarySurveysCleanup.js
git commit -m "feat: dedupe recordPreviewCleanup and temporarySurveysCleanup schedulers across dynos"
```

---

### Task 3: Wrap `tempFilesCleanup` and `userTempAuthTokensCleanup` with cluster locks

**Files:**
- Modify: `server/system/schedulers/tempFilesCleanup.js`
- Modify: `server/system/schedulers/userTempAuthTokensCleanup.js`

- [ ] **Step 1: Update `tempFilesCleanup.js`**

Wrap only the recurring cron body (the daily 2AM job), not the immediate `init()`-time call — both call the same `cleanupTempFiles` function, so wrapping `cleanupTempFiles` itself covers both call sites:

```js
import * as fs from 'fs'
import * as path from 'path'
import * as schedule from 'node-schedule'

import { runWithClusterLock } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import * as DateUtils from '@core/dateUtils'
import * as ProcessUtils from '@core/processUtils'

import { fileContentStorageTypes, getFileContentStorageType } from '@server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryS3Bucket from '@server/modules/file/repository/tempFileRepositoryS3Bucket'

const Logger = Log.getLogger('TempFilesCleanup')

const lockName = 'scheduler-temp-files-cleanup'

const initSchedule = () =>
  // Execute the cron job every day at 2AM
  schedule.scheduleJob('0 2 * * *', async () => {
    // Cleanup temp files older than 6 hours
    await cleanupTempFilesWithLock(6)
  })

const cleanupFileSystemTempFiles = async (olderThanHours = 4) => {
  const tempFolder = ProcessUtils.ENV.tempFolder

  Logger.debug(`Cleaning up temp files in folder ${tempFolder}`)

  let count = 0
  try {
    if (await fs.existsSync(tempFolder)) {
      const now = new Date()
      const files = await fs.readdirSync(tempFolder)
      for (const file of files) {
        const filePath = path.join(tempFolder, file)
        const stat = await fs.statSync(filePath)
        if (stat.isFile() && DateUtils.diffInHours(now, new Date(stat.ctime)) >= olderThanHours) {
          await fs.unlinkSync(filePath)
          Logger.debug('Temp file deleted', filePath)
          count++
        }
      }
    }
  } catch (error) {
    // ignore errors
    Logger.error('Error deleting temp files from file system', error)
  }

  Logger.debug(`${count} temp files deleted from file system`)
}

const cleanupS3TempFiles = async (olderThanHours = 4) => {
  Logger.debug('Cleaning up temp files in S3 bucket')
  try {
    const count = await TempFileRepositoryS3Bucket.deleteOldTempFiles({ olderThanHours })
    Logger.debug(`${count} temp files deleted from S3 bucket`)
  } catch (error) {
    Logger.error('Error deleting temp files from S3 bucket', error)
  }
}

const cleanupTempFiles = async (olderThanHours = 4) => {
  // Local-filesystem temp files are per-dyno by nature (each dyno only has its own disk), so this
  // part is safe to run on every dyno unconditionally - only the shared S3 cleanup below needs the lock.
  await cleanupFileSystemTempFiles(olderThanHours)

  if (getFileContentStorageType() === fileContentStorageTypes.s3Bucket) {
    await runWithClusterLock({ lockName, fn: () => cleanupS3TempFiles(olderThanHours) })
  }
}

const cleanupTempFilesWithLock = cleanupTempFiles

export const init = async () => {
  await cleanupTempFiles()

  initSchedule()
}
```

- [ ] **Step 2: Update `userTempAuthTokensCleanup.js`**

Replace the full file content:

```js
import * as schedule from 'node-schedule'

import { ServiceRegistry } from '@openforis/arena-core'

import * as Log from '@server/log/log'

import { ServerServiceType, runWithClusterLock } from '@openforis/arena-server'

const Logger = Log.getLogger('UserTempAuthTokensCleanup')

const lockName = 'scheduler-user-temp-auth-tokens-cleanup'
const items = 'expired temporary user auth tokens'
const task = `deleting ${items}`

const deleteExpiredUserTempAuthTokens = async () => {
  await runWithClusterLock({
    lockName,
    fn: async () => {
      try {
        Logger.debug(task)

        const serviceRegistry = ServiceRegistry.getInstance()
        const userTempAuthTokenService = serviceRegistry.getService(ServerServiceType.userTempAuthToken)
        const count = await userTempAuthTokenService.cleanupExpired()
        Logger.debug(`${count} ${items} deleted`)
      } catch (error) {
        Logger.error(`Error ${task}: ${error.toString()}`)
      }
    },
  })
}

export const init = async () => {
  await deleteExpiredUserTempAuthTokens()

  Logger.debug('Schedule job to be executed every day at 01:00')
  schedule.scheduleJob('0 1 * * *', async () => deleteExpiredUserTempAuthTokens())
}
```

- [ ] **Step 3: Run existing test suites**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js`
Expected: no regressions.

- [ ] **Step 4: Commit**

```bash
git add server/system/schedulers/tempFilesCleanup.js server/system/schedulers/userTempAuthTokensCleanup.js
git commit -m "feat: dedupe tempFilesCleanup S3 sweep and userTempAuthTokensCleanup scheduler across dynos"
```

---

### Task 4: Wrap boot-time `DataMigrator.migrateData` and `UserService.insertSystemAdminUserIfNotExisting`

**Files:**
- Modify: `server/system/appCluster.js:56,59`

**Context:** Both calls currently run unconditionally on every dyno's boot, before `ArenaServer.start` (line 69). `DataMigrator.migrateData` (`server/system/dataMigrator/index.js`) compares the app version stored in the DB against a hardcoded threshold and, if the DB is behind, calls `CategoryService.initializeAllSurveysCategoryItemIndexes()` — the DB version isn't bumped until `infoService.updateVersion()` at `appCluster.js:66`, several steps later in the same boot sequence, so on a fresh multi-dyno deploy every dyno reads the same stale version and all of them would redundantly (and concurrently) rebuild every survey's category item indexes without a lock.

- [ ] **Step 1: Wrap both calls**

In `server/system/appCluster.js`, change:

```js
import { ArenaServer } from '@openforis/arena-server'
```

to:

```js
import { ArenaServer, runWithClusterLock } from '@openforis/arena-server'
```

and change:

```js
  // Data migrations
  await DataMigrator.migrateData({ logger, serviceRegistry })

  // ====== System Admin user creation
  await UserService.insertSystemAdminUserIfNotExisting()
```

to:

```js
  // Data migrations
  await runWithClusterLock({ lockName: 'boot-data-migration', fn: () => DataMigrator.migrateData({ logger, serviceRegistry }) })

  // ====== System Admin user creation
  await runWithClusterLock({ lockName: 'boot-insert-system-admin-user', fn: () => UserService.insertSystemAdminUserIfNotExisting() })
```

- [ ] **Step 2: Run existing test suites**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js`
Expected: no regressions.

- [ ] **Step 3: Commit**

```bash
git add server/system/appCluster.js
git commit -m "feat: serialize boot-time data migration and admin-user creation across dynos"
```

---

### Task 5: Verify the multi-instance scenario locally

**Files:** none (manual verification, per the design spec's test plan §7).

- [ ] **Step 1: Build the server**

Run: `yarn build:server:dev`

- [ ] **Step 2: Start two instances against the same DB on different ports**

```bash
PORT=9090 node dist/index.js &
PORT=9091 node dist/index.js &
```

- [ ] **Step 3: Temporarily shorten one scheduler's cron expression**

Edit `server/system/schedulers/tempFilesCleanup.js`'s `initSchedule` cron string from `'0 2 * * *'` to `'*/1 * * * *'` (every minute) locally only — do not commit this change.

- [ ] **Step 4: Observe logs from both instances**

Confirm via each instance's log output that `Cleaning up temp files in S3 bucket` (or the lock-skip absence of it) appears on only one instance per tick, not both. Revert the cron string edit afterward (`git checkout -- server/system/schedulers/tempFilesCleanup.js`).

- [ ] **Step 5: Stop both instances**

```bash
kill %1 %2
```

This task has no commit — it's a manual verification step confirming Tasks 1–4 work end-to-end, per the design spec's "Local multi-instance simulation" test plan.
