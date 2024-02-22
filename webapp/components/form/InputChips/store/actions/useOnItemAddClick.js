import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { NotificationActions } from '@webapp/store/ui'
import { State } from '../state'

export const useOnItemAddClick = ({ onChange, setState }) => {
  const dispatch = useDispatch()

  return useCallback(
    ({ selection }) => {
      setState((statePrev) => {
        const value = State.getInputFieldValue(statePrev)
        if (selection.indexOf(value) >= 0) {
          dispatch(NotificationActions.notifyWarning({ key: 'common.itemAlreadyAdded' }))
          return statePrev
        }
        onChange([...selection, value])
        return State.assocInputFieldValue('')(statePrev)
      })
    },
    [dispatch, onChange, setState]
  )
}
