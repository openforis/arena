import React, { useReducer } from 'react'

import useIsMounted from './useIsMounted'

const useAsyncActionHandlers = [
  data => ({ ...data, loading: true }),
  data => ({ ...data, loading: false }),
  error => ({ error, loading: false }),
]

export default (promiseFn, promiseArgs) => {
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

  const setState = stateUpdate => {
    _dispatch({ type: 0, payload: stateUpdate })
  }

  return {
    ...state,
    dispatch,
    setState,
  }
}