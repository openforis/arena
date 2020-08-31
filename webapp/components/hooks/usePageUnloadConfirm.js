import { useEffect } from 'react'

import { useI18n } from '@webapp/store/system'

/**
 * Intercepts the page unload event and shows a confirm message, if active.
 *
 * @param {object} [params={}] - The parameters.
 * @param {boolean} [params.active=false] - True if a message on page unload should be shown, false otherwise.
 * @param {string} [params.confirmMessageKey=common.leavePageConfirmMessage] - Key of the leave page confirm message.
 * @returns {undefined}
 */
export const usePageUnloadConfirm = (params = {}) => {
  const { active = false, confirmMessageKey = 'common.leavePageConfirmMessage' } = params

  const i18n = useI18n()

  // Set window.onbeforeunload on "active" change
  useEffect(() => {
    window.onbeforeunload = active ? () => i18n.t(confirmMessageKey) : null
  }, [active])

  // Reset window.onbeforeunload on unmount
  useEffect(() => {
    return () => {
      window.onbeforeunload = null
    }
  }, [])
}
