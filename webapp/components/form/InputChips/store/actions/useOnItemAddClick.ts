import { useCallback } from 'react'

import { useAppDispatch } from '@webapp/store'
import { NotificationActions } from '@webapp/store/ui'
import { State } from '../state'

export const useOnItemAddClick = ({ onChange, onItemAdd, setState }) => {
  const dispatch = useAppDispatch()

  return useCallback(
    ({ selection }) => {
      setState((statePrev) => {
        const value = State.getInputFieldValue(statePrev)
        if (selection.includes(value)) {
          dispatch(NotificationActions.notifyWarning({ key: 'common.itemAlreadyAdded' }))
          return statePrev
        }
        onChange([...selection, value])
        onItemAdd?.(value)
        return State.assocInputFieldValue('')(statePrev)
      })
    },
    [dispatch, onChange, onItemAdd, setState]
  )
}
