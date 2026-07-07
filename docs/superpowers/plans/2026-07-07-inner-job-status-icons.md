# Inner Job Status Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a per-row status icon (checked box / spinner / cross / unchecked box) for each inner job in the Job Monitor's sequential inner-jobs list, so the whole sequence's progress can be scanned at a glance.

**Architecture:** A pure function in `common/job/jobSerialized.js` maps an inner job's serialized status (plus whether it's the currently running one) to a CSS icon class. The `InnerJob` React component calls this function and renders the icon before the job name. New CSS in `JobMonitor.scss` colors the icons and animates the spinner. No data-layer or API changes — the job objects already carry `succeeded`/`failed`/`pending` flags.

**Tech Stack:** React, Ramda, Jest (bundled unit tests via webpack), SCSS.

## Global Constraints

- Follow existing JSDoc conventions for exported functions (description ending in a period, `@param`/`@returns` with types) — per project CLAUDE.md.
- No `console.log` — not applicable here (no logging needed).
- Icon classes must reuse existing icon font glyphs already defined in `webapp/style/ico.scss` (`icon-checkbox-checked`, `icon-checkbox-unchecked`, `icon-cross`, `icon-spinner`) — no new icon assets.
- Reuse existing SCSS color variables `$green` and `$red` from `webapp/style/_vars.scss` (already imported into `JobMonitor.scss` via `@use '~@webapp/style/vars' as *;`).
- This repo has no React component test harness (no testing-library/enzyme) — component-level verification is manual, per the approved spec's Testing section. Only the pure logic function gets automated unit tests.

---

### Task 1: Add `getInnerJobStatusIconClass` to `jobSerialized.js`

**Files:**
- Modify: `common/job/jobSerialized.js` (add function after `isCanceled`, currently the last export in the file)
- Test: `test/unit/tests/027jobSerialized.test.js` (append a new `describe` block at the end of the file)

**Interfaces:**
- Produces: `JobSerialized.getInnerJobStatusIconClass(innerJob: object, isCurrentJob: boolean = false): string` — returns one of `'icon-checkbox-checked'`, `'icon-cross'`, `'icon-spinner'`, `'icon-checkbox-unchecked'`. Consumed by Task 2.

- [ ] **Step 1: Write the failing tests**

Append to the end of `test/unit/tests/027jobSerialized.test.js`:

```js
describe('JobSerialized.getInnerJobStatusIconClass', () => {
  test('returns checked icon when inner job succeeded', () => {
    const innerJob = { succeeded: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-checkbox-checked')
  })

  test('returns cross icon when inner job failed', () => {
    const innerJob = { failed: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-cross')
  })

  test('returns spinner icon when inner job is the current running job', () => {
    const innerJob = { pending: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-spinner')
  })

  test('returns unchecked icon when inner job has not started yet', () => {
    const innerJob = { pending: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, false)).toBe('icon-checkbox-unchecked')
  })

  test('prioritizes succeeded status even if job object is still flagged as current', () => {
    const innerJob = { succeeded: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-checkbox-checked')
  })

  test('prioritizes failed status even if job object is still flagged as current', () => {
    const innerJob = { failed: true }
    expect(JobSerialized.getInnerJobStatusIconClass(innerJob, true)).toBe('icon-cross')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:
```bash
yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "getInnerJobStatusIconClass"
```
Expected: FAIL — `JobSerialized.getInnerJobStatusIconClass is not a function`.

- [ ] **Step 3: Implement the function**

In `common/job/jobSerialized.js`, add after the existing `export const isCanceled = _isPropTrue(keys.canceled)` line:

```js

/**
 * Determines the CSS icon class representing an inner job's status, for at-a-glance
 * progress display in a sequential inner-jobs list.
 * @param {object} innerJob - Serialized inner job object.
 * @param {boolean} [isCurrentJob=false] - Whether this inner job is the one currently running.
 * @returns {string} Icon class name, one of "icon-checkbox-checked", "icon-cross",
 *   "icon-spinner" or "icon-checkbox-unchecked".
 */
export const getInnerJobStatusIconClass = (innerJob, isCurrentJob = false) => {
  if (isSucceeded(innerJob)) return 'icon-checkbox-checked'
  if (isFailed(innerJob)) return 'icon-cross'
  if (isCurrentJob) return 'icon-spinner'
  return 'icon-checkbox-unchecked'
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:
```bash
yarn build:test:unit && npx jest dist/__tests__/bundle.unit.js -t "getInnerJobStatusIconClass"
```
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add common/job/jobSerialized.js test/unit/tests/027jobSerialized.test.js
git commit -m "Add JobSerialized.getInnerJobStatusIconClass for inner-job status icons"
```

---

### Task 2: Render the status icon in `InnerJob.js`

**Files:**
- Modify: `webapp/views/App/JobMonitor/InnerJobs/InnerJob/InnerJob.js`

**Interfaces:**
- Consumes: `JobSerialized.getInnerJobStatusIconClass(innerJob, isCurrentJob)` from Task 1.
- Produces: a `<span class="icon status-icon <iconClass>">` element inside `.job .name`, which Task 3's CSS targets via `.app-job-monitor__inner-jobs .job .name .status-icon`.

- [ ] **Step 1: Update the component**

Replace the full contents of `webapp/views/App/JobMonitor/InnerJobs/InnerJob/InnerJob.js` with:

```js
import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'

import JobProgress from '../../JobProgress'
import JobErrors from '../../JobErrors'
import JobTiming from '../../JobTiming'

const InnerJob = ({ isCurrentJob = false, innerJob, index }) => {
  const i18n = useI18n()
  const elementRef = useRef(null)

  const isRunning = JobSerialized.isRunning(innerJob)
  const statusIconClass = JobSerialized.getInnerJobStatusIconClass(innerJob, isCurrentJob)

  useEffect(() => {
    if (isRunning && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isRunning])

  return (
    <>
      <div className="job" ref={elementRef}>
        <div className="name">
          <span className={`icon status-icon ${statusIconClass}`} />
          {index + 1}. {i18n.t(`jobs:${JobSerialized.getType(innerJob)}`)}
        </div>
        {(isCurrentJob || JobSerialized.isEnded(innerJob)) && (
          <JobProgress isCurrentJob={isCurrentJob} job={innerJob} />
        )}
        <JobTiming job={innerJob} />
      </div>
      <JobErrors job={innerJob} />
    </>
  )
}

InnerJob.propTypes = {
  isCurrentJob: PropTypes.bool,
  innerJob: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

export default InnerJob
```

The only changes from the current file: the `statusIconClass` line and the new `<span>` inside `.name`.

- [ ] **Step 2: Lint the file**

Run:
```bash
npx eslint --cache --fix webapp/views/App/JobMonitor/InnerJobs/InnerJob/InnerJob.js
```
Expected: no errors reported.

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/JobMonitor/InnerJobs/InnerJob/InnerJob.js
git commit -m "Render inner-job status icon in InnerJob component"
```

---

### Task 3: Style the status icon and spinner animation

**Files:**
- Modify: `webapp/views/App/JobMonitor/JobMonitor.scss`

**Interfaces:**
- Consumes: the `.status-icon` element with one of the classes `icon-checkbox-checked` / `icon-cross` / `icon-spinner` / `icon-checkbox-unchecked`, rendered by Task 2, nested inside `.app-job-monitor__inner-jobs .job .name`.

- [ ] **Step 1: Add the styles**

In `webapp/views/App/JobMonitor/JobMonitor.scss`, find this block (inside `.app-job-monitor__inner-jobs .expansion-panel__content`):

```scss
    .job {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .name {
        font-size: 0.9rem;
      }

      .job-timing {
        grid-column: 2;
      }
    }
```

Replace it with:

```scss
    .job {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .name {
        font-size: 0.9rem;

        .status-icon {
          display: inline-block;
          width: 1rem;
          margin-right: 0.3rem;
          text-align: center;

          &.icon-checkbox-checked {
            color: $green;
          }

          &.icon-cross {
            color: $red;
          }

          &.icon-spinner {
            animation: app-job-monitor-inner-job-spinner-spin 1s linear infinite;
          }
        }
      }

      .job-timing {
        grid-column: 2;
      }
    }
```

Then add this `@keyframes` rule at the top level of the file (outside any selector — e.g. right after the `@use` line at the top):

```scss
@keyframes app-job-monitor-inner-job-spinner-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 2: Verify the client build compiles**

Run:
```bash
yarn build-dev
```
Expected: build succeeds with no SCSS/webpack errors.

- [ ] **Step 3: Commit**

```bash
git add webapp/views/App/JobMonitor/JobMonitor.scss
git commit -m "Style inner-job status icons and spinner animation"
```

---

### Task 4: Manual end-to-end verification

**Files:** none (verification only, no code changes expected)

**Interfaces:** none — this task exercises Tasks 1–3 together in the running app.

- [ ] **Step 1: Start the app**

Run:
```bash
yarn watch
```
Wait for both the webpack dev server (port 9000) and the backend (port 9090) to finish starting.

- [ ] **Step 2: Trigger a job with multiple inner jobs**

Log in, open any existing survey in the Designer, and click "Publish" (survey publish runs `surveyPublishJob`, which executes several inner jobs sequentially: validation, RDB creation, etc.). Open the Job Monitor's "Details" panel while it runs.

- [ ] **Step 3: Observe the status icons**

Confirm:
- Inner jobs that have already finished show a green checked-box icon.
- The currently running inner job shows a spinning icon.
- Inner jobs not yet started show an empty (unchecked) checkbox icon.
- The row auto-scrolls to keep the running job visible, as before (unchanged behavior).

- [ ] **Step 4: Observe a failure case**

Trigger a job that will fail partway through one of its inner jobs (e.g. publish a survey with a known validation error, or cancel and re-trigger with invalid data if available). Confirm the failed inner job shows a red cross icon instead of a checked box, and jobs after it remain in the unchecked state.

- [ ] **Step 5: Report results**

No commit needed for this task — it's a verification pass. If any visual issue is found (e.g. icon alignment, wrong color), fix it in the relevant file from Task 2 or 3 and commit that fix separately with a message describing the fix.
