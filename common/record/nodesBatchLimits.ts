/**
 * Limits of the batch record edit (POST /api/survey/:surveyId/records/nodes/update): the server enforces them and the
 * assistant splits its change sets to fit them.
 */
export const NodesBatchLimits = {
  // per request
  maxEdits: 200,
  maxRecords: 50,
  // longest text, code or other string of one value (a longer one is refused as a malformed value)
  maxValueChars: 10_000,
  // how long a request waits for the records update thread
  replyTimeoutMs: 60_000,
} as const
