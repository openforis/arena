import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as NodeDefState from '../nodeDefState'
import { useSetNodeDefProp } from './useSetNodeDefProp'
import { updateLayoutProp } from './update'

export const useSetNodeDefLayoutProp = ({ nodeDefState, setNodeDefState }) => (key, value) => async (dispatch) => {
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const setNodeDefProp = useSetNodeDefProp({ nodeDefState, setNodeDefState })

  const layoutUpdated = dispatch(updateLayoutProp(nodeDef, key, value))

  dispatch(setNodeDefProp(NodeDefLayout.keys.layout, layoutUpdated))
}
