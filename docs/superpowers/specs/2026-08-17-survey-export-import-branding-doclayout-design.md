# Export/Import Survey Branding & Doc-Layout Images — Design Spec

**Date:** 2026-08-17

---

## 1. Overview

Survey backup export/import (and survey cloning, which reuses the same job pair) currently loses binary content for two categories of survey-level files:

- **Branding images** — the 3 survey logo slots and the landing-page background image (`core/survey/surveyBranding.ts`).
- **Survey doc-layout images** — the header/footer images used when generating the printed survey/record PDF (`surveyDocImages`, `documentPlace` = `header`/`footer`).

Both are referenced by file UUID inside `survey.json` (`props.branding.*.fileUuid`, `props.surveyDocImages[].uuid`), so the JSON metadata already survives export/import correctly. What's missing is the underlying binary content: `SurveyFilesExportJob`/`SurveyFilesImportJob` today only handle `SurveyFileType.preloadedMapLayer`. After a backup restore or survey clone, the survey still references these images but the files are gone, silently breaking branding and printed document headers/footers.

---

## 2. Problem

| Symptom | Cause |
|---|---|
| Restored/cloned survey has no logos or landing background | `SurveyFilesExportJob`/`SurveyFilesImportJob` only export/import `preloadedMapLayer`-type files |
| Restored/cloned survey's printed document is missing header/footer images | Same gap — `surveyDocImage`-type files are never written to or read from the export zip |
| `survey.json` still references the missing files by UUID | Branding/doc-image metadata lives in survey props and is exported/imported correctly; only the binary `file` table rows are skipped |

---

## 3. Decisions

| Topic | Choice |
|---|---|
| Scope of file types added | `surveyDocImage`, `brandingSurveyLogo1`, `brandingSurveyLogo2`, `brandingSurveyLogo3`, `brandingLandingBackground` |
| Implementation strategy | Generalize the existing `SurveyFilesExportJob`/`SurveyFilesImportJob` pair (same read/write/quota/persist logic already used for `preloadedMapLayer`) rather than adding new job classes |
| Zip layout | Reuse the existing `surveyfiles/<fileUuid>.bin` path convention (`ExportFile.surveyFile`) — no new directories, since it's already type-agnostic and UUIDs are unique |
| Applies to survey cloning? | **Yes.** `SurveyFilesExportJob`/`SurveyFilesImportJob` are already shared, unconditionally, by both backup export/import and survey cloning — no new flag is introduced, so cloning also starts carrying over branding/doc-layout images |
| Backward compatibility with old zips | Reuse existing missing-content handling unchanged (`skipMissingFiles`: warn + skip; otherwise: throw) — same behavior already used for any other missing file today |
| Test coverage | Add integration test coverage for `SurveyFilesExportJob`/`SurveyFilesImportJob` (first coverage for this job pair) |

---

## 4. Architecture

### 4.1 Export (`SurveyFilesExportJob`)

Replace the single hardcoded `type: preloadedMapLayer` filter with a loop over all survey-level file types:

```js
const SURVEY_FILE_TYPES = [
  SurveyFile.SurveyFileType.preloadedMapLayer,
  SurveyFile.SurveyFileType.surveyDocImage,
  SurveyFile.SurveyFileType.brandingSurveyLogo1,
  SurveyFile.SurveyFileType.brandingSurveyLogo2,
  SurveyFile.SurveyFileType.brandingSurveyLogo3,
  SurveyFile.SurveyFileType.brandingLandingBackground,
]
```

For each type: `SurveyFileService.fetchFileSummariesByType({ surveyId, type })`, then write each file's content to `ExportFile.surveyFile({ fileUuid })` in the zip — identical to the current `preloadedMapLayer` handling, just looped across more types. `this.total`/progress reporting sums files across all types.

### 4.2 Import (`SurveyFilesImportJob`)

Today the list of files to restore comes from `Survey.getPreloadedMapLayers(surveyInfo)` — full `SurveyFile`-shaped entries (`uuid` + `props.type`/`name`/`size`) already embedded in the just-restored `survey.json`. This job is extended to gather two more sources and run all of them through the same existing per-file loop (fetch content from zip via `ArenaSurveyFileZip.getSurveyFile` → quota check → `persistFile`, with the existing missing-content warn/throw behavior unchanged):

- **`surveyDocImage`**: `Survey.getSurveyDocImages(surveyInfo)` already returns full `SurveyFile`-shaped objects (`uuid`, `props.type = surveyDocImage`, `name`, `labels`, `documentPlace`, `applyIf`) — this source slots into the existing loop with no adaptation needed.
- **Branding images**: `SurveyBranding.getBranding(surveyInfo)` only exposes minimal `{ fileUuid }` descriptors per slot (`surveyLogo1`, `surveyLogo2`, `surveyLogo3`, `landingBackground`), not full file objects. A new core helper, `SurveyBranding.getBrandingFileSummaries(branding)` (in `core/survey/surveyBranding.ts`), maps each populated slot to its corresponding `SurveyFileType` and returns `{ uuid, props: { type } }` entries.

  This explicit type mapping matters: `SurveyFile.getType` (`core/survey/surveyFile.js`) defaults to `SurveyFileType.recordAttachment` when `props.type` is missing, so a branding file persisted without its correct type would be invisible to the branding-specific cleanup logic in `surveyManager.js` (`deleteUnusedSurveyFiles`) and could be miscategorized.

All three lists (preloaded map layers, doc images, branding files) are concatenated into one array of file summaries and processed through the current per-file loop unchanged.

### 4.3 Data flow summary

```
Export:                                              Import:
survey DB file table                                 survey.json (already restored)
  │ fetchFileSummariesByType(type)                      │
  │  for type in SURVEY_FILE_TYPES                      ├─ getPreloadedMapLayers(surveyInfo)
  ▼                                                      ├─ getSurveyDocImages(surveyInfo)
zip: surveyfiles/<uuid>.bin                              └─ SurveyBranding.getBrandingFileSummaries(branding)
                                                               │ concat → one list
                                                               ▼
                                                          per file: read zip entry → persistFile()
```

---

## 5. Edge cases

| Case | Behavior |
|---|---|
| Export zip predates this change (no branding/doc-image entries) | Import falls back to existing missing-content handling: warn + skip when `skipMissingFiles` is set, throw otherwise — same as any other missing file today |
| Branding slot has no `fileUuid` (not set) | Excluded from `getBrandingFileSummaries` output — nothing to import for that slot |
| Survey clone (not a full backup) | Same job pair runs unconditionally, so branding/doc-layout images are now cloned too — consistent with how `preloadedMapLayer` already behaves in clone today |
| A branding/doc-image file was deleted from the DB after export but its UUID is still referenced in old `survey.json` metadata at export time | Not a new risk — same as the existing `preloadedMapLayer` behavior; export only ever writes files that exist in the `file` table at export time |

---

## 6. Out of scope

- Changes to branding/doc-image JSON metadata handling — this already works correctly today.
- New API endpoints — the generic `GET/POST /survey/:surveyId/file` endpoints are unaffected.
- `recordAttachment` files — already handled by the separate `RecordFilesExportJob`/`FilesImportJob` pair.
- User profile pictures — already handled by `UsersExportJob`.

---

## 7. Test plan

### Integration

1. Export a survey with all 4 branding slots populated (3 logos + landing background) and 2 `surveyDocImages` (one `header`, one `footer`), then import it into a new survey — assert every file's binary content matches byte-for-byte, and each restored file's `type` prop matches its original branding/doc-image type.
2. Import an older-format zip (or one missing a referenced file's `.bin` entry) with `skipMissingFiles: true` — assert import completes with a warning and without throwing.
3. Import the same zip without `skipMissingFiles` — assert it throws.
4. Survey clone path — clone a survey with branding/doc images set, assert the clone's files match the source survey's.

### Manual

1. Set up branding (logos + landing background) and doc-layout header/footer images on a survey; export as backup, restore into a new survey; confirm the UI shows the same branding and the printed record document shows the same header/footer.
2. Clone the same survey; confirm the clone also shows the branding and header/footer images.
