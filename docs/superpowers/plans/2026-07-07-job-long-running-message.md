# Job Monitor "Taking Too Long" Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the caller of `JobActions.showJobMonitor(...)` optionally supply an i18n key for a "taking too long" message; show that message in the `JobMonitor` modal once the job has run for more than 1 minute without ending, and demonstrate it on the CSV/flat-data import job.

**Architecture:** Thread a new optional `longRunningMessageKey` string through the existing `webapp/store/app/job` Redux slice (mirroring the existing `errorKeyHeaderName` field exactly). A new presentational component, `JobLongRunningMessage`, starts a client-side 60-second `setTimeout` on mount and renders the translated message once it fires, as long as the job hasn't ended. Render it in `JobMonitor.js` below `JobTiming`. Wire the CSV/flat-data import view as the first caller.

**Tech Stack:** React (hooks), Redux (plain action creators + reducer, no Redux Toolkit in this slice), react-i18next, SCSS.

## Global Constraints

- New Redux field must default to `undefined` so existing callers of `showJobMonitor` are unaffected (spec: "No behavior change for existing callers that don't supply the new option").
- Use a client-side timer, not `job.elapsedMillis`, because server job-update pushes are throttled/sparse (spec section "2. `JobLongRunningMessage` component").
- Message stays visible once shown, for as long as the job is running; disappears once `JobSerialized.isEnded(job)` is true (spec section "2.").
- Example message text (English only — other locales are an explicit follow-up, not part of this plan): `This import is taking a while. Try splitting the file into smaller chunks.`
- This codebase has no React component test infra (no `@testing-library/react`, no `enzyme`/`react-test-renderer` in `package.json`) — existing components like `JobTiming`/`JobProgress` have no unit tests; only pure functions (e.g. `formatDuration`, `JobSerialized` selectors) are unit tested under `test/unit/tests/`. Follow that convention: no new component test is added; verification of `JobLongRunningMessage` is manual (Task 6).
- New component files use TypeScript (`.tsx`), per user preference — the codebase already mixes `.tsx` and `.js` components (see `webapp/components/buttons/ButtonDelete.tsx`), so this is consistent with existing conventions. Existing files being modified (not created) stay in their current language.

---

### Task 1: Thread `longRunningMessageKey` through the job Redux slice

**Files:**
- Modify: `webapp/store/app/job/state.js`
- Modify: `webapp/store/app/job/actions.js`
- Modify: `webapp/store/app/job/reducer.js`
- Modify: `webapp/store/app/job/hooks.js`

**Interfaces:**
- Consumes: nothing new (pure Redux plumbing).
- Produces: `useJob()` (from `webapp/store/app/job/hooks.js`, re-exported via `webapp/store/app/job/index.js` and `webapp/store/app`) now returns a `longRunningMessageKey: string | undefined` field alongside its existing fields. `JobActions.showJobMonitor({ ..., longRunningMessageKey })` (from `webapp/store/app/job/actions.js`, re-exported the same way) accepts the new optional param. Later tasks (2, 3, 5) consume `longRunningMessageKey` from `useJob()`.

This task is pure boilerplate threading with no independent behavior to unit test (consistent with the untested `errorKeyHeaderName` field it mirrors) — there's no test step; correctness is verified by Task 6's manual check and by the app still building/linting.

- [ ] **Step 1: Add the new key and selector to `state.js`**

Edit `webapp/store/app/job/state.js`. Add `longRunningMessageKey` to the `keys` object:

```js
export const keys = {
  closeButton: 'closeButton',
  closeButtonProps: 'closeButtonProps',
  autoHide: 'autoHide',
  onComplete: 'onComplete',
  errorKeyHeaderName: 'errorKeyHeaderName',
  errorsExportFileName: 'errorsExportFileName',
  longRunningMessageKey: 'longRunningMessageKey',
}
```

Add a selector right after `getErrorsExportFileName`:

```js
export const getLongRunningMessageKey = R.pipe(getJob, R.prop(keys.longRunningMessageKey))
```

Update `startJob` to accept and store the new param:

```js
export const startJob = ({
  job,
  onComplete = null,
  closeButton = null,
  closeButtonProps = null,
  autoHide = false,
  errorKeyHeaderName = undefined,
  errorsExportFileName = null,
  longRunningMessageKey = undefined,
}) => ({
  ...job,
  [keys.autoHide]: autoHide,
  [keys.closeButton]: closeButton,
  [keys.closeButtonProps]: closeButtonProps,
  [keys.onComplete]: onComplete,
  [keys.errorKeyHeaderName]: errorKeyHeaderName,
  [keys.errorsExportFileName]: errorsExportFileName,
  [keys.longRunningMessageKey]: longRunningMessageKey,
})
```

- [ ] **Step 2: Add the param to `showJobMonitor` in `actions.js`**

Edit `webapp/store/app/job/actions.js`:

```js
export const showJobMonitor =
  ({
    job,
    onComplete = null,
    autoHide = false,
    closeButton = null,
    closeButtonProps = null,
    errorKeyHeaderName = undefined,
    errorsExportFileName = undefined,
    longRunningMessageKey = undefined,
  }) =>
  (dispatch) =>
    dispatch({
      type: JOB_START,
      job,
      onComplete,
      autoHide,
      closeButton,
      closeButtonProps,
      errorKeyHeaderName,
      errorsExportFileName,
      longRunningMessageKey,
    })
```

(The rest of `actions.js` — `updateJob`, `hideJobMonitor`, `cancelJob` — is unchanged.)

- [ ] **Step 3: Pass the param through the `JOB_START` handler in `reducer.js`**

Edit `webapp/store/app/job/reducer.js`:

```js
const actionHandlers = {
  [JobActions.JOB_START]: (
    _state,
    {
      job,
      onComplete,
      autoHide,
      closeButton,
      closeButtonProps,
      errorKeyHeaderName,
      errorsExportFileName,
      longRunningMessageKey,
    }
  ) =>
    JobState.startJob({
      job,
      onComplete,
      autoHide,
      closeButton,
      closeButtonProps,
      errorKeyHeaderName,
      errorsExportFileName,
      longRunningMessageKey,
    }),

  [JobActions.JOB_UPDATE]: (state, { job }) => JobState.updateJob({ job })(state),
}
```

- [ ] **Step 4: Return the new field from `useJob()` in `hooks.js`**

Edit `webapp/store/app/job/hooks.js`:

```js
import { useSelector } from 'react-redux'

import * as JobState from './state'

export const useJob = () => {
  const hasJob = useSelector(JobState.hasJob)
  const job = useSelector(JobState.getJob)
  const closeButton = useSelector(JobState.getCloseButton)
  const closeButtonProps = useSelector(JobState.getCloseButtonProps)
  const errorKeyHeaderName = useSelector(JobState.getErrorKeyHeaderName)
  const errorsExportFileName = useSelector(JobState.getErrorsExportFileName)
  const longRunningMessageKey = useSelector(JobState.getLongRunningMessageKey)

  if (!hasJob) return {}

  return {
    job,
    closeButton,
    closeButtonProps,
    errorKeyHeaderName,
    errorsExportFileName,
    longRunningMessageKey,
  }
}
```

- [ ] **Step 5: Lint the changed files**

Run: `npx eslint --cache --fix webapp/store/app/job/state.js webapp/store/app/job/actions.js webapp/store/app/job/reducer.js webapp/store/app/job/hooks.js`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add webapp/store/app/job/state.js webapp/store/app/job/actions.js webapp/store/app/job/reducer.js webapp/store/app/job/hooks.js
git commit -m "Thread longRunningMessageKey through job monitor redux slice"
```

---

### Task 2: `JobLongRunningMessage` component

**Files:**
- Create: `webapp/views/App/JobMonitor/JobLongRunningMessage.tsx`

**Interfaces:**
- Consumes: `JobSerialized.isEnded(job)` from `@common/job/jobSerialized` (existing export, confirmed at `common/job/jobSerialized.js:113`); `useI18n()` from `@webapp/store/system` (existing export, used the same way in `webapp/views/App/JobMonitor/JobTiming/JobTiming.js`).
- Produces: default export `JobLongRunningMessage` React component with typed props `{ job: Record<string, any>, messageKey?: string }`. Renders `null` unless the 60s timer has fired and `!JobSerialized.isEnded(job)`. Consumed by Task 3 (`JobMonitor.js`).

- [ ] **Step 1: Create the component**

Create `webapp/views/App/JobMonitor/JobLongRunningMessage.tsx`:

```tsx
import { useEffect, useState } from 'react'

import * as JobSerialized from '@common/job/jobSerialized'
import { useI18n } from '@webapp/store/system'

const showMessageDelayMillis = 60 * 1000 // 1 minute

type Props = {
  job: Record<string, any>
  messageKey?: string
}

/**
 * Displays a caller-specified message once a job has been running for
 * more than 1 minute without ending. Renders nothing if no messageKey
 * is provided, before the delay has elapsed, or once the job has ended.
 */
const JobLongRunningMessage = ({ job, messageKey = undefined }: Props) => {
  const i18n = useI18n()
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    if (!messageKey || JobSerialized.isEnded(job)) return undefined

    const timeoutId = setTimeout(() => setShowMessage(true), showMessageDelayMillis)
    return () => clearTimeout(timeoutId)
    // Timer is started once, when the job monitor for this job is first mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!showMessage || JobSerialized.isEnded(job)) return null

  return <div className="job-long-running-message">{i18n.t(messageKey)}</div>
}

export default JobLongRunningMessage
```

- [ ] **Step 2: Lint the new file**

Run: `npx eslint --cache --fix webapp/views/App/JobMonitor/JobLongRunningMessage.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/JobMonitor/JobLongRunningMessage.tsx
git commit -m "Add JobLongRunningMessage component"
```

---

### Task 3: Render `JobLongRunningMessage` in `JobMonitor.js`

**Files:**
- Modify: `webapp/views/App/JobMonitor/JobMonitor.js`

**Interfaces:**
- Consumes: `longRunningMessageKey` from `useJob()` (produced by Task 1); `JobLongRunningMessage` default export with props `{ job, messageKey }` (produced by Task 2).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Import the component and destructure the new field**

In `webapp/views/App/JobMonitor/JobMonitor.js`, update the imports (after the existing `InnerJobs`/`JobErrors`/`JobProgress`/`JobTiming` imports):

```js
import InnerJobs from './InnerJobs'
import JobErrors from './JobErrors'
import JobLongRunningMessage from './JobLongRunningMessage'
import JobProgress from './JobProgress'
import JobTiming from './JobTiming'
```

Update the `useJob()` destructure:

```js
const { job, closeButton, closeButtonProps, errorKeyHeaderName, errorsExportFileName, longRunningMessageKey } =
  useJob()
```

- [ ] **Step 2: Render it below `JobTiming`**

Change:

```js
        <JobProgress job={job} />
        <JobTiming job={job} />
        <JobErrors
```

to:

```js
        <JobProgress job={job} />
        <JobTiming job={job} />
        <JobLongRunningMessage job={job} messageKey={longRunningMessageKey} />
        <JobErrors
```

- [ ] **Step 3: Lint the file**

Run: `npx eslint --cache --fix webapp/views/App/JobMonitor/JobMonitor.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/views/App/JobMonitor/JobMonitor.js
git commit -m "Render JobLongRunningMessage in JobMonitor"
```

---

### Task 4: Style the message

**Files:**
- Modify: `webapp/views/App/JobMonitor/JobMonitor.scss`

**Interfaces:**
- Consumes: `$orange` SCSS variable (existing, defined in `webapp/style/_vars.scss`, confirmed present via `cssVars.scss` re-export `--orange: #{$orange}`).
- Produces: `.job-long-running-message` CSS class consumed by the `className` set in Task 2's `JobLongRunningMessage.tsx`.

- [ ] **Step 1: Add the style rule**

In `webapp/views/App/JobMonitor/JobMonitor.scss`, inside the `.app-job-monitor { .modal-body { ... } }` block, add a sibling rule to `.job-timing`:

```scss
.app-job-monitor {
  .modal-body {
    padding-top: 0;
  }

  .job-timing {
    font-size: 0.8rem;
    color: rgba($black, 0.55);
  }

  .job-long-running-message {
    font-size: 0.8rem;
    color: $orange;
    margin-top: 0.25rem;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add webapp/views/App/JobMonitor/JobMonitor.scss
git commit -m "Style the job monitor long-running message"
```

---

### Task 5: Wire up the CSV/flat-data import example

**Files:**
- Modify: `webapp/views/App/views/Data/DataImport/DataImportFlatDataView.js` (around line 176-191)
- Modify: `core/i18n/resources/en/dataImportView.js` (around line 61-68)

**Interfaces:**
- Consumes: `JobActions.showJobMonitor({ ..., longRunningMessageKey })` (produced by Task 1).
- Produces: nothing new consumed elsewhere — this is the end-to-end demonstration.

- [ ] **Step 1: Add the translation string**

In `core/i18n/resources/en/dataImportView.js`, inside the `jobs.DataImportJob` object (currently ending with `updatedValues` line and the `importCompleteSummary`/`importCompleteSuccessfully`/`importWithFilesCompleteSuccessfully` keys), add a new `tooLong` key:

```js
    DataImportJob: {
      importCompleteSummary: `
        - {{processed}} rows processed
        - {{insertedRecords}} records created
        - {{updatedRecords}} records updated
        - {{entitiesCreated}} entities created
        - {{entitiesDeleted}} entities deleted
        - {{updatedValues}} values updated`,
      importCompleteSuccessfully: `## Import complete:
$t(dataImportView:jobs.DataImportJob.importCompleteSummary)`,
      importWithFilesCompleteSuccessfully: `$t(dataImportView:jobs.DataImportJob.importCompleteSuccessfully)
        - {{insertedFiles}} files inserted
        - {{updatedFiles}} files updated
        - {{deletedFiles}} files deleted`,
      tooLong: 'This import is taking a while. Try splitting the file into smaller chunks.',
    },
```

(Only add the `tooLong` line — leave the existing keys in that object untouched. Other locale files, e.g. `core/i18n/resources/fr/dataImportView.js`, are intentionally left untouched per the spec's non-goals.)

- [ ] **Step 2: Pass `longRunningMessageKey` from `onImportJobStart`**

In `webapp/views/App/views/Data/DataImport/DataImportFlatDataView.js`, change:

```js
  const onImportJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          errorKeyHeaderName: 'dataImportView:errors.rowNum',
          errorsExportFileName,
          onComplete: (jobCompleted) => {
            setState((statePrev) => ({ ...statePrev, jobCompleted }))
          },
        })
      )
    },
    [dispatch, setState, errorsExportFileName]
  )
```

to:

```js
  const onImportJobStart = useCallback(
    (job) => {
      dispatch(
        JobActions.showJobMonitor({
          job,
          autoHide: true,
          errorKeyHeaderName: 'dataImportView:errors.rowNum',
          errorsExportFileName,
          longRunningMessageKey: 'dataImportView:jobs.DataImportJob.tooLong',
          onComplete: (jobCompleted) => {
            setState((statePrev) => ({ ...statePrev, jobCompleted }))
          },
        })
      )
    },
    [dispatch, setState, errorsExportFileName]
  )
```

- [ ] **Step 3: Lint the changed files**

Run: `npx eslint --cache --fix webapp/views/App/views/Data/DataImport/DataImportFlatDataView.js core/i18n/resources/en/dataImportView.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add webapp/views/App/views/Data/DataImport/DataImportFlatDataView.js core/i18n/resources/en/dataImportView.js
git commit -m "Show taking-too-long message on CSV/flat-data import job"
```

---

### Task 6: Manual verification

**Files:** none (no code changes — this task only verifies Tasks 1-5 work together in the running app).

**Interfaces:**
- Consumes: the fully wired feature from Tasks 1-5.
- Produces: nothing (verification only).

Because this codebase has no React component test infra (see Global Constraints), the `JobLongRunningMessage` behavior is verified by running the app and temporarily shortening the delay — the 60s constant itself is not permanently changed by this task.

- [ ] **Step 1: Start the dev server**

Run: `yarn watch`
Expected: webpack dev server on port 9000, backend on port 9090, no compile errors.

- [ ] **Step 2: Temporarily lower the delay for a fast manual check**

Locally edit `webapp/views/App/JobMonitor/JobLongRunningMessage.tsx`, changing:

```js
const showMessageDelayMillis = 60 * 1000 // 1 minute
```

to:

```js
const showMessageDelayMillis = 3 * 1000 // 3 seconds, for manual verification only
```

(Do not commit this change — it's only to make manual verification fast. Revert it in Step 5.)

- [ ] **Step 3: Trigger a CSV/flat-data import**

In the browser, go to the Data view, start a flat-data (CSV/Excel) import for any survey with at least one file, and keep the job monitor modal open for more than 3 seconds while the job is still running (pending/running state).

Expected: after ~3 seconds, an orange-colored line reading "This import is taking a while. Try splitting the file into smaller chunks." appears below the elapsed/remaining time line, and remains visible until the job finishes, at which point it disappears (replaced by the completion/error UI).

- [ ] **Step 4: Confirm no regression for jobs without the new option**

Trigger any other job that does not pass `longRunningMessageKey` (e.g. a Collect data import, or a category import) and confirm no long-running message ever appears, and the modal behaves exactly as before.

- [ ] **Step 5: Revert the temporary delay change**

```bash
git checkout -- webapp/views/App/JobMonitor/JobLongRunningMessage.tsx
```

Run: `git status`
Expected: `webapp/views/App/JobMonitor/JobLongRunningMessage.tsx` shows no diff (clean), all other files from Tasks 1-5 remain committed.
