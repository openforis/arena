import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { asyncScheduler, Subject } from 'rxjs'
import { switchMap, throttleTime } from 'rxjs/operators'
import { ajax } from 'rxjs/ajax'
import { fromAjax } from '@webapp/utils/rxjs'

const createAjaxSubject = ({ dispatch, throttle }) => {
  const fetchSubject = new Subject()
  return fetchSubject.pipe(
    throttleTime(throttle, asyncScheduler, { leading: false, trailing: true }),
    switchMap(({ url, body }) =>
      fromAjax({
        ajax: ajax.post(url, body, { 'Content-Type': 'application/json' }),
        dispatch,
      })
    )
  )
}

export const usePost = ({ subscribe, throttle = 0 }) => {
  const dispatch = useDispatch()
  const [ajaxSubject] = useState(createAjaxSubject({ dispatch, throttle }))
  const [responseSubject] = useState(new Subject())

  useEffect(() => {
    const ajaxSubscription = ajaxSubject.subscribe((response) => responseSubject.next(response))
    const responseSubscription = responseSubject.subscribe(subscribe)
    return () => {
      ajaxSubscription.unsubscribe()
      responseSubscription.unsubscribe()
    }
  }, [ajaxSubject, responseSubject, subscribe])

  return ajaxSubject
}
