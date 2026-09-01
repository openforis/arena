# Heroku Auto-Scaling — Chunked Upload / Temp File Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** With N Heroku dynos, make sure a chunked upload whose consecutive chunk requests land on different dynos still succeeds when S3 storage is configured, and that a file "kept" for later reuse across separate requests (preview-then-confirm-import flow) is reachable from whichever dyno serves the later request.

**Architecture:** `server/modules/file/manager/tempFileManager.js` currently has a hardcoded "files under 10MB always use local filesystem" branch for chunk writes/merges, regardless of the configured storage type (`getFileContentStorageType()` — `fileSystem`, `s3Bucket`, or `db`). Remove that branch so chunk writes always follow the configured storage type. `keepFileForLaterUse`/`getKeptFilePath`/`deletePendingImportFileIfAny` are hardcoded to local disk unconditionally; make them storage-type-aware too, following the dispatch-table pattern already used elsewhere in the same file.

**Tech Stack:** Existing `TempFileRepositoryFileSystem`/`TempFileRepositoryS3Bucket` modules, `FileUtils`.

## Global Constraints

- No Redis — Postgres-only, per the design spec's decision table (`docs/superpowers/specs/2026-08-06-heroku-horizontal-autoscaling-design.md` §3). This plan doesn't touch Postgres at all — it's a pure storage-routing fix.
- `FILE_STORAGE_AWS_S3_BUCKET_NAME` (+ region/keys) becomes effectively required once running >1 dyno; local-disk temp storage remains correct and unchanged for single-dyno/dev setups (`getFileContentStorageType()` returning `fileSystem`) — do not change behavior for that storage type beyond what's needed to remove the now-redundant size branch.
- Scope note discovered during research: `TempFileManager.mergeTempChunks`'s merged output always lands on local disk regardless of storage type, in every code path found (`PrepareImportFileJob.execute()` at `server/modules/file/service/prepareImportFileJob.js:23`). This is safe as-is: `PrepareImportFileJob` is always run as an inner job of a parent import job (confirmed for `DataImportJob`, `ArenaMobileDataImportJob`, `arenaImportJob.js`, `collectImportJob.js` — each constructs `new PrepareImportFileJob()` as one of its own `innerJobs`), and `Job._executeInnerJobs` (`server/job/job.js:344-374`) runs all inner jobs sequentially within one `job.start()` call — i.e. one worker thread, one dyno, from merge to consumption. So `mergeTempChunks`'s local-disk output is **not** a cross-dyno hazard for any caller found, and this plan does not change it. The genuine cross-**request** hazard is `keepFileForLaterUse`/`getKeptFilePath` (Task 2 below), where the "keep" and "retrieve" calls are two separate HTTP requests that can land on different dynos.
- `TempFileManager.keepFileForLaterUse` currently has **zero callers** anywhere in `server/` (verified by repo-wide grep) — the "preview an import, then confirm/reuse it later" flow only calls the read side (`getKeptFilePath`, from `server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob.js:44`) and the delete side (`deletePendingImportFileIfAny`, from `server/modules/mobile/api/mobileApi.js:124`), with nothing currently producing a file at the path `getKeptFilePath` looks for. This looks like a pre-existing, unrelated bug (the "keep" step of this flow appears to have never been wired up) — **out of scope for this plan**. This plan makes all three functions storage-type-correct for whenever that gap is fixed, but does not fix the gap itself.

---

### Task 1: Remove the 10MB local-filesystem override for chunk writes and merges

**Files:**
- Modify: `server/modules/file/manager/tempFileManager.js:1-58` (the storage-dispatch section)
- Test: `test/unit/tests/tempFileManager.test.js` (new)

**Interfaces:**
- Consumes: `getFileContentStorageType`, `fileContentStorageTypes` from `./fileManagerCommon`; `TempFileRepositoryFileSystem`, `TempFileRepositoryS3Bucket` (unchanged exports).
- Produces: `writeChunkToTempFile({ fileId, chunk, filePath, fileContent })` and `mergeTempChunks({ fileId, totalChunks, onChunkMerged })` — both drop the `totalFileSize` param from what they read (callers may keep passing it; it's simply no longer destructured, so no call-site changes are required).

**Note (established while implementing this task):** this repo's `test/unit/` suite is webpack-bundled into a single file before Jest runs it (`test/unit/config/webpack.config.js` → `webpack.config.babel.js`, which uses `webpack-node-externals` to keep `node_modules` packages as real external `require()`s but fully inlines local `@server`/`@core`/`@common` aliases). `jest.mock()` on a local alias cannot intercept anything once webpack has inlined it, and there is no precedent for that pattern anywhere in `test/unit/tests/`. So this test uses a dependency-injection seam instead — `getStorageFunctionOrThrow` gets an optional `storageType` param (defaulting to the real `getFileContentStorageType()` call, so production behavior is unchanged) — and the test calls it directly with the real, now-exported dispatch tables. No module mocking.

- [ ] **Step 1: Write the failing test**

Create `test/unit/tests/tempFileManager.test.js`:

```js
import {
  getStorageFunctionOrThrow,
  chunkWriteFunctionByStorageType,
  chunkMergeFunctionByStorageType,
} from '../../../server/modules/file/manager/tempFileManager'
import { fileContentStorageTypes } from '../../../server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../../../server/modules/file/repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../../../server/modules/file/repository/tempFileRepositoryS3Bucket'
import * as TempFileManager from '../../../server/modules/file/manager/tempFileManager'

describe('TempFileManager storage routing', () => {
  test('routes to S3 repository functions when S3 storage is configured, regardless of file size', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(writeFn).toBe(TempFileRepositoryS3Bucket.writeChunkToTempFile)

    const mergeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkMergeFunctionByStorageType,
      operation: 'mergeTempChunks',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(mergeFn).toBe(TempFileRepositoryS3Bucket.mergeTempChunks)
  })

  test('routes to file-system repository functions when file-system storage is configured', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(writeFn).toBe(TempFileRepositoryFileSystem.writeChunkToTempFile)
  })

  test('routes db storage type to file-system functions (temp chunks always need a real location)', () => {
    const writeFn = getStorageFunctionOrThrow({
      functionByStorageType: chunkWriteFunctionByStorageType,
      operation: 'writeChunkToTempFile',
      storageType: fileContentStorageTypes.db,
    })
    expect(writeFn).toBe(TempFileRepositoryFileSystem.writeChunkToTempFile)
  })

  test('writeChunkToTempFile and mergeTempChunks no longer depend on totalFileSize', async () => {
    // Real call against the current (unmocked) environment - proves there's no lingering
    // size-based branch left, regardless of what value (or none) totalFileSize is passed.
    const fileId = 'test-file-no-size-branch'
    await TempFileManager.writeChunkToTempFile({ fileId, chunk: 1, totalFileSize: 999999999999, fileContent: Buffer.from('x') })
    const mergedPath = await TempFileManager.mergeTempChunks({ fileId, totalChunks: 1 })
    expect(mergedPath).toBeTruthy()
    await TempFileManager.deleteTempFile(mergedPath)
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "TempFileManager storage routing"`
Expected: FAIL — `getStorageFunctionOrThrow`, `chunkWriteFunctionByStorageType`, `chunkMergeFunctionByStorageType` aren't exported from `tempFileManager.js` yet, and `getStorageFunctionOrThrow` doesn't accept a `storageType` override yet.

- [ ] **Step 3: Remove the size-based branch and add the storageType injection seam**

In `server/modules/file/manager/tempFileManager.js`, replace lines 12–58 (from `const minFileSizeToUseAlternativeStorage = ...` through the end of `mergeTempChunks`) with:

```js
export const contentDeleteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.deleteFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deleteFile,
}

export const chunkWriteFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.writeChunkToTempFile,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.writeChunkToTempFile,
}

export const chunkMergeFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.mergeTempChunks,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.mergeTempChunks,
}

// `storageType` defaults to the real, current storage type on every call it's omitted - this
// param exists purely as a test seam (this repo's webpack-bundled unit tests can't jest.mock()
// local modules, so tests call this directly with an explicit storageType instead).
export const getStorageFunctionOrThrow = ({
  functionByStorageType,
  operation,
  defaultFn = null,
  storageType = getFileContentStorageType(),
}) => {
  const tempFileStorageType =
    storageType === fileContentStorageTypes.db ? fileContentStorageTypes.fileSystem : storageType
  const fn = functionByStorageType[tempFileStorageType] ?? defaultFn
  if (!fn) {
    throw new Error(`Operation '${operation}' not implemented for storage type '${tempFileStorageType}'`)
  }
  return fn
}

export const deleteTempFile = async (fileNameOrPath) => {
  const deleteFn = getStorageFunctionOrThrow({
    functionByStorageType: contentDeleteFunctionByStorageType,
    operation: 'deleteTempFile',
  })
  await deleteFn({ fileNameOrPath })
}

export const writeChunkToTempFile = async ({ fileId, chunk, filePath = null, fileContent = null }) => {
  const writeChunkFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkWriteFunctionByStorageType,
    operation: 'writeChunkToTempFile',
  })
  await writeChunkFunction({ filePath, fileContent, fileId, chunk })
}

export const mergeTempChunks = async ({ fileId, totalChunks, onChunkMerged = null }) => {
  const mergeChunksFunction = getStorageFunctionOrThrow({
    functionByStorageType: chunkMergeFunctionByStorageType,
    operation: 'mergeTempChunks',
  })
  return mergeChunksFunction({ fileId, totalChunks, onChunkMerged })
}
```

(This is the same `getStorageFunctionOrThrow` dispatch already used by `deleteTempFile` today — the only change is that `writeChunkToTempFile` and `mergeTempChunks` now go through it unconditionally instead of first checking `totalFileSize` against a 10MB threshold. Existing callers that still pass `totalFileSize` are unaffected — it's simply no longer destructured.)

- [ ] **Step 4: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "TempFileManager storage routing"`
Expected: PASS (all three tests).

- [ ] **Step 5: Run the full existing file-module test suite**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "TempFile"`
Also check `test/integration/` for any existing chunked-upload integration tests: `grep -rl "writeChunkToTempFile\|mergeTempChunks" test/integration/` and run those via `yarn test:integration` if found.
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/modules/file/manager/tempFileManager.js test/unit/tests/tempFileManager.test.js
git commit -m "fix: route all chunked-file writes/merges through the configured storage type, not just files over 10MB"
```

---

### Task 2: Make `keepFileForLaterUse`/`getKeptFilePath`/`deletePendingImportFileIfAny` storage-type-aware

**Files:**
- Modify: `server/modules/file/manager/tempFileManager.js:60-101` (the pending-import-file section)
- Modify: `server/modules/file/repository/tempFileRepositoryFileSystem.js`
- Modify: `server/modules/file/repository/tempFileRepositoryS3Bucket.js`
- Modify: `server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob.js:44` (its one caller — `getKeptFilePath` becomes `async`)
- Test: `test/unit/tests/tempFileManagerPendingImport.test.js` + `test/unit/tests/tempFileManagerPendingImportValidation.test.js` (new)

**Interfaces:**
- Consumes: `TempFileRepositoryS3Bucket`'s already-exported `uploadFileContentAsStream`, `getFileContentAsStream`, `deleteFile` (all already implemented, see `server/modules/file/repository/tempFileRepositoryS3Bucket.js:87-100` — reused, not reimplemented).
- Produces: `TempFileManager.keepFileForLaterUse({ fileId, filePath }): Promise<void>` (unchanged signature, now storage-aware), `TempFileManager.getKeptFilePath({ fileId }): Promise<string>` (now **async** — was sync before), `TempFileManager.deletePendingImportFileIfAny({ fileId }): Promise<void>` (unchanged signature).

- [ ] **Step 1: Write the failing test**

**Note (added after Task 1 hit this in practice):** this repo's `test/unit/` suite is webpack-bundled into a single file before Jest runs it (`test/unit/config/webpack.config.js` → `webpack.config.babel.js`, which uses `webpack-node-externals` to keep `node_modules` packages as real external `require()`s but fully inlines local `@server`/`@core`/`@common` aliases). `jest.mock()` on a local alias like `@server/modules/file/manager/fileManagerCommon` cannot intercept anything once webpack has inlined it — there is no precedent for that pattern anywhere in `test/unit/tests/`, and it does not work. Only `jest.mock()` on an actual `node_modules` package (e.g. `@openforis/arena-server`) works in this bundled setup. So this test uses the same dependency-injection seam Task 1 added to `getStorageFunctionOrThrow` (an optional `storageType` param, defaulting to the real `getFileContentStorageType()` call) — no module mocking at all, just the real exported dispatch tables and an explicit `storageType` override.

Create `test/unit/tests/tempFileManagerPendingImport.test.js`:

```js
import {
  getStorageFunctionOrThrow,
  keepFileFunctionByStorageType,
  getKeptFilePathFunctionByStorageType,
} from '../../../server/modules/file/manager/tempFileManager'
import { fileContentStorageTypes } from '../../../server/modules/file/manager/fileManagerCommon'
import * as TempFileRepositoryFileSystem from '../../../server/modules/file/repository/tempFileRepositoryFileSystem'
import * as TempFileRepositoryS3Bucket from '../../../server/modules/file/repository/tempFileRepositoryS3Bucket'

describe('TempFileManager pending import file storage routing', () => {
  test('keepFileForLaterUse routes to the S3 repository function when S3 storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: keepFileFunctionByStorageType,
      operation: 'keepFileForLaterUse',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(fn).toBe(TempFileRepositoryS3Bucket.keepFileForLaterUse)
  })

  test('getKeptFilePath routes to the S3 repository function when S3 storage is configured', () => {
    const fn = getStorageFunctionOrThrow({
      functionByStorageType: getKeptFilePathFunctionByStorageType,
      operation: 'getKeptFilePath',
      storageType: fileContentStorageTypes.s3Bucket,
    })
    expect(fn).toBe(TempFileRepositoryS3Bucket.getKeptFilePath)
  })

  test('keepFileForLaterUse and getKeptFilePath route to the file-system repository when file-system storage is configured', () => {
    const keepFn = getStorageFunctionOrThrow({
      functionByStorageType: keepFileFunctionByStorageType,
      operation: 'keepFileForLaterUse',
      storageType: fileContentStorageTypes.fileSystem,
    })
    const getFn = getStorageFunctionOrThrow({
      functionByStorageType: getKeptFilePathFunctionByStorageType,
      operation: 'getKeptFilePath',
      storageType: fileContentStorageTypes.fileSystem,
    })
    expect(keepFn).toBe(TempFileRepositoryFileSystem.keepFileForLaterUse)
    expect(getFn).toBe(TempFileRepositoryFileSystem.getKeptFilePath)
  })
})
```

Add a second test file, `test/unit/tests/tempFileManagerPendingImportValidation.test.js`, exercising the real, unmocked `TempFileManager.getKeptFilePath`/`keepFileForLaterUse`/`deletePendingImportFileIfAny` against the current (real, local) environment for the fileId-validation behavior, which doesn't depend on which storage backend is active:

```js
import * as TempFileManager from '../../../server/modules/file/manager/tempFileManager'

describe('TempFileManager pending import file validation', () => {
  test('getKeptFilePath rejects an invalid fileId before touching storage', async () => {
    await expect(TempFileManager.getKeptFilePath({ fileId: 'not-a-uuid' })).rejects.toThrow('Invalid file id')
  })

  test('keepFileForLaterUse rejects an invalid fileId before touching storage', async () => {
    await expect(TempFileManager.keepFileForLaterUse({ fileId: 'not-a-uuid', filePath: '/tmp/x' })).rejects.toThrow(
      'Invalid file id'
    )
  })

  test('getKeptFilePath throws a SystemError for a valid but unknown fileId', async () => {
    await expect(
      TempFileManager.getKeptFilePath({ fileId: '11111111-1111-1111-1111-111111111111' })
    ).rejects.toThrow()
  })

  test('deletePendingImportFileIfAny is a no-op for a fileId that was never kept', async () => {
    await expect(
      TempFileManager.deletePendingImportFileIfAny({ fileId: '22222222-2222-2222-2222-222222222222' })
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "pending import file"`
Expected: FAIL — `keepFileFunctionByStorageType`/`getKeptFilePathFunctionByStorageType` aren't exported from `tempFileManager.js` yet (import error), `TempFileRepositoryFileSystem.keepFileForLaterUse`/`TempFileRepositoryS3Bucket.keepFileForLaterUse` don't exist yet, and the current `getKeptFilePath` is synchronous and always uses `FileUtils` directly (so the "unknown fileId" test throws the wrong error type/message today).

- [ ] **Step 3: Add `keepFileForLaterUse`/`getKeptFilePath` to the file-system repository**

In `server/modules/file/repository/tempFileRepositoryFileSystem.js`, add at the end of the file:

```js
const pendingImportFilePrefix = 'pendingImport_'
const getPendingImportFileName = (fileId) => `${pendingImportFilePrefix}${fileId}`

export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  const destPath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  await FileUtils.renameFile(filePath, destPath)
}

export const getKeptFilePath = async ({ fileId }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (!FileUtils.exists(filePath)) {
    return null
  }
  return filePath
}

export const deletePendingImportFileIfAny = async ({ fileId }) => {
  const filePath = FileUtils.tempFilePath(getPendingImportFileName(fileId))
  if (FileUtils.exists(filePath)) {
    await FileUtils.deleteFileAsync(filePath)
  }
}
```

- [ ] **Step 4: Add `keepFileForLaterUse`/`getKeptFilePath` to the S3 repository**

In `server/modules/file/repository/tempFileRepositoryS3Bucket.js`, add (using the module's existing `uploadFileContentAsStream`, `getFileContentAsStream`, and `getTempFileKey`-style prefixing already established for chunks — this uses its own `pendingImport/` sub-key, but note this does NOT exempt it from the temp-file TTL sweep: `createS3BucketRepository({ getFileKey: getTempFileKey })` unconditionally prepends `temp/` to every key this module produces, so the real S3 key ends up `temp/pendingImport/<fileId>`, still inside the `temp/` prefix that `deleteOldTempFiles`/`tempFilesCleanup.js`'s scheduler sweeps at its normal TTL — same as the pre-existing fileSystem behavior, which the original code's own JSDoc already documented ("stays covered by the periodic temp files cleanup"). This is fine — parity with the old behavior, not a regression — but do not add a comment claiming exemption from the sweep, since there isn't one):

```js
const pendingImportPrefix = 'pendingImport/'
const getPendingImportFileKey = ({ fileId }) => `${pendingImportPrefix}${fileId}`

export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  const contentStream = FileUtils.createReadStream(filePath)
  const contentLength = FileUtils.getFileSize(filePath)
  await uploadFileContentAsStream({ fileUuid, contentStream, contentLength })
  await FileUtils.deleteFileAsync(filePath)
}

export const getKeptFilePath = async ({ fileId }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  const size = await getFileSize({ fileUuid })
  if (!Number.isFinite(size)) {
    return null
  }
  const localFilePath = FileUtils.tempFilePath(FileUtils.newTempFileName())
  const contentStream = await getFileContentAsStream({ fileUuid })
  const writeStream = FileUtils.createWriteStream(localFilePath)
  await writeReadableToWritable({ readStream: contentStream, writeStream })
  await endWriteStream(writeStream)
  return localFilePath
}

export const deletePendingImportFileIfAny = async ({ fileId }) => {
  const fileUuid = getPendingImportFileKey({ fileId })
  await deleteFile({ fileNameOrPath: fileUuid })
}
```

(`deleteFile` here is this file's own existing exported function, which correctly treats `fileNameOrPath` as an S3 key — it's already used this way by the chunk-cleanup path. S3 delete is idempotent on a missing key, so no existence check is needed to satisfy the "no-op if never kept" requirement.)

- [ ] **Step 5: Rewrite the pending-import-file section of `tempFileManager.js`**

In `server/modules/file/manager/tempFileManager.js`, replace the existing `keepFileForLaterUse`/`getKeptFilePath`/`deletePendingImportFileIfAny` block (originally lines 60–101, now shifted down after Step 3's edit) with:

```js
export const keepFileFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.keepFileForLaterUse,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.keepFileForLaterUse,
}

export const getKeptFilePathFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.getKeptFilePath,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.getKeptFilePath,
}

const checkFileIdIsValid = (fileId) => {
  if (!isUuid(fileId)) {
    throw new Error(`Invalid file id: ${fileId}`)
  }
}

/**
 * Moves a previously merged temp file to storage that can be found again later using only its fileId,
 * so it can be reused by a later request instead of being uploaded again (e.g. confirming an import
 * after previewing it). Uses the configured storage type, so the later request can land on any dyno.
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @param {!string} params.filePath - The current local path of the merged temp file.
 * @returns {Promise<void>} - Resolved once the file has been moved.
 */
export const keepFileForLaterUse = async ({ fileId, filePath }) => {
  checkFileIdIsValid(fileId)
  const keepFn = getStorageFunctionOrThrow({
    functionByStorageType: keepFileFunctionByStorageType,
    operation: 'keepFileForLaterUse',
  })
  await keepFn({ fileId, filePath })
}

/**
 * Resolves the local path of a file previously kept with keepFileForLaterUse, downloading it from
 * external storage into a fresh local temp file first if it isn't already on local disk.
 * Throws if the fileId is invalid or the file cannot be found anymore (e.g. it expired and got cleaned up).
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @returns {Promise<string>} - The local path of the kept file.
 */
export const getKeptFilePath = async ({ fileId }) => {
  checkFileIdIsValid(fileId)
  const getFn = getStorageFunctionOrThrow({
    functionByStorageType: getKeptFilePathFunctionByStorageType,
    operation: 'getKeptFilePath',
  })
  const filePath = await getFn({ fileId })
  if (!filePath) {
    throw new SystemError('dataImport.pendingImportFileNotFoundOrExpired', { fileId })
  }
  return filePath
}

const deletePendingImportFunctionByStorageType = {
  [fileContentStorageTypes.fileSystem]: TempFileRepositoryFileSystem.deletePendingImportFileIfAny,
  [fileContentStorageTypes.s3Bucket]: TempFileRepositoryS3Bucket.deletePendingImportFileIfAny,
}

/**
 * Deletes a file previously kept with keepFileForLaterUse, e.g. when the user cancels an import preview
 * without confirming the import. Does nothing if the file was already consumed, expired and cleaned up,
 * or never kept in the first place.
 *
 * Deletes via the storage-specific key directly (does NOT go through getKeptFilePath + deleteTempFile):
 * for S3 storage, getKeptFilePath returns a freshly-downloaded LOCAL temp copy, not the real S3 key -
 * routing that local path into the generic deleteTempFile would silently no-op against a nonexistent S3
 * key (S3 delete is idempotent), permanently leaking the real pendingImport/<fileId> object, leaving the
 * downloaded temp copy uncleaned, and downloading the file from S3 a second time for nothing.
 * @param {!object} params - The params.
 * @param {!string} params.fileId - The uuid the file was originally uploaded with.
 * @returns {Promise<void>} - A promise resolved when the file has been deleted (or found to not exist).
 */
export const deletePendingImportFileIfAny = async ({ fileId }) => {
  checkFileIdIsValid(fileId)
  const deleteFn = getStorageFunctionOrThrow({
    functionByStorageType: deletePendingImportFunctionByStorageType,
    operation: 'deletePendingImportFileIfAny',
  })
  await deleteFn({ fileId })
}
```

- [ ] **Step 6: No change needed to `deleteTempFile`/`deleteFile`**

`deletePendingImportFileIfAny` no longer routes through `getKeptFilePath` + the generic `deleteTempFile` (see the comment in Step 5's code above for why that would be broken for S3 storage) — each repository now has its own dedicated `deletePendingImportFileIfAny` that deletes via the correct storage-specific key directly. No changes needed to `tempFileRepositoryFileSystem.js`'s existing `deleteFile`/`tempFileRepositoryS3Bucket.js`'s existing `deleteFile` beyond what Steps 3–4 already added.

- [ ] **Step 7: Update `arenaMobileDataImportJob.js`'s one caller to await the now-async function**

In `server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob.js:44`, change:

```js
      const filePath = TempFileManager.getKeptFilePath({ fileId })
```

to:

```js
      const filePath = await TempFileManager.getKeptFilePath({ fileId })
```

(`onStart()` at line 37 is already `async`, so this is a one-line change.)

- [ ] **Step 8: Run the test again to verify it passes**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "pending import file storage routing"`
Expected: PASS (all three tests).

- [ ] **Step 9: Run the full existing file-module and mobile-import test suites**

Run: `yarn build:test:unit && jest dist/__tests__/bundle.unit.js -t "TempFile"`
Then check for existing mobile-import tests: `grep -rl "ArenaMobileDataImportJob" test/`, run any found via the appropriate `yarn test:unit`/`yarn test:integration` command.
Expected: PASS, no regressions.

- [ ] **Step 10: Commit**

```bash
git add server/modules/file/manager/tempFileManager.js server/modules/file/repository/tempFileRepositoryFileSystem.js server/modules/file/repository/tempFileRepositoryS3Bucket.js server/modules/mobile/service/arenaMobileDataImport/arenaMobileDataImportJob.js test/unit/tests/tempFileManagerPendingImport.test.js test/unit/tests/tempFileManagerPendingImportValidation.test.js
git commit -m "fix: make keepFileForLaterUse/getKeptFilePath storage-type-aware so a later request on a different dyno can still find the file"
```

---

### Task 3: Verify chunked upload works across two instances locally

**Files:** none (manual verification, per the design spec's test plan §7).

- [ ] **Step 1: Configure S3 storage locally**

Set `FILE_STORAGE_AWS_S3_BUCKET_NAME` (and the corresponding region/key env vars already used by `createS3BucketRepository`) in your local `.env`, pointing at a test bucket.

- [ ] **Step 2: Build and start two instances against the same DB/bucket on different ports**

```bash
yarn build:server:dev
PORT=9090 node dist/index.js &
PORT=9091 node dist/index.js &
```

- [ ] **Step 3: Simulate alternating-dyno chunk delivery**

Using `curl` or the Playwright codegen tooling (`yarn test:e2e:codegen`), send a multi-chunk file upload (e.g. via the data-import chunked-upload endpoint) with consecutive chunk requests alternating between port 9090 and 9091.

- [ ] **Step 4: Confirm the upload completes successfully**

Expected: the merge step succeeds and the resulting import proceeds normally — no "chunk not found" errors, regardless of which port received which chunk.

- [ ] **Step 5: Stop both instances**

```bash
kill %1 %2
```

This task has no commit — it's a manual verification step confirming Tasks 1–2 work end-to-end, per the design spec's "Local multi-instance simulation" test plan (item 4: "A chunked upload succeeds when consecutive chunk requests are proxied to alternating instances").
