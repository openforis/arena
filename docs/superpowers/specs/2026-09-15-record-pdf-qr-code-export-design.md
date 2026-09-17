# Record PDF QR Code Export — Design Spec

**Date:** 2026-09-15  
**Branch:** `feat/record-pdf-qr-code-export` (from `master`)  
**Reference:** [Trello](https://trello.com/c/p466YUnB/25-add-qr-code-option-to-pdf-export-to-access-related-arena-data), [Tech meeting 2026-09-14](https://app.notion.com/p/3dba458bdbaf80e394f7c9b3adca36d4)  
**Repos:** `arena` (UI, export API, public route, DB metadata) and sibling `arena-server` (QR stamp in PDF/DOCX)  
**Predecessor:** `docs/superpowers/specs/2026-08-05-record-printable-export-options-design.md`

---

## 1. Overview

Add an optional QR code to record printable export so field inspectors can scan a paper document with a phone camera and open a **read-only hosted copy of the same entity PDF** in the browser—no Arena account and no dedicated app.

The downloaded document is always the **current page entity** when QR is enabled. The QR encodes a **stable public URL** backed by a private stored PDF. Re-export overwrites that PDF and refreshes expiry. Links expire after **one year** from the last QR export.

This extends the existing printable-export modal and arena-server document pipeline; it does not introduce a separate PDF stack.

---

## 2. Coding style & UI conventions

Align with printable-export and recent record-entry UI work:

| Rule | Detail |
|------|--------|
| **New files = TypeScript** | New components, hooks, and API helpers are `.tsx` / `.ts` only |
| **No new SCSS/CSS** | Prefer MUI `sx`, `styled`, and theme tokens |
| **Existing JS files** | Small patches allowed (e.g. wire modal props); wholesale JS→TS conversion out of scope |
| **Theme** | `webapp/theme/tokens.ts` or MUI theme — no one-off palettes |
| **Types** | No `any`; explicit nullability |
| **Logging** | No `console.log` (server: log4js) |

---

## 3. Scope

### In scope (v1)

| Area | What |
|------|------|
| Export UI | Optional “Include QR code” on `RecordPrintableExportModal` |
| Entity selection | Current form page only (no entity picker) |
| QR placement | First page of the downloaded PDF or DOCX |
| Hosted artifact | Always an entity **PDF** (even when user downloads DOCX) |
| Public access | Tokenized `GET /api/public/record-export/:token` (no auth) |
| Storage | Private file storage (existing S3 / FS / DB backends) |
| Stability | One share per entity instance; re-export overwrites file and refreshes expiry |
| Expiry | One year from last QR export |
| Tracking | DB metadata; optional `download_count` on public GET |
| Cleanup | Delete share + file when record or survey is deleted |
| Formats | Prefer QR for PDF **and** DOCX; fall back to PDF-only if DOCX embedding is too complex |

### Out of scope (v1)

- Arena Mobile QR scanner / deep links
- Encoding record data inside the QR payload
- Dedicated public S3 bucket or CDN
- Entity picker or nodeDef “QR target” flag
- Number-to-text / text-to-number (separate track)
- Download analytics UI
- Scheduled purge job for expired rows (serving must still 404; physical purge later)
- Survey designer blank-form PDF QR

---

## 4. Decisions log

| Decision | Choice |
|----------|--------|
| What QR opens | Hosted copy of the **same** entity PDF the user exported |
| Entity | Always **current page** entity |
| Entity picker | None — navigate to the page first |
| When to include QR | Optional checkbox in printable export modal |
| QR page | First page |
| URL lifetime | Stable token URL; overwrite file on re-export; expiry = last export + **1 year** |
| Hosting | Arena public endpoint + **private** storage (not public S3) |
| DOCX | Attempt QR for both; allow PDF-only fallback |
| Inspector auth | None (unguessable token + expiry) |

---

## 5. Architecture

```
RecordPrintableExportModal
  format · orientation · includeQrCode
  scope: currentPage (forced when QR on)
        │
        ▼
GET .../record/:recordUuid/export/{pdf|docx}
  ?exportScope=currentPage&entityDefUuid&entityNodeUuid
  &orientation&includeQrCode=true&lang
        │
        ▼
exportRecordDocument (Arena)
  ├─ generate entity document (arena-server)
  ├─ if includeQrCode:
  │     upsert share row (token, expiresAt)
  │     store/overwrite PDF bytes in private storage
  │     stamp QR on first page → public URL
  │     (DOCX download: QR image in doc; hosted file still PDF)
  └─ stream download to authenticated user
                │
                ▼  (inspector scan)
GET /api/public/record-export/:token
  validate token + expiry → stream PDF
```

**Approach:** Arena token proxy over private storage (chosen over public S3 bucket or short-lived presigned URLs).

---

## 6. Export UI & behavior

### Modal (`RecordPrintableExportModal`)

| Control | Behavior |
|---------|----------|
| Include QR code | Checkbox; default **off** |
| Format | PDF / Word; QR offered for both unless Word is deferred |
| Scope | When QR checked → force **Current page only**, disable Full survey; show hint that QR targets this page’s entity |
| Entity | Current form page; read-only label hint (existing current-page pattern) |
| Orientation | Unchanged (document default + entity Print props) |

### QR payload

Absolute URL:

`{serverPublicOrigin}/api/public/record-export/{token}`

Use the same public origin pattern as QR login (`location.origin` / configured server URL) so printed PDFs work outside the exporter’s machine.

### Download vs hosted content

| User downloads | QR / hosted file |
|----------------|------------------|
| PDF (current page + QR) | Same PDF bytes (stored) |
| DOCX (current page + QR image) | Entity **PDF** generated and stored for the public URL |

---

## 7. Arena backend

### Authenticated export

Extend existing printable export endpoints with:

| Param | Values | Notes |
|-------|--------|-------|
| `includeQrCode` | `true` \| `false` / omit | Default omit = no QR |

When `includeQrCode` is true:

1. Require `exportScope=currentPage` with valid `entityDefUuid` and `entityNodeUuid` (else `400`).
2. Generate the entity PDF used for hosting (even if format is DOCX).
3. Upsert share metadata; write/overwrite PDF in private storage.
4. Pass QR URL (and/or image buffer) into arena-server generation for the user-facing PDF/DOCX.
5. Stream the user-facing document.

Auth for export remains `requireRecordViewPermission` (unchanged).

### Public API

`GET /api/public/record-export/:token`

| Outcome | Response |
|---------|----------|
| Valid, not expired, file present | `200`, `Content-Type: application/pdf`, prefer `Content-Disposition: inline` |
| Unknown / expired / missing file | `404` |
| Storage failure | `500` / `503` + server log |

No session cookie required. Increment `download_count` best-effort on success.

---

## 8. Data model & storage

### Table `record_printable_export_share`

(Name may be adjusted to match Arena naming conventions.)

| Column | Purpose |
|--------|---------|
| `uuid` | Primary key |
| `survey_id` | Survey; cascade on survey delete |
| `record_uuid` | Record; cascade on record delete |
| `entity_def_uuid` | Entity definition |
| `entity_node_uuid` | Entity instance |
| `access_token` | Unique unguessable token (e.g. 32+ bytes hex/base64url) |
| `file_uuid` / storage key | Pointer to private PDF bytes |
| `content_type` | `application/pdf` |
| `created_at` / `updated_at` | Audit |
| `expires_at` | Set to `now + 1 year` on each QR export |
| `download_count` | Default 0; increment on public GET |

**Unique constraint:** `(survey_id, record_uuid, entity_node_uuid)` — one stable share per entity instance.

### File bytes

Reuse existing private file storage (`FILE_STORAGE_*` / DB). Do **not** use a separate public Origami-style bucket for v1.

On re-export: overwrite bytes (or replace key and update pointer); keep the same `access_token`.

### Cleanup

- On record or survey delete: delete share rows and associated stored files.
- Expired tokens: public API returns 404 immediately; physical purge job is optional later.

---

## 9. arena-server changes

- Accept QR options on document generation (e.g. image buffer and/or URL string for first-page placement).
- **PDF (pdfkit):** draw QR image on the first page (header/corner; leave enough quiet zone for scanning).
- **DOCX:** embed QR image on the first section/page; if embedding proves costly, Arena hides the QR option for Word and only stamps PDF.
- Publish bumped `@openforis/arena-server`; Arena depends on that version.

QR image generation may live in Arena (Node library) before calling the generator, or inside arena-server—prefer one place and keep the other thin. Recommendation: generate PNG in Arena (or a small shared util) and pass the buffer to arena-server to avoid coupling arena-server to a QR library if DOCX/PDF only need an image.

---

## 10. Error handling

| Case | Behavior |
|------|----------|
| QR on without current entity instance | Client disables download / shows validation; server `400` if requested anyway |
| QR or storage failure during export | Fail the whole export (do not download a document that claims a broken QR) |
| Public GET unknown or expired | `404` |
| Storage unavailable on GET | `500` / `503` + log |
| DOCX QR too complex | Fallback: PDF-only QR option |

---

## 11. Testing

### Automated

- Upsert share on QR export; re-export keeps token, refreshes `expiresAt`, overwrites file
- Public GET: valid → PDF; expired / missing → 404
- Record/survey delete removes share + file
- Export with `includeQrCode` without current-page params → `400`

### Manual

- Export current page with QR → open URL in browser → same entity content
- Re-export → same URL, updated PDF, expiry pushed +1 year
- Phone camera scan smoke test
- DOCX path smoke test or explicit deferral note

---

## 12. Implementation order (suggested)

1. DB migration + share repository/service (upsert, get-by-token, cascade delete hooks)
2. Private file store/overwrite for export PDF bytes
3. Public `GET /api/public/record-export/:token`
4. Wire authenticated export: generate PDF, upsert share, pass QR into generators
5. arena-server: first-page QR image for PDF (then DOCX)
6. Modal: Include QR checkbox + force current page
7. Tests + i18n
8. Bump arena-server dependency in Arena

---

## 13. Open implementation details (non-blocking)

These do not change product intent; resolve during implementation:

- Exact table/column names to match Arena conventions
- Whether QR PNG is generated in Arena vs arena-server
- Exact first-page layout (size/margins) for reliable scanning
- Config key for public origin if `location.origin` is insufficient for server-side URL building
