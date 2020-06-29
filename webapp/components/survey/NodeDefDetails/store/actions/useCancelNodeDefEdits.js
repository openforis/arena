import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefActions from '@webapp/store/survey/nodeDefs/actions'

import * as NodeDefState from '../state'

export const useCancelNodeDefEdits = ({ nodeDefState }) => (history) => async (dispatch) => {
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const nodeDefOriginal = NodeDefState.getNodeDefOriginal(nodeDefState)

  await dispatch({
    type: NodeDefActions.nodeDefPropsUpdateCancel,
    nodeDef,
    nodeDefOriginal,
    isNodeDefNew: NodeDef.isTemporary(nodeDef),
  })

  history.goBack()
}
