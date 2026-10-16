/**
 * Runs a card action (Apply, Discard) so that its failure is shown to the user instead of left as an unhandled
 * rejection (pure: the notifier is a parameter).
 */
export type FailureNotice = { key: string; params: { message: string } }

/**
 * Runs the action; when it rejects, notifies the failure with the given key and the error message.
 * @param {object} params - Parameters.
 * @param {Function} params.action - The action.
 * @param {Function} params.notifyError - Shows an error notification.
 * @param {string} params.key - i18n key of the notification (takes the `message` param).
 * @returns {Promise<boolean>} True when the action succeeded.
 */
export const runWithFailureNotice = async ({
  action,
  notifyError,
  key,
}: {
  action: () => Promise<void> | void
  notifyError: (notice: FailureNotice) => void
  key: string
}): Promise<boolean> => {
  try {
    await action()
    return true
  } catch (error) {
    notifyError({ key, params: { message: (error as Error)?.message ?? '' } })
    return false
  }
}
