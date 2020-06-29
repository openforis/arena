import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefActions from '@webapp/store/survey/nodeDefs/actions'

import * as NodeDefState from '../state'
import { useHistory } from 'react-router'

export const useCancelEdits = ({ nodeDefState }) => {
  const history = useHistory()
  const dispatch = useDispatch()

  return () => {
    ;(async () => {
      const nodeDef = NodeDefState.getNodeDef(nodeDefState)
      const nodeDefOriginal = NodeDefState.getNodeDefOriginal(nodeDefState)

      await dispatch({
        type: NodeDefActions.nodeDefPropsUpdateCancel,
        nodeDef,
        nodeDefOriginal,
        isNodeDefNew: NodeDef.isTemporary(nodeDef),
      })

      history.goBack()
    })()
  }
}
