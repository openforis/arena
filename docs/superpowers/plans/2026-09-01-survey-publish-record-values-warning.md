# Warn Before Publish Updates Recorded Values

**Goal:** During survey publish, if a change to a published node def's
`applicable`/`defaultValues`/`fileNameExpression` would *actually* alter a
value already stored in existing records, cancel the publish and tell the
user which attributes are affected. Only on an explicit strong confirmation
should the publish re-run with a flag that lets those changes through.

**Architecture:** `SurveyPublishJob` already runs `RecordCheckJob` against
every record before committing (`SurveyPropsPublishJob`), recomputing
default values/applicability for node defs whose draft state changed since
last publish (`nodeDefUpdatedUuids`). Presence in that bucket alone doesn't
prove a value will change — recalculation can land on the same value — so
this plan adds tracking around the recompute `RecordCheckJob` already does
(no duplicate/second recompute pass), diffing each affected node's value
before/after. If any real diffs are found and the client hasn't confirmed,
the job fails (`this.errors` + `setStatusFailed()`, same pattern
`NodeDefsValidationJob` already uses), rolling back the whole transaction —
nothing is persisted. The frontend detects this specific failure (failed
inner job `type === 'RecordCheckJob'`) and shows a strong-confirm dialog
(type-the-survey-name, reusing the existing `strongConfirm` mechanism)
before retrying with `updateRecordValues: true`.

**Tech Stack:** Express API, `@openforis/arena-core` `Job`/`JobBase`
(composite jobs sharing one DB transaction and one mutable `context`
object), Ramda, React/Redux, i18next.

## Global Constraints

- `RecordCheckJob` is also reused by Collect import jobs
  (`collectImportJob.js`/`collectDataImportJob.js`). The new tracking/fail
  behavior must be gated behind a context flag (`recordValuesUpdateCheckEnabled`)
  that only `SurveyPublishJob` ever sets (hardcoded in its own constructor
  params), so Collect import call sites are provably unaffected.
- Composite jobs (`JobBase.executeJobs()`) merge each inner job's own
  constructor params up into one shared `context` object before running it,
  then hand every subsequent sibling the same shared reference — this is how
  `cleanupRecords` already reaches `RecordCheckJob` today with zero explicit
  wiring; the new `updateRecordValues` and `recordValuesUpdateCheckEnabled`
  flags follow the exact same path.
- `job.result` is stripped from the serialized job whenever the job is not
  succeeded (`JobBase.toJSON()`), so failure details must go through
  `this.errors`, never `this.result`.
- Deleting a node def (separate, already-handled case) and type/cardinality
  changes on published node defs (already blocked in the Designer UI) are
  out of scope for this feature.

## Tasks

- [ ] **`server/modules/survey/service/recordCheckJob.js`** — in
  `_checkRecord`, around the existing `_applyDefaultValuesAndApplicability`
  call (step 4): snapshot each pre-existing node's value (`Node.getValue`)
  before the call, for nodes whose node def is in `nodeDefUpdatedUuids` and
  which are not freshly inserted this pass; after the call, diff the
  returned updated nodes' values against the snapshot with `R.equals`;
  accumulate real changes into a job-level `Map<nodeDefUuid, recordsAffectedCount>`.
  At the end of `execute()`, if `this.context.recordValuesUpdateCheckEnabled
  && !this.context.updateRecordValues` and the map is non-empty, populate
  `this.errors` (one entry per affected node def, keyed by label, with a
  `{ key: 'jobs:recordCheckJob.recordValuesWillBeUpdated', params: { recordsAffectedCount } }`
  value) and call `await this.setStatusFailed()` as the last statement,
  mirroring `NodeDefsValidationJob`'s existing pattern.
- [ ] **`server/modules/survey/service/publish/surveyPublishJob.js`** — set
  `recordValuesUpdateCheckEnabled: true` unconditionally in the composite
  job's own constructor params (`super(SurveyPublishJob.type, { ...params,
  recordValuesUpdateCheckEnabled: true }, [...])`).
- [ ] **`server/modules/survey/service/surveyService.js`** —
  `startPublishJob` accepts and forwards a new `updateRecordValues` param to
  `new SurveyPublishJob(...)`.
- [ ] **`server/modules/survey/api/surveyApi.js`** — `PUT
  /survey/:surveyId/publish` reads `updateRecordValues` from the request
  body (default `false`) alongside the existing `cleanupRecords`.
- [ ] **`webapp/store/app/job/state.js`, `actions.js`, `reducer.js`** — add
  an `onFail` callback slot, symmetric to the existing `onComplete`, invoked
  from the `updateJob` thunk when `JobSerialized.isFailed(job)`.
- [ ] **`webapp/store/survey/actions/publish.js`** — `publishSurvey({
  cleanupRecords, updateRecordValues })` sends `updateRecordValues` in the
  PUT body; pass an `onFail` handler to `showJobMonitor` that: finds the
  failed inner job, ignores it unless `type === 'RecordCheckJob'`, otherwise
  hides the job monitor and dispatches `DialogConfirmActions.showDialogConfirm`
  with `strongConfirm: true` / `strongConfirmRequiredText: surveyLabel`
  listing the affected attribute names (from `job.errors` keys), with `onOk`
  re-dispatching `publishSurvey({ cleanupRecords, updateRecordValues: true })`.
  (`webapp/components/buttonPublishSurvey.js` needs no changes.)
- [ ] **`core/i18n/resources/en/common.js`** — add
  `publishRecordValuesUpdateConfirmHeader`,
  `publishRecordValuesUpdateConfirm` (interpolating `{{survey}}` and the
  attribute name list), `publishRecordValuesUpdateConfirmInputLabel`, near
  the existing `publishConfirm` key.
- [ ] **`core/i18n/resources/en/jobs.js`** — add
  `recordCheckJob.recordValuesWillBeUpdated` message key used in the
  per-attribute `JobErrors` entries.
- [ ] Other locale files under `core/i18n/resources/<lang>/` — add the same
  keys per repo convention (or leave to fall back to English, per existing
  i18n fallback behavior — confirm which the repo expects before merging).

## Verification

- Change an already-published attribute's `defaultValues`/`applicable`/
  `fileNameExpression` expression so recalculation genuinely produces a
  different value for at least one record's existing value, then `PUT
  .../survey/:id/publish` without `updateRecordValues` — expect the job to
  fail with `RecordCheckJob` as the failed inner job and `errors` naming
  that attribute; verify the record's value is unchanged afterward
  (transaction rolled back). Re-call with `updateRecordValues: true` —
  expect success and the value to update.
- Negative case: an expression change that recalculates to the *same* value
  already stored — expect success with no warning (proves the check is
  based on actual diffs, not mere presence in `nodeDefUpdatedUuids`).
- Confirm `RecordCheckJob` invoked from Collect import jobs is unaffected
  (flag absent → no tracking, no new failure path).
- Manually in the Designer: edit a default-value expression on a published,
  already-answered attribute so it recalculates differently, click Publish,
  confirm the existing generic dialog, verify the new strong-confirm dialog
  lists that attribute; cancel and verify nothing published; redo and
  confirm by typing the survey name, verify publish completes and the
  record's value updates.
