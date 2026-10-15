export type DismissAction = 'close' | 'keepRunning' | 'ask' | 'none'

/**
 * Returns what a click on the backdrop or Escape does in the progress dialog.
 * @param {object} params - Parameters.
 * @param {boolean} params.error - The run failed (the dialog only shows the error).
 * @param {boolean} params.asking - The "stop?" question is shown.
 * @param {boolean} params.stopping - A stop was already requested.
 * @returns {DismissAction} close after an error; keepRunning answers the question with the safe choice; ask opens the
 * question; none while stopping.
 */
export const getDismissAction = ({
  error,
  asking,
  stopping,
}: {
  error: boolean
  asking: boolean
  stopping: boolean
}): DismissAction => {
  if (error) return 'close'
  if (asking) return 'keepRunning'
  return stopping ? 'none' : 'ask'
}
