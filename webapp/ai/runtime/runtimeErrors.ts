/**
 * Error helpers for the AI UI: every failure shows a translated appErrors message, never raw HTTP text.
 */
// loose on purpose: i18next's `t` returns a wider type than string
type I18n = { t: (key: any, params?: any) => unknown }

const AI_KEY = /^ai[A-Z]/

/** Returns the error and the errors the AI SDK may wrap it in (retry / cause chains). */
const unwrap = (error: any): any[] => [error, error?.lastError, error?.cause, error?.error].filter(Boolean)

/**
 * Returns the AI error key of an error (SystemError from the gateway model), or null.
 * @param {unknown} error - The error.
 * @returns {string|null} The key.
 */
export const getAiErrorKey = (error: unknown): string | null => {
  const withKey = unwrap(error).find((candidate) => typeof candidate?.key === 'string' && AI_KEY.test(candidate.key))
  return withKey?.key ?? null
}

/**
 * Returns true for errors caused by a user cancel (to be ignored by the UI).
 * @param {unknown} error - The error.
 * @returns {boolean} True when aborted.
 */
export const isAiAbortError = (error: unknown): boolean => unwrap(error).some((e) => e?.name === 'AbortError')

/**
 * Returns the translated message for an AI error.
 * @param {object} params - Parameters.
 * @param {unknown} params.error - The error.
 * @param {I18n} params.i18n - i18n instance.
 * @returns {string} The message.
 */
export const getAiErrorMessage = ({ error, i18n }: { error: unknown; i18n: I18n }): string => {
  const aiKey = getAiErrorKey(error)
  const withParams = aiKey ? unwrap(error).find((candidate) => candidate?.key === aiKey) : null
  if (aiKey) return String(i18n.t(`appErrors:${aiKey}`, withParams?.params ?? {}))
  // an API error (axios) carrying an appErrors-style key, e.g. the activity-log fetch failing
  const data = (error as any)?.response?.data
  const responseKey = typeof data?.key === 'string' ? data.key.replace(/^appErrors:/, '') : ''
  if (responseKey) return String(i18n.t(`appErrors:${responseKey}`, data.params ?? {}))
  return String(i18n.t('appErrors:aiProviderUnavailable', {}))
}
