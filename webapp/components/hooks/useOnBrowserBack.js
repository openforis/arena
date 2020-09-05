import { useEffect } from 'react'
import { useHistory } from 'react-router'

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

  const history = useHistory()

  const onBackButtonEvent = async (event) => {
    event.preventDefault()

    if (active) {
      const wentBack = await onBack()
      if (!wentBack) {
        history.push(history.location.pathname, null)
      }
    } else {
      history.goBack()
    }
  }

  useEffect(() => {
    // Push a "null" state to detect back button press
    const { location } = history
    if (location.state !== null) {
      history.push(location.pathname, null)
    }
    window.addEventListener('popstate', onBackButtonEvent)

    return () => {
      window.removeEventListener('popstate', onBackButtonEvent)
    }
  }, [active, onBack])
}
