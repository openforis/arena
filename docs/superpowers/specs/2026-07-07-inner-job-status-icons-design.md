# Inner Job Status Icons — Design

## Problem

A job that executes inner jobs sequentially (`webapp/views/App/JobMonitor/InnerJobs`) currently shows each inner job's name, a progress bar (only for the currently running or already-ended job), and elapsed time. There is no quick, at-a-glance way to tell which inner jobs in the list are done, which one is running, which are still waiting, and which failed — the reader has to read each progress bar/percentage individually.

## Goal

Add a small per-row status icon to each inner job entry in `InnerJob.js` so the whole sequence's progress can be scanned visually, similar to a checklist.

## Design

### Status → icon mapping

| Inner job state | Icon class | Notes |
|---|---|---|
| Not yet started (pending, not the current job) | `icon-checkbox-unchecked` | Default/neutral color |
| Currently running (`isCurrentJob` true) | `icon-spinner` | Animated rotation via CSS |
| Succeeded | `icon-checkbox-checked` | Green |
| Failed | `icon-cross` | Red |

These icon classes already exist in `webapp/style/ico.scss` and are used elsewhere in the app for equivalent states (e.g. `icon-checkmark`/`icon-checkbox-checked` for done/accepted states, `icon-cross` for rejected/failed states), so no new icon assets are needed.

### Component changes

`webapp/views/App/JobMonitor/InnerJobs/InnerJob/InnerJob.js`:

- Compute the icon class from the inner job's status:
  - If `isCurrentJob` and not ended → `icon-spinner`
  - Else if `JobSerialized.isSucceeded(innerJob)` → `icon-checkbox-checked`
  - Else if `JobSerialized.isFailed(innerJob)` → `icon-cross`
  - Else (pending, not current) → `icon-checkbox-unchecked`
- Render `<span className={\`icon status-icon ${iconClass}\`} />` immediately before the existing `{index + 1}. {name}` text inside `.name`.
- No new props on `InnerJob`/`InnerJobs` — `isCurrentJob` and the inner job object already carry everything needed.
- No changes to `JobProgress`, `JobTiming`, or `JobSerialized` (no data-layer changes) — the progress bar and timing continue to render exactly as they do today, for the current job and for ended jobs. The icon is purely additive.

### Styling

`webapp/views/App/JobMonitor/JobMonitor.scss`:

- Add a `@keyframes spin` rule and apply it to `.app-job-monitor__inner-jobs .job .name .status-icon.icon-spinner` so the spinner rotates continuously while a job is running. Scoped to this component so it doesn't affect any other `icon-spinner` usage in the app.
- Color the checked-box icon green and the cross icon red (consistent with `JobProgress`'s existing success/error color choices), and give the status icon a small fixed width/margin so row text stays aligned regardless of which icon is shown.

## Out of scope

- No changes to the top-level `JobProgress`/`JobTiming` components.
- No changes to how the outer (non-inner) job's own status is displayed in `JobMonitor.js`.
- No new translations needed — the icon is decorative and paired with existing visible text (job name, and progress bar/timing when present).

## Testing

- Manual verification: trigger a job with multiple inner jobs (e.g. an import job) and confirm, while it runs, that already-finished inner jobs show a checked box, the currently running one shows a spinning icon, and not-yet-started ones show an empty checkbox. Trigger a failure case and confirm the failed inner job shows a cross.
