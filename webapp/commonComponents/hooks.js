import React, { useRef, useEffect, useReducer, useState } from 'react'
import axios from 'axios'

export const usePrevious = (value, initialValue = null) => {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef(initialValue)

  // Store current value in ref
  useEffect(() => {
    ref.current = value
  }, [value]) // Only re-run if value changes

  // Return previous value (happens before update in useEffect above)
  return ref.current
}

export const useOnUpdate = (effect, inputs = []) => {
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      effect()
    }

  }, inputs)
}

export const useIsMounted = () => {
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}

// === async hooks

const useAsyncActionHandlers = [
  data => ({ ...data, loading: true }),
  data => ({ ...data, loading: false }),
  error => ({ error, loading: false }),
]

export const useAsync = (promiseFn, promiseArgs) => {
  const [state, _dispatch] = useReducer(
    (state, { type, payload }) => useAsyncActionHandlers[type](payload),
    { loading: false }
  )
  const isMounted = useIsMounted()

  const dispatch = () => {
    (async () => {
      _dispatch({ type: 0, payload: state })

      try {
        const payload = await promiseFn(...promiseArgs)
        if (isMounted.current)
          _dispatch({ type: 1, payload })
      } catch (error) {
        _dispatch({ type: 2, payload: error })
      }

    })()
  }

  return {
    dispatch,
    ...state,
  }
}

export const useAsyncGetRequest = (url, config = {}) => useAsync(axios.get, [url, config])
