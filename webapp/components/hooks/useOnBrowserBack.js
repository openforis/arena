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

  const history = useHistory()

  // used to know if the temporary location has been set to avoid going back too many times
  const tempLocationSetRef = useRef(false)
  // used to know if the popstate event listener has been added
  const listenerAddedRef = useRef(false)

  const addPopStateEventListener = () => {
    if (!listenerAddedRef.current) {
      window.addEventListener('popstate', onBackButtonEvent)
      listenerAddedRef.current = true
    }
  }

  const removePopStateEventListener = () => {
    window.removeEventListener('popstate', onBackButtonEvent)
    listenerAddedRef.current = false
  }

  const addTempLocationToHistory = () => {
    if (!tempLocationSetRef.current) {
      history.push(history.location.pathname, null)
      tempLocationSetRef.current = true
    }
  }

  const removeTempLocationFromHistory = () => {
    if (tempLocationSetRef.current) {
      tempLocationSetRef.current = false
      history.goBack()
    }
  }

  const onBackButtonEvent = async (event) => {
    event.preventDefault()

    // the browser went back from the temp location
    tempLocationSetRef.current = false

    const wentBackSuccessfully = await onBack()
    if (!wentBackSuccessfully) {
      // add again a temp location to prevent browser back
      addTempLocationToHistory()
    }
  }

  useEffect(() => {
    if (active) {
      addTempLocationToHistory()
      addPopStateEventListener()

      return removePopStateEventListener
    } else {
      removeTempLocationFromHistory()
    }
  }, [active, onBack])
}
