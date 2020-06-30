import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { NodeDefsActions } from '@webapp/store/survey'
import * as NodeDefState from '../state'

export const useCancelEdits = ({ nodeDefState }) => {
  const history = useHistory()
  const dispatch = useDispatch()

  return () => {
    ;(async () => {
      const nodeDef = NodeDefState.getNodeDef(nodeDefState)
      const nodeDefOriginal = NodeDefState.getNodeDefOriginal(nodeDefState)

      await dispatch(NodeDefsActions.cancelEdit({ nodeDef, nodeDefOriginal }))

      history.goBack()
    })()
  }
}
