# Task 6 Report

Status: Complete

Commit: `03aa5131d` (`feat(record): include QR code on printable export when requested`)

## Summary

- Parsed `includeQrCode` and derived the server URL in both authenticated PDF and DOCX export handlers.
- Required current-page scope and entity identifiers for QR exports.
- Reused or precomputed a stable share token, generated the QR PNG, stamped and stored the hosted PDF, and returned either that PDF or a DOCX stamped with the same QR image.
- Preserved the existing single-generator path when QR export is not requested.
- Propagated QR generation, PDF generation, storage, and DOCX generation failures without sending a download.

## Verification

- `npx eslint --cache server/modules/record/api/recordApi.js server/modules/record/service/recordService.js` — passed.
- `git diff --check` — passed.
- `yarn build:server:dev` — blocked by baseline dependency installation/declaration issues: unresolved `@ngageoint/geopackage`, `qrcode`, and `http-status-codes`. The first two are declared but absent from the current install; `http-status-codes` is imported by the BASE public export API but is not declared.

## Concerns

- Full server compilation requires resolving the pre-existing dependency state described above.

## Important Finding Fix

- Added a bounded retry to QR exports when the share upsert returns a different, authoritative access token after a concurrent first export.
- Regenerates and re-stores the hosted PDF with the authoritative QR URL; PDF responses use those same bytes, and DOCX responses are generated with the same authoritative QR image.
- `npx eslint --cache server/modules/record/service/recordService.js` — passed.
- `git diff --check` — passed.
