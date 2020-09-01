import { useEffect } from 'react'

/**
 * Intercepts the browser back button press and calls the specified callback.
 * The call to the callback can be can be activated or deactivated using the "active" parameter.
 *
 * @param {!object} params - The parameters.
 * @param {!Function} [params.onBack] - Callback to be called when back button is pressed. It should return true when history.back() is called by the callback itself, false othwerwise.
 * @param {boolean} [params.active=false] - True if onBack callback should be called on browser back button press and confirm message on page refresh should be shown.
 * @returns {undefined}
 */
export const useOnBrowserBack = (params) => {
  const { active = false, onBack } = params

  const onBackButtonEvent = async (event) => {
    event.preventDefault()

    if (active) {
      const wentBack = await onBack()
      if (!wentBack) {
        window.history.pushState(null, null, window.location.pathname)
      }
    } else {
      window.history.back()
    }
  }

  useEffect(() => {
    // Push a "null" state to detect back button press
    if (window.history.state !== null) {
      window.history.pushState(null, null, window.location.pathname)
    }
    window.addEventListener('popstate', onBackButtonEvent)

    return () => {
      window.removeEventListener('popstate', onBackButtonEvent)
    }
  }, [active, onBack])
}
