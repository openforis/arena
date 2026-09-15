# Record PDF QR Code Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users optionally stamp a QR code on a current-page printable export so inspectors can scan it with a phone camera and open a stable, unauthenticated hosted copy of the same entity PDF for one year.

**Architecture:** Extend printable export: upsert a public share row + private stored PDF keyed by entity instance; QR encodes `GET /api/public/record-export/:token`. Arena generates the QR PNG and passes `qrCodeImage` into `@openforis/arena-server` PDF/DOCX generators for first-page placement. Re-export keeps the same token, overwrites the PDF, and refreshes expiry.

**Tech Stack:** TypeScript, React 18, MUI/`Checkbox`, pdfkit, docx, Node `qrcode`, Express, Jest, `@openforis/arena-server`, PostgreSQL (`db-migrate`)

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-15-record-pdf-qr-code-export-design.md`
- Predecessor printable export must already be on the branch (merge/rebase `origin/master` first)
- Branches:
  - **Arena:** `feat/record-pdf-qr-code-export` (exists)
  - **arena-server:** create `feat/record-pdf-qr-code-export` from **`origin/master`** in sibling `../arena-server` (local checkout may be stale 1.3.x — do not base on that)
- **New Arena UI files:** `.ts` / `.tsx` only; **no new `.scss` / `.css`**; style with MUI `sx` + existing form components
- QR option defaults **off**; when on → force `exportScope=currentPage`
- Hosted artifact is always **PDF**; DOCX download embeds the same QR image; if DOCX embedding fails complexity gate, hide QR for Word and keep PDF
- Stable identity: one share per `(survey_id, record_uuid, entity_node_uuid)`; same `access_token` on re-export
- Expiry: `expires_at = now + 1 year` on every QR export; public GET returns 404 when expired
- Private file storage only (reuse `SurveyFile` / FS / S3 / DB) — no public S3 bucket
- No Arena Mobile work; no data encoded inside the QR
- No `any` in new TypeScript; JSDoc on exported Arena functions where ESLint requires it
- Do not convert whole legacy modules to TS in this plan

## File structure

| File | Responsibility |
|------|----------------|
| `../arena-server/src/service/survey/docExport/types.ts` | Add optional `qrCodeImage?: Buffer` to `SurveyDocOptions` |
| `../arena-server/src/service/survey/pdfExport/SurveyPdfGenerator.ts` | Draw QR on first page |
| `../arena-server/src/service/survey/docxExport/SurveyDocxGenerator.ts` | Embed QR on first section (or defer) |
| `../arena-server/.../public/migrations/YYYYMMDDHHMMSS-create-table-record-printable-export-share.js` | Public schema migration wrapper |
| `../arena-server/.../sqls/...-up.sql` / `-down.sql` | `record_printable_export_share` table |
| Arena `core/survey/surveyFile.js` | Add `SurveyFileType.printableExportPdf` |
| Arena `server/modules/record/repository/recordPrintableExportShareRepository.js` | **NEW** — CRUD / upsert / get-by-token |
| Arena `server/modules/record/service/recordPrintableExportShareService.js` | **NEW** — upsert+store PDF, public fetch, delete-by-record |
| Arena `server/modules/record/service/qrCodePng.js` | **NEW** — `toQrPngBuffer(url)` via `qrcode` |
| Arena `server/modules/record/api/recordPrintableExportPublicApi.js` | **NEW** — public GET route |
| Arena `server/system/apiRouter.js` | Register public API module |
| Arena `server/modules/record/api/recordApi.js` | Pass `includeQrCode` + server URL into export |
| Arena `server/modules/record/service/recordService.js` | QR export orchestration in `exportRecordDocument` |
| Arena `server/modules/record/manager/_recordManager/recordUpdateManager.js` | Delete shares + files on record delete |
| Arena `webapp/service/api/data/recordPrintableExportUrl.ts` | Add `includeQrCode` query param |
| Arena `webapp/.../RecordPrintableExportModal.tsx` | Checkbox + force current page |
| Arena i18n `surveyForm` (en + others as needed) | QR labels / hints |
| Arena `test/unit/tests/040recordPrintableExportUrl.test.js` | Extend URL tests |
| Arena `test/integration/...` or unit for share service | Upsert / expiry / public GET |

---

### Task 0: Sync printable-export baseline

**Repo:** Arena `feat/record-pdf-qr-code-export`  
**Also:** `../arena-server` → checkout/create `feat/record-pdf-qr-code-export` from `origin/master`

**Files:**
- Merge/rebase only — no feature code yet

- [ ] **Step 1: Bring Arena branch onto printable export**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena
git fetch origin
git merge origin/master
# resolve conflicts if any; keep design/plan docs from this branch
```

Confirm these exist after merge:

- `webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx`
- `webapp/service/api/data/recordPrintableExportUrl.ts`
- `common/record/printableExport.ts`

- [ ] **Step 2: Align sibling arena-server**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena-server
git fetch origin
git checkout -b feat/record-pdf-qr-code-export origin/master
# package.json version should be >= 2.2.8 with SurveyDocOptions exportScope fields
```

In Arena, ensure `@openforis/arena-server` resolves to this sibling (`file:../arena-server` or matching published range) and `yarn install` succeeds.

- [ ] **Step 3: Commit merge only if merge created a commit**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena
git status
# if merge commit pending:
git commit --no-edit   # or complete merge message
```

---

### Task 1: arena-server — accept QR image and stamp PDF first page

**Repo:** `../arena-server`  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `src/service/survey/docExport/types.ts`
- Modify: `src/service/survey/pdfExport/SurveyPdfGenerator.ts`
- Test: add or extend a small unit test under `src/service/survey/pdfExport/` or docExport tests if a harness already exists; otherwise manual buffer smoke in Step 4

**Interfaces:**
- Consumes: existing `SurveyDocOptions`, `generateSurveyPdf`
- Produces: `SurveyDocOptions.qrCodeImage?: Buffer` — PNG bytes; when set, drawn on first page only

- [ ] **Step 1: Extend options type**

In `src/service/survey/docExport/types.ts`, add to `SurveyDocOptions`:

```typescript
  /**
   * Optional QR code PNG buffer. When set, drawn on the first page only
   * (top-right, with quiet zone). Used by printable export public links.
   */
  qrCodeImage?: Buffer
```

- [ ] **Step 2: Stamp QR after first-page decorations in `generateSurveyPdf`**

Constants (near other layout constants in `SurveyPdfGenerator.ts`):

```typescript
const QR_SIZE_PT = 72
const QR_MARGIN_FROM_EDGE_PT = 40
```

Helper:

```typescript
const drawQrCodeOnFirstPage = (doc: PDFKit.PDFDocument, qrCodeImage: Buffer): void => {
  const x = doc.page.width - doc.page.margins.right - QR_SIZE_PT
  const y = Math.max(doc.page.margins.top, QR_MARGIN_FROM_EDGE_PT)
  doc.image(qrCodeImage, x, y, { width: QR_SIZE_PT, height: QR_SIZE_PT })
}
```

In `generateSurveyPdf`, after creating the document and drawing page-0 decorations / advancing past header, if `options.qrCodeImage` is set:

```typescript
  if (options.qrCodeImage) {
    drawQrCodeOnFirstPage(doc, options.qrCodeImage)
  }
```

Do **not** redraw the QR on subsequent pages.

- [ ] **Step 3: Build arena-server**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena-server
yarn build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/service/survey/docExport/types.ts src/service/survey/pdfExport/SurveyPdfGenerator.ts
git commit -m "$(cat <<'EOF'
feat(pdf): stamp optional QR image on first page

Allow printable export callers to pass a PNG buffer for public
record-export links on the first PDF page.
EOF
)"
```

---

### Task 2: arena-server — DOCX QR (with PDF-only fallback gate)

**Repo:** `../arena-server`  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `src/service/survey/docxExport/SurveyDocxGenerator.ts`

**Interfaces:**
- Consumes: `SurveyDocOptions.qrCodeImage`
- Produces: DOCX first section includes QR image when buffer present

- [ ] **Step 1: Attempt first-section QR embed**

Follow existing DOCX image embedding patterns in `SurveyDocxGenerator.ts` (header/survey doc images). If a first-page/header image path exists, add a right-aligned or trailing QR image from `options.qrCodeImage` (same ~72pt visual size).

If after ~30–60 minutes this is unclear or brittle:

- [ ] **Step 1b: Explicit PDF-only fallback**

Leave DOCX generator unchanged. Document in Arena Task 6/7 that the modal hides QR when format is Word. Still commit a short note in arena-server CHANGELOG or commit message: `docx QR deferred; PDF only`.

- [ ] **Step 2: Build + commit**

```bash
yarn build
git add src/service/survey/docxExport/SurveyDocxGenerator.ts
git commit -m "$(cat <<'EOF'
feat(docx): embed optional QR image on first section

Or document deferral if embedding is skipped for v1.
EOF
)"
```

---

### Task 3: arena-server — `record_printable_export_share` migration

**Repo:** `../arena-server`  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Create: `src/db/dbMigrator/migration/public/migrations/20260915160000-create-table-record-printable-export-share.js`
- Create: `src/db/dbMigrator/migration/public/migrations/sqls/20260915160000-create-table-record-printable-export-share-up.sql`
- Create: `src/db/dbMigrator/migration/public/migrations/sqls/20260915160000-create-table-record-printable-export-share-down.sql`

(Adjust timestamp if a newer migration already exists on the branch — must be **after** latest public migration.)

**Interfaces:**
- Produces: public table `record_printable_export_share`

- [ ] **Step 1: Write up SQL**

`...-up.sql`:

```sql
CREATE TABLE record_printable_export_share (
  uuid              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id         integer     NOT NULL,
  record_uuid       uuid        NOT NULL,
  entity_def_uuid   uuid        NOT NULL,
  entity_node_uuid  uuid        NOT NULL,
  access_token      text        NOT NULL,
  file_uuid         uuid        NOT NULL,
  content_type      varchar     NOT NULL DEFAULT 'application/pdf',
  download_count    integer     NOT NULL DEFAULT 0,
  date_created      TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
  date_modified     TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'),
  expires_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  CONSTRAINT record_printable_export_share_survey_fk
    FOREIGN KEY (survey_id) REFERENCES survey (id) ON DELETE CASCADE,
  CONSTRAINT record_printable_export_share_token_unq UNIQUE (access_token),
  CONSTRAINT record_printable_export_share_entity_unq
    UNIQUE (survey_id, record_uuid, entity_node_uuid)
);

CREATE INDEX record_printable_export_share_expires_at_idx
  ON record_printable_export_share (expires_at);
```

Note: no FK to `survey_<id>.record` (per-survey schemas). Record cleanup is application-level (Task 8).

- [ ] **Step 2: Write down SQL**

```sql
DROP TABLE IF EXISTS record_printable_export_share;
```

- [ ] **Step 3: JS wrapper**

Copy the pattern from `20260819100000-create-table-job.js` (readFile + `db.runSql`).

- [ ] **Step 4: Commit**

```bash
git add src/db/dbMigrator/migration/public/migrations/20260915160000-create-table-record-printable-export-share.js \
  src/db/dbMigrator/migration/public/migrations/sqls/20260915160000-create-table-record-printable-export-share-up.sql \
  src/db/dbMigrator/migration/public/migrations/sqls/20260915160000-create-table-record-printable-export-share-down.sql
git commit -m "$(cat <<'EOF'
feat(db): add record_printable_export_share table

Store stable public tokens and file pointers for QR printable exports.
EOF
)"
```

---

### Task 4: Arena — file type + share repository/service + QR PNG helper

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `core/survey/surveyFile.js` — add `printableExportPdf: 'printableExportPdf'` to `SurveyFileType`
- Create: `server/modules/record/repository/recordPrintableExportShareRepository.js`
- Create: `server/modules/record/service/recordPrintableExportShareService.js`
- Create: `server/modules/record/service/qrCodePng.js`
- Modify: `package.json` — add dependency `qrcode` (and `@types/qrcode` if used from TS; JS is fine)

**Interfaces:**
- Consumes: `SurveyFileService.insertFile`, `SurveyFileService.fetchFileContentAsBuffer`, `SurveyFileService.deleteFilesAndContentByUuids`, `FileRepositoryFileSystem.writeFileContent` / S3 upload via existing storage path, `db`
- Produces:
  - `qrCodePng.toQrPngBuffer(url: string): Promise<Buffer>`
  - `RecordPrintableExportShareService.upsertShareWithPdf({ surveyId, recordUuid, entityDefUuid, entityNodeUuid, pdfBuffer }): Promise<{ accessToken: string, expiresAt: Date }>`
  - `RecordPrintableExportShareService.fetchValidPdfByToken({ token }): Promise<{ buffer: Buffer, contentType: string } | null>`
  - `RecordPrintableExportShareService.deleteByRecordUuid({ surveyId, recordUuid }, client?)`
  - `RecordPrintableExportShareService.incrementDownloadCount({ uuid }, client?)`

- [ ] **Step 1: Add dependency**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena
yarn add qrcode
```

- [ ] **Step 2: QR helper**

`server/modules/record/service/qrCodePng.js`:

```javascript
import QRCode from 'qrcode'

/**
 * Renders a URL as a PNG buffer for PDF/DOCX embedding.
 *
 * @param {string} url - Absolute public URL encoded in the QR.
 * @returns {Promise<Buffer>} PNG bytes.
 */
export const toQrPngBuffer = async (url) => {
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  })
}
```

- [ ] **Step 3: Repository**

`recordPrintableExportShareRepository.js` — use `db` / `Schemata` patterns from nearby repositories. Implement at least:

```javascript
export const fetchBySurveyRecordEntityNode = async (
  { surveyId, recordUuid, entityNodeUuid },
  client = db
) => client.oneOrNone(
  `SELECT * FROM record_printable_export_share
   WHERE survey_id = $1 AND record_uuid = $2 AND entity_node_uuid = $3`,
  [surveyId, recordUuid, entityNodeUuid]
)

export const fetchByAccessToken = async ({ accessToken }, client = db) =>
  client.oneOrNone(
    `SELECT * FROM record_printable_export_share WHERE access_token = $1`,
    [accessToken]
  )

export const insert = async (row, client = db) => { /* INSERT ... RETURNING * */ }

export const updateOnReexport = async (
  { uuid, fileUuid, expiresAt, dateModified },
  client = db
) => { /* UPDATE file_uuid, expires_at, date_modified WHERE uuid = $1 RETURNING * */ }

export const incrementDownloadCount = async ({ uuid }, client = db) =>
  client.none(
    `UPDATE record_printable_export_share
     SET download_count = download_count + 1
     WHERE uuid = $1`,
    [uuid]
  )

export const deleteByRecordUuid = async ({ surveyId, recordUuid }, client = db) =>
  client.manyOrNone(
    `DELETE FROM record_printable_export_share
     WHERE survey_id = $1 AND record_uuid = $2
     RETURNING file_uuid`,
    [surveyId, recordUuid]
  )
```

Use `crypto.randomBytes(32).toString('base64url')` for new tokens in the **service**, not the repository.

- [ ] **Step 4: Service upsert + store**

`recordPrintableExportShareService.js` outline:

```javascript
import { randomBytes } from 'node:crypto'
import * as SurveyFile from '@core/survey/surveyFile'
import * as SurveyFileService from '@server/modules/survey/service/surveyFileService'
import * as FileRepositoryFileSystem from '@server/modules/record/repository/fileRepositoryFileSystem'
import * as FileRepositoryS3Bucket from '@server/modules/record/repository/fileRepositoryS3Bucket'
import * as ProcessUtils from '@core/processUtils'
import * as ShareRepository from '../repository/recordPrintableExportShareRepository'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

const newExpiresAt = () => new Date(Date.now() + ONE_YEAR_MS)

const overwriteFileContent = async ({ surveyId, fileUuid, content }) => {
  // Prefer existing storage backends: if S3 configured use uploadFileContent;
  // else if FILE_STORAGE_PATH use writeFileContent; else update DB content via FileRepository
  // Mirror SurveyFileManager.insertFile content-write branch without inserting a new row.
}

/**
 * Creates or refreshes a printable-export share and stores/overwrites the PDF.
 *
 * @param {object} params
 * @returns {Promise<{ accessToken: string, expiresAt: Date }>}
 */
export const upsertShareWithPdf = async ({
  surveyId,
  recordUuid,
  entityDefUuid,
  entityNodeUuid,
  pdfBuffer,
}) => {
  const existing = await ShareRepository.fetchBySurveyRecordEntityNode({
    surveyId,
    recordUuid,
    entityNodeUuid,
  })
  const expiresAt = newExpiresAt()

  if (existing) {
    await overwriteFileContent({
      surveyId,
      fileUuid: existing.file_uuid,
      content: pdfBuffer,
    })
    await SurveyFileService.updateFileProps?.(
      surveyId,
      existing.file_uuid,
      /* size update if API available */
    )
    await ShareRepository.updateOnReexport({
      uuid: existing.uuid,
      fileUuid: existing.file_uuid,
      expiresAt,
      dateModified: new Date(),
    })
    return { accessToken: existing.access_token, expiresAt }
  }

  const accessToken = randomBytes(32).toString('base64url')
  const file = SurveyFile.createFile({
    name: `printable-export-${entityNodeUuid}.pdf`,
    size: Buffer.byteLength(pdfBuffer),
    content: pdfBuffer,
    recordUuid,
    nodeUuid: entityNodeUuid,
    type: SurveyFile.SurveyFileType.printableExportPdf,
  })
  const insertedFile = await SurveyFileService.insertFile(surveyId, file)
  await ShareRepository.insert({
    surveyId,
    recordUuid,
    entityDefUuid,
    entityNodeUuid,
    accessToken,
    fileUuid: SurveyFile.getUuid(insertedFile),
    contentType: 'application/pdf',
    expiresAt,
  })
  return { accessToken, expiresAt }
}

export const fetchValidPdfByToken = async ({ token }) => {
  const row = await ShareRepository.fetchByAccessToken({ accessToken: token })
  if (!row) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) return null
  const buffer = await SurveyFileService.fetchFileContentAsBuffer({
    surveyId: row.survey_id,
    fileUuid: row.file_uuid,
  })
  if (!buffer) return null
  await ShareRepository.incrementDownloadCount({ uuid: row.uuid }).catch(() => {})
  return { buffer, contentType: row.content_type || 'application/pdf' }
}

export const deleteByRecordUuid = async ({ surveyId, recordUuid }, client) => {
  const deleted = await ShareRepository.deleteByRecordUuid({ surveyId, recordUuid }, client)
  const fileUuids = (deleted || []).map((r) => r.file_uuid).filter(Boolean)
  if (fileUuids.length > 0) {
    await SurveyFileService.deleteFilesAndContentByUuids({ surveyId, fileUuids }, client)
  }
}
```

Implement `overwriteFileContent` by reading how `SurveyFileManager.insertFile` chooses storage (`ProcessUtils.ENV.fileStorageAwsS3BucketName` / `fileStoragePath`) and calling the same write function for an existing uuid. If DB-only storage has no update helper, delete+reinsert file and update `file_uuid` on the share (still keep `access_token`).

- [ ] **Step 5: Commit**

```bash
git add core/survey/surveyFile.js package.json yarn.lock \
  server/modules/record/repository/recordPrintableExportShareRepository.js \
  server/modules/record/service/recordPrintableExportShareService.js \
  server/modules/record/service/qrCodePng.js
git commit -m "$(cat <<'EOF'
feat(record): add printable export share storage helpers

Persist stable QR tokens and private PDF bytes for public scan links.
EOF
)"
```

---

### Task 5: Public GET `/api/public/record-export/:token`

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Create: `server/modules/record/api/recordPrintableExportPublicApi.js`
- Modify: `server/system/apiRouter.js`

**Interfaces:**
- Consumes: `RecordPrintableExportShareService.fetchValidPdfByToken`
- Produces: unauthenticated `GET /api/public/record-export/:token`

- [ ] **Step 1: Write failing integration/unit expectation**

If an HTTP integration harness is heavy, write a service-level test that expired tokens return null (Task 9). For this task, implement the route and smoke-test manually or with a minimal Jest spy.

- [ ] **Step 2: Implement API**

`recordPrintableExportPublicApi.js`:

```javascript
import { StatusCodes } from 'http-status-codes'

import * as RecordPrintableExportShareService from '@server/modules/record/service/recordPrintableExportShareService'
import * as Response from '@server/utils/response'
import { sendErr } from '@server/utils/response'

export const init = (app) => {
  app.get('/public/record-export/:token', async (req, res, next) => {
    try {
      const { token } = req.params
      const result = await RecordPrintableExportShareService.fetchValidPdfByToken({ token })
      if (!result) {
        res.status(StatusCodes.NOT_FOUND).end()
        return
      }
      res.setHeader('Content-Type', result.contentType)
      res.setHeader('Content-Disposition', 'inline; filename="record-export.pdf"')
      res.status(StatusCodes.OK).send(result.buffer)
    } catch (error) {
      next(error)
    }
  })
}
```

- [ ] **Step 3: Register in `apiRouter.js`**

```javascript
import * as recordPrintableExportPublicApi from '@server/modules/record/api/recordPrintableExportPublicApi'
// in init list:
recordPrintableExportPublicApi.init(router)
```

Place near `recordApi` / `fileDownloadApi`.

- [ ] **Step 4: Commit**

```bash
git add server/modules/record/api/recordPrintableExportPublicApi.js server/system/apiRouter.js
git commit -m "$(cat <<'EOF'
feat(api): serve public printable export PDFs by token

Allow phone-camera QR scans to open the hosted entity PDF without login.
EOF
)"
```

---

### Task 6: Wire `includeQrCode` into authenticated export

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `server/modules/record/api/recordApi.js`
- Modify: `server/modules/record/service/recordService.js`

**Interfaces:**
- Consumes: `toQrPngBuffer`, `upsertShareWithPdf`, `Request.getServerUrl`, `SurveyPdfGenerator.generateSurveyPdf`
- Produces: export with optional QR; query param `includeQrCode=true`

- [ ] **Step 1: API query param**

In both `/export/pdf` and `/export/docx` handlers on `origin/master` shape, read:

```javascript
const includeQrCode = String(req.query.includeQrCode || '').toLowerCase() === 'true'
const serverUrl = Request.getServerUrl(req)
```

Pass `includeQrCode` and `serverUrl` into `exportRecordPdf` / `exportRecordDocx`.

- [ ] **Step 2: Orchestrate in `exportRecordDocument`**

Extend signature with `includeQrCode = false`, `serverUrl = null`.

When `includeQrCode` is true:

1. Require `exportScope === PrintableExportScopes.currentPage` and valid entity UUIDs → else `SystemError` / `400` (`appErrors:recordPrintableExport.qrRequiresCurrentPage` or reuse missing entity error).
2. Always generate the **hosted PDF** with QR:
   - First upsert path needs token before QR image exists → use two-phase:

```javascript
  // Phase A: ensure share row + token exist (create placeholder file or upsert token-only then write file)
  // Recommended concrete order:
  // 1. Fetch existing share OR create accessToken in memory
  // 2. publicUrl = `${serverUrl}/api/public/record-export/${accessToken}`
  // 3. qrCodeImage = await toQrPngBuffer(publicUrl)
  // 4. pdfResult = await SurveyPdfGenerator.generateSurveyPdf({ ...options, qrCodeImage, exportScope: currentPage, ... })
  // 5. await upsertShareWithPdf({ ..., pdfBuffer: pdfResult.buffer, accessToken if new })
  // 6. If extension === 'pdf': send pdfResult.buffer
  // 7. If extension === 'docx': generateSurveyDocx({ ...options, qrCodeImage }) and send that buffer
```

**Token-first detail for new shares:** extend service with `ensureShareToken({ surveyId, recordUuid, entityDefUuid, entityNodeUuid })` that inserts a row only after file exists, **or**:

1. `accessToken = existing?.access_token ?? randomBytes...`
2. Generate PDF with QR for that token URL
3. `upsertShareWithPdf` accepts optional `accessToken` for insert; on insert uses provided token; on update keeps existing

If first insert requires `file_uuid NOT NULL`, always generate PDF first with a **precomputed** token (do not insert DB until PDF ready), then insert share+file together. On re-export, reuse existing token from `fetchBySurveyRecordEntityNode`.

```javascript
  let accessToken
  const existing = await ShareRepository.fetchBySurveyRecordEntityNode({ surveyId, recordUuid, entityNodeUuid })
  accessToken = existing?.access_token ?? randomBytes(32).toString('base64url')
  const publicUrl = `${serverUrl}/api/public/record-export/${accessToken}`
  const qrCodeImage = await toQrPngBuffer(publicUrl)
  const pdfResult = await SurveyPdfGenerator.generateSurveyPdf({ ...baseOptions, qrCodeImage })
  await upsertShareWithPdf({
    surveyId,
    recordUuid,
    entityDefUuid,
    entityNodeUuid,
    pdfBuffer: pdfResult.buffer,
    accessToken, // service must honor this on insert
  })
```

If `includeQrCode` is false, keep today’s single `generator(...)` call unchanged (no QR).

If QR/storage throws, do **not** send a download — propagate error.

- [ ] **Step 3: Commit**

```bash
git add server/modules/record/api/recordApi.js server/modules/record/service/recordService.js \
  server/modules/record/service/recordPrintableExportShareService.js
git commit -m "$(cat <<'EOF'
feat(record): include QR code on printable export when requested

Generate a stable public PDF link, stamp QR on the document, and
store the hosted entity PDF for camera scans.
EOF
)"
```

---

### Task 7: Modal UI + URL builder + i18n

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `webapp/service/api/data/recordPrintableExportUrl.ts`
- Modify: `webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx`
- Modify: i18n files that define `surveyForm:printableExport.*` (en required; other langs as project usually does)
- Modify: `test/unit/tests/040recordPrintableExportUrl.test.js`

**Interfaces:**
- Consumes: modal state; `getRecordPrintableExportUrl`
- Produces: `includeQrCode` query flag; UI forces current page when QR on

- [ ] **Step 1: Failing URL unit test**

Add to `040recordPrintableExportUrl.test.js`:

```javascript
  test('includes includeQrCode when true', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.pdf,
      exportScope: PrintableExportScopes.currentPage,
      entityDefUuid: 'def-1',
      entityNodeUuid: 'node-1',
      orientation: PrintOrientations.portrait,
      includeQrCode: true,
    })
    expect(url).toContain('includeQrCode=true')
  })

  test('omits includeQrCode when false or unset', () => {
    const url = getRecordPrintableExportUrl({
      surveyId: 1,
      recordUuid: 'rec-1',
      lang: 'en',
      format: PrintableExportFormats.pdf,
    })
    expect(url).not.toContain('includeQrCode')
  })
```

Run:

```bash
yarn test:unit -- test/unit/tests/040recordPrintableExportUrl.test.js
# or project’s equivalent jest invocation after unit bundle if required
```

Expected: FAIL (param not implemented).

- [ ] **Step 2: Extend URL builder**

```typescript
export type RecordPrintableExportUrlParams = {
  // ...existing fields
  includeQrCode?: boolean
}

// in getRecordPrintableExportUrl:
  if (includeQrCode) {
    query.set('includeQrCode', 'true')
  }
```

- [ ] **Step 3: Modal checkbox**

In `RecordPrintableExportModal.tsx`:

```typescript
import { Checkbox } from '@webapp/components/form'

const [includeQrCode, setIncludeQrCode] = useState(false)

useEffect(() => {
  if (includeQrCode) {
    setExportScope(PrintableExportScopes.currentPage)
  }
}, [includeQrCode])

// scope RadioButtonGroup: disable Full survey when includeQrCode
// items or onChange guard

// href useMemo: pass includeQrCode

// In JSX after scope controls:
<Checkbox
  checked={includeQrCode}
  onChange={(checked) => setIncludeQrCode(Boolean(checked))}
  label="surveyForm:printableExport.includeQrCode"
  info="surveyForm:printableExport.includeQrCodeInfo"
/>
```

If DOCX QR was deferred in Task 2: when `format === PrintableExportFormats.docx`, either hide checkbox or force `includeQrCode` false and show hint.

`canDownload` unchanged aside from QR still requiring current-page entity node.

- [ ] **Step 4: i18n (en)**

```javascript
includeQrCode: 'Include QR code',
includeQrCodeInfo: 'Adds a QR code on the first page linking to a read-only copy of this page’s entity PDF (valid for 1 year).',
```

- [ ] **Step 5: Re-run unit test — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add webapp/service/api/data/recordPrintableExportUrl.ts \
  webapp/components/survey/SurveyForm/components/RecordPrintableExportModal.tsx \
  test/unit/tests/040recordPrintableExportUrl.test.js \
  # i18n files touched
git commit -m "$(cat <<'EOF'
feat(ui): add include-QR option to printable export modal

Force current-page scope when QR is enabled and pass the flag to the API.
EOF
)"
```

---

### Task 8: Cascade delete shares on record delete

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Modify: `server/modules/record/manager/_recordManager/recordUpdateManager.js`

**Interfaces:**
- Consumes: `RecordPrintableExportShareService.deleteByRecordUuid`
- Produces: record delete removes share rows + stored PDFs

- [ ] **Step 1: Hook `deleteRecord`**

Inside the existing transaction in `deleteRecord`, after/before file mark-deleted (same `t` client):

```javascript
await RecordPrintableExportShareService.deleteByRecordUuid(
  { surveyId, recordUuid: uuid },
  t
)
```

Also call from bulk record delete paths that hard-delete records if they exist and would orphan shares (`deleteRecordsByCycles` callers, etc.). At minimum cover `deleteRecord` and preview hard-delete paths that already delete files.

Survey delete remains covered by `ON DELETE CASCADE` on `survey_id` plus existing survey file content cleanup — after survey delete, also ensure printable-export file uuids on FS/S3 are removed if they were not under the dropped survey schema content path. If printable export files live in `survey_<id>.file`, schema drop removes DB rows; call `deleteFilesContentByUuids` only if you collected uuids before drop (optional hardening; FK cascade on share is enough for metadata).

- [ ] **Step 2: Commit**

```bash
git add server/modules/record/manager/_recordManager/recordUpdateManager.js
git commit -m "$(cat <<'EOF'
fix(record): delete printable export shares when record is deleted

Prevent orphaned public QR links and stored PDF files.
EOF
)"
```

---

### Task 9: Tests for share upsert, expiry, and public fetch

**Repo:** Arena  
**Branch:** `feat/record-pdf-qr-code-export`

**Files:**
- Create: `test/unit/tests/041recordPrintableExportShare.test.js` **or** integration test under `test/integration/tests/` following `013surveyFilesExportImportTest.js` if DB is required

Prefer **integration** if repository needs Postgres; otherwise mock `db` only for pure URL/QR helpers.

**Minimum cases:**

```javascript
describe('record printable export share', () => {
  test('upsert keeps access token and refreshes expiry', async () => { /* ... */ })
  test('fetchValidPdfByToken returns null when expired', async () => { /* ... */ })
  test('fetchValidPdfByToken returns null for unknown token', async () => { /* ... */ })
})
```

For expiry without waiting: insert row with `expires_at` in the past via repository, assert `fetchValidPdfByToken` → `null`.

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run — expect FAIL if gaps**
- [ ] **Step 3: Fix service until PASS**
- [ ] **Step 4: Commit**

```bash
git add test/
git commit -m "$(cat <<'EOF'
test(record): cover printable export share token lifecycle

Assert stable tokens, expiry 404 behavior, and upsert refresh.
EOF
)"
```

---

### Task 10: Manual verification + arena-server consume bump

**Repo:** Arena + arena-server

- [ ] **Step 1: Manual checklist**

1. Run migrations (`yarn server:migrate` or start server).
2. Open a record page (entity), Export Document → enable Include QR → PDF.
3. Confirm QR on page 1 of downloaded PDF.
4. Open the QR URL (decode or scan) → PDF opens inline without login.
5. Re-export same entity → URL path token unchanged; PDF content updated; `expires_at` pushed ~1 year.
6. Export with QR unchecked → no QR, no share refresh required.
7. If DOCX QR enabled: Word opens with QR; scan still hits PDF. If deferred: QR checkbox hidden for Word.

- [ ] **Step 2: Publish / bump arena-server**

When arena-server changes are ready for Arena consumption:

- Bump arena-server package version per their release process
- Update Arena `package.json` `@openforis/arena-server` dependency
- `yarn install`

```bash
git add package.json yarn.lock
git commit -m "$(cat <<'EOF'
chore(deps): bump arena-server for printable export QR stamping
EOF
)"
```

If still on `file:../arena-server` for local demo, note that in the PR and bump when publishing.

- [ ] **Step 3: Push branches for Stefano review**

```bash
cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena
git push -u origin HEAD

cd /Users/andrea-unibo/Developer/work/FAO/openforis/arena-server
git push -u origin HEAD
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Optional QR in printable modal | 7 |
| Force current page when QR on | 6, 7 |
| QR on first page | 1 (PDF), 2 (DOCX) |
| Same hosted PDF as export content | 6 |
| Stable token URL; overwrite on re-export | 4, 6 |
| 1-year expiry | 4, 9 |
| Public GET no auth | 5 |
| Private storage | 4 |
| download_count best-effort | 4, 5 |
| Cascade delete with record/survey | 3 (survey FK), 8 (record) |
| DOCX attempt / PDF-only fallback | 2, 7 |
| Coding style TS / no new SCSS | Global + 7 |

## Placeholder / consistency self-review

- No TBD steps left; DOCX complexity uses explicit Step 1b fallback.
- `accessToken` naming consistent across repository (`access_token`), service, and URL.
- Table name `record_printable_export_share` matches migration and repository SQL.
- Public path `/api/public/record-export/:token` matches QR URL built as `${serverUrl}/api/public/record-export/${accessToken}` (apiRouter mounts at `/api`).
