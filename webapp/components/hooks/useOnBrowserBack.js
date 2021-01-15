import { useEffect, useRef } from 'react'
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

  // use a ref to know if the temporary location has been set to avoid going back too many times
  const tempLocationSetRef = useRef(false)

  const pushTempLocation = (history) => {
    history.push(history.location.pathname, null)
    tempLocationSetRef.current = true
  }

  const history = useHistory()

  const onBackButtonEvent = async (event) => {
    event.preventDefault()

    if (active) {
      const wentBack = await onBack()
      if (!wentBack) {
        pushTempLocation(history)
      }
    } else if (tempLocationSetRef.current) {
      tempLocationSetRef.current = false
      history.goBack()
    }
  }

  useEffect(() => {
    if (!tempLocationSetRef.current) {
      pushTempLocation(history)
    }
    window.addEventListener('popstate', onBackButtonEvent)

    return () => {
      window.removeEventListener('popstate', onBackButtonEvent)
    }
  }, [active, onBack])
}
