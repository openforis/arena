import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefState from '../nodeDefState'

export const nodeDefPropsUpdateCancel = 'survey/nodeDef/props/update/cancel'

export const useCancelNodeDefEdits = ({ nodeDefState }) => (history) => async (dispatch) => {
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const nodeDefOriginal = NodeDefState.getNodeDefOriginal(nodeDefState)

  await dispatch({
    type: nodeDefPropsUpdateCancel,
    nodeDef,
    nodeDefOriginal,
    isNodeDefNew: NodeDef.isTemporary(nodeDef),
  })

  history.goBack()
}
