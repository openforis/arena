import { useEffect } from 'react'

import { useI18n } from '@webapp/store/system'

/**
 *
 * @param {!object} params - The parameters.
 * @param {boolean} [params.active] - True if onBack callback should be called on browser back button press
 * and confirm message on page refresh should be shown.
 * @param {!Function} [params.onBack] - Callback to be called when back button is pressed. It should return true when history.back() is called by the callback itself, false othwerwise.
 * @param {string} [params.confirmMessageKey] - Message key of the leave page confirm message.
 * @returns {undefined}
 */
export const useIntersectBack = ({ active = false, onBack, confirmMessageKey = 'common.leavePageConfirmMessage' }) => {
  const i18n = useI18n()

  const onBackButtonEvent = async (e) => {
    e.preventDefault()

    if (active) {
      const wentBack = await onBack()
      if (wentBack) {
        window.onbeforeunload = null
      } else {
        window.history.pushState(null, null, window.location.pathname)
      }
    } else {
      window.onbeforeunload = null
      window.history.back()
    }
  }

  useEffect(() => {
    // Push a "null" state to detect back button press
    if (window.history.state !== null) {
      window.history.pushState(null, null, window.location.pathname)
    }
    window.addEventListener('popstate', onBackButtonEvent)

    // Show warning popup on page refresh
    window.onbeforeunload = () => {
      return active ? i18n.t(confirmMessageKey) : null
    }

    return () => {
      window.removeEventListener('popstate', onBackButtonEvent)
    }
  }, [active, onBack])
}
