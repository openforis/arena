import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { asyncScheduler, BehaviorSubject, EMPTY, Subject } from 'rxjs'
import { map, switchMap, throttleTime } from 'rxjs/operators'
import { ajax } from 'rxjs/ajax'
import { fromAjax } from '@webapp/utils/rxjs'

const initialState = {
  data: null,
  loading: false,
  loaded: false,
}

const createAjaxSubject = ({ dispatch, throttle }) =>
  new Subject().pipe(
    throttleTime(throttle, asyncScheduler, { leading: false, trailing: true }),
    switchMap(({ url, body } = { body: EMPTY }) => {
      if (body === EMPTY) return EMPTY

      return fromAjax({
        ajax: ajax.post(url, body, { 'Content-Type': 'application/json' }),
        dispatch,
      }).pipe(map((data) => ({ data, loading: false, loaded: true })))
    })
  )

export const usePost = ({ subscribe, throttle = 0 }) => {
  const dispatch = useDispatch()
  const [responseSubject] = useState(new BehaviorSubject(initialState))
  const [ajaxSubject] = useState(createAjaxSubject({ dispatch, throttle, responseSubject }))

  useEffect(() => {
    const ajaxSubscription = ajaxSubject.subscribe(responseSubject.next.bind(responseSubject))
    const responseSubscription = responseSubject.subscribe(subscribe)
    return () => {
      ajaxSubscription.unsubscribe()
      responseSubscription.unsubscribe()
    }
  }, [ajaxSubject, responseSubject, subscribe])

  const post = ({ body, url }) => {
    responseSubject.next({ ...responseSubject.getValue(), loading: true })
    ajaxSubject.next({ body, url })
  }

  const reset = () => {
    responseSubject.next({ ...initialState })
    ajaxSubject.next()
  }

  return { post, reset }
}
