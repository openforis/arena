/**
 * The notice of a batch run that stopped with partial results: how far it got and why, and that the results so far
 * are kept.
 */
import { getAiErrorMessage } from '@webapp/ai/runtime/runtimeErrors'
import type { AiBatchStop } from '@webapp/ai/workflows/batchRun'

type I18nLike = { t: (key: any, params?: any) => unknown }

/**
 * Returns the text of the notice of a stopped run.
 * @param {object} params - Parameters.
 * @param {AiBatchStop} params.stop - Where and why the run stopped.
 * @param {I18nLike} params.i18n - i18n instance.
 * @returns {string} The text (not HTML-escaped: it is shown as is).
 */
export const getBatchStopText = ({ stop, i18n }: { stop: AiBatchStop; i18n: I18nLike }): string => {
  const params = { done: stop.done, total: stop.total, interpolation: { escapeValue: false } }
  if (stop.cause === 'cancelled') return String(i18n.t('aiBatch.stoppedCancelled', params))
  const message = getAiErrorMessage({ error: stop.error, i18n })
  return String(i18n.t('aiBatch.stoppedError', { ...params, message }))
}
