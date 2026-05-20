/**
 * Prompt builder for the activity-log summarization feature (Tier 1 #5).
 *
 * The service feeds the model an *aggregated* view of the log (counts
 * per user × event type, with a few sample timestamps) rather than raw
 * events, so the prompt stays small even for a busy survey.
 */
import { pq } from './promptSafety'

/**
 * Builds the system + user prompt pair for the streaming summary.
 * @param {object} args - Args.
 * @param {string} args.surveyName - Survey display name.
 * @param {string} args.from - ISO timestamp of the window start.
 * @param {string} args.to - ISO timestamp of the window end.
 * @param {number} args.totalCount - Total events in the window.
 * @param {Array<{user:string, type:string, count:number, samples:string[]}>} args.aggregates - Per-user/type aggregates.
 * @returns {{ system: string, prompt: string }} The pair for `stream`.
 */
export const buildActivityLogSummaryPrompt = ({ surveyName, from, to, totalCount, aggregates }) => {
  const system = `You summarize Open Foris Arena survey activity logs for a project manager.

Style:
- 2-4 short paragraphs of plain prose, no headings, no bullet lists.
- Lead with the headline: who did what most.
- Group by theme (schema design, data entry, user changes, etc.)
  rather than by raw timestamp.
- Call out anomalies you notice — for example, an unusual spike in
  deletions, a single user doing all the work, or a long quiet period.
- If the data shows nothing notable, say so honestly.
- Numbers and user identifiers should be quoted verbatim from the input;
  do not invent activity that isn't in the aggregates.`

  const aggregatesBlock = aggregates
    .slice(0, 200)
    .map(
      (a) =>
        `  - user=${pq(a.user, 64)} type=${pq(a.type, 64)} count=${a.count}` +
        (a.samples && a.samples.length ? ` samples=${a.samples.slice(0, 3).join(', ')}` : '')
    )
    .join('\n')

  const prompt = `Survey: ${pq(surveyName, 200)}
Window: ${from} to ${to}
Total events: ${totalCount}

Aggregates (user × event type):
${aggregatesBlock || '  (no events in window)'}

Write the summary.`

  return { system, prompt }
}
