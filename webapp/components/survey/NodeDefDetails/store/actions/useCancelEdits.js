import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { NodeDefsActions } from '@webapp/store/survey'
import * as State from '../state'

export const useCancelEdits = ({ state }) => {
  const history = useHistory()
  const dispatch = useDispatch()

  return () => {
    ;(async () => {
      const nodeDef = State.getNodeDef(state)
      const nodeDefOriginal = State.getNodeDefOriginal(state)

      await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))

      history.goBack()
    })()
  }
}
