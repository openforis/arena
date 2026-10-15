/**
 * Reports AI errors that no screen can show (a blocked storage, a failed background save) in the browser console, so
 * they are not swallowed silently. The only place of the AI code that touches the console.
 */

// what the code that recovers from an error calls, so a test can capture it
export type AiLog = (message: string, error?: unknown) => void

/**
 * Logs a problem the app recovered from.
 * @param {string} message - What failed and what the app did instead.
 * @param {unknown} [error] - The error, when there is one.
 * @returns {void}
 */
export const logAiWarning = (message: string, error?: unknown): void => {
  // eslint-disable-next-line no-console
  console.warn(`[arena-ai] ${message}`, ...(error === undefined ? [] : [error]))
}
