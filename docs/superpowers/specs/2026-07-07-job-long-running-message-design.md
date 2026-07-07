# Job Monitor: "Taking Too Long" Message

Date: 2026-07-07

## Problem

Some background jobs (e.g. CSV/flat-data import) can run for a long time with
little visible progress. Users have no indication of what to do when this
happens. We want the `JobMonitor` to show a customizable message once a job
has been running for more than 1 minute without ending, with the message
content chosen by the code that dispatched the job.

## Goals

- Let the caller of `JobActions.showJobMonitor(...)` optionally supply an
  i18n key for a "taking too long" message, specific to that job.
- Show that message in the job monitor modal once the job has been running
  for more than 1 minute and hasn't ended yet.
- No behavior change for existing callers that don't supply the new option.
- Demonstrate the feature on the CSV/flat-data import job
  (`DataImportFlatDataView.js`) with the message:
  > The data import is taking too long; try to split the imported file into
  > smaller chunks and try it again.

## Non-goals

- Translating the new message into locales other than English (`fr`, `es`,
  `pt`, `ru`, `mn` are left as a follow-up).
- Wiring the message into any job besides the CSV/flat-data import job.
- Canceling or otherwise acting on the job when the message appears — it is
  informational only.

## Design

### 1. Threading `longRunningMessageKey` through the job store

Follows the exact existing pattern used for `errorKeyHeaderName`, an
optional i18n key string passed from the call site through to the
component that renders it.

- **`webapp/store/app/job/actions.js`**: `showJobMonitor({ ..., longRunningMessageKey = undefined })`
  includes `longRunningMessageKey` in the `JOB_START` action payload.
- **`webapp/store/app/job/state.js`**: add `keys.longRunningMessageKey`, a
  `getLongRunningMessageKey` selector (`R.prop(keys.longRunningMessageKey)`),
  and add the param to `startJob(...)`.
- **`webapp/store/app/job/reducer.js`**: destructure and pass
  `longRunningMessageKey` through in the `JOB_START` handler.
- **`webapp/store/app/job/hooks.js`**: `useJob()` reads the selector and
  includes `longRunningMessageKey` in its returned object.

If a caller doesn't pass `longRunningMessageKey`, it stays `undefined` and
no message is ever shown — identical to today's behavior.

### 2. `JobLongRunningMessage` component

New file: `webapp/views/App/JobMonitor/JobLongRunningMessage.js`.

Props: `job` (serialized job), `messageKey` (string | undefined).

Behavior:
- If `messageKey` is falsy, renders nothing (no timer started).
- If `messageKey` is set and the job is not already ended
  (`!JobSerialized.isEnded(job)`) on mount, starts a
  `setTimeout(() => setShowMessage(true), 60_000)`. The timeout is cleared
  on unmount.
- A **client-side timer** is used rather than reacting to
  `JobSerialized.getElapsedMillis(job)`, because job updates are pushed from
  the server over WebSocket and throttled (only sent on progress changes,
  at most every 500ms) — a job that's stuck with no progress updates may
  never push a fresh `elapsedMillis`, so relying on it could mean the
  message never appears. A local timer fires reliably at the 60s mark
  regardless of server push cadence.
- Renders the translated message (`i18n.t(messageKey)`) only when
  `showMessage` is true **and** the job has not ended
  (`!JobSerialized.isEnded(job)`). This means: the message appears at the
  1-minute mark and stays visible for as long as the job keeps running,
  even if progress speeds up afterward (it does not hide itself early) —
  and naturally disappears once the job ends, since by then the modal is
  showing final status/errors instead.
- Styling: a plain text block similar to the existing `.job-timing` element
  (same font-size), colored with the existing `$orange` SCSS variable to
  give it a little visual distinction as a caution, without introducing a
  boxed alert/notification component.

### 3. Rendering in `JobMonitor.js`

`JobMonitor.js` calls `useJob()` and already destructures several optional
fields (`closeButton`, `errorKeyHeaderName`, etc.) the same way
`longRunningMessageKey` will be destructured. Render
`<JobLongRunningMessage job={job} messageKey={longRunningMessageKey} />`
directly below the existing `<JobTiming job={job} />` in the `ModalBody`.

### 4. Wiring up the CSV/flat-data import example

In `webapp/views/App/views/Data/DataImport/DataImportFlatDataView.js`, the
existing `onImportJobStart` callback's `showJobMonitor(...)` call gains:

```js
longRunningMessageKey: 'dataImportView:jobs.DataImportJob.tooLong',
```

alongside the existing `errorKeyHeaderName` and `errorsExportFileName`
options.

In `core/i18n/resources/en/dataImportView.js`, add under the existing
`jobs.DataImportJob` object:

```js
tooLong: 'The data import is taking too long; try to split the imported file into smaller chunks and try it again.',
```

Other locale files (`fr`, `es`, `pt`, `ru`, `mn`) are left untouched for
now; i18next will fall back to the key (or English, depending on fallback
config) until translated — this is called out as a known follow-up.

## Testing

- Unit test for the new `JobLongRunningMessage` component (or its logic if
  extracted), using fake timers to verify: no render before 60s, renders
  translated message after 60s while job is running, does not render if
  `messageKey` is unset, stops rendering once `JobSerialized.isEnded(job)`
  is true.
- Manual verification: trigger a CSV import that runs long enough (or
  temporarily lower the threshold locally) and confirm the message appears
  in the modal below the timing line and disappears when the job ends.

## Open questions / follow-ups (out of scope for this change)

- Translate the new message key into `fr`, `es`, `pt`, `ru`, `mn`.
- Consider wiring `longRunningMessageKey` into other long-running jobs
  (e.g. survey export, data export) as follow-up work.
