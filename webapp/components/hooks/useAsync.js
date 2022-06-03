import { useCallback, useReducer, useRef } from 'react'
import axios from 'axios'

import useIsMountedRef from './useIsMountedRef'

const ACTION_TYPES = {
  loading: 'loading',
  loaded: 'loaded',
  error: 'error',
}

const actionHandlersByType = {
  [ACTION_TYPES.loading]: (payload) => ({ ...payload, loading: true, loaded: false }),
  [ACTION_TYPES.loaded]: (payload) => ({ ...payload, loading: false, loaded: true }),
  [ACTION_TYPES.error]: (error) => ({ error, loading: false, loaded: false }),
}

export default ({ method, url, data, ...rest }) => {
  const [state, _dispatch] = useReducer((_state, { type, payload }) => actionHandlersByType[type](payload), {
    loading: false,
    loaded: false,
    source: null,
  })
  const isMountedRef = useIsMountedRef()

  const dispatch = useCallback(async () => {
    const { source: sourcePrev } = state
    if (sourcePrev) {
      sourcePrev.cancel()
    }
    const source = axios.CancelToken.source()

    _dispatch({ type: ACTION_TYPES.loading, payload: { ...state, source } })

    try {
      const result = await axios({ ...rest, method, url, data, cancelToken: source.token })
      if (isMountedRef.current) {
        _dispatch({ type: ACTION_TYPES.loaded, payload: result })
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        _dispatch({ type: ACTION_TYPES.error, payload: error })
      }
    }
  }, [state, isMountedRef, method, url, data, rest])

  const setState = (stateUpdate) => {
    _dispatch({ type: ACTION_TYPES.loading, payload: stateUpdate })
  }

  return {
    ...state,
    dispatch,
    setState,
  }
}
