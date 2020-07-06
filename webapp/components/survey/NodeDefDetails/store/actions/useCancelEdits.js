import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { NodeDefsActions } from '@webapp/store/survey'
import { State } from '../state'

export const useCancelEdits = () => {
  const history = useHistory()
  const dispatch = useDispatch()

  return useCallback(async ({ state }) => {
    const nodeDef = State.getNodeDef(state)
    const nodeDefOriginal = State.getNodeDefOriginal(state)

    await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))

    history.goBack()
  })
}
