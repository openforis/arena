import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { updateLayoutProp } from './update'
import { usePutNodeDefProps } from './usePutNodeDefProps'

import types from './types'

// Updates the specified layout prop of a node def and persists the change
export const usePutNodeDefLayoutProp = () => ({ nodeDef, key, value }) => async (dispatch) => {
  const layoutUpdated = dispatch(updateLayoutProp(nodeDef, key, value))
  const props = { [NodeDefLayout.keys.layout]: layoutUpdated }
  const nodeDefUpdated = NodeDef.mergeProps(props)(nodeDef)
  dispatch({ type: types.nodeDefUpdate, nodeDef: nodeDefUpdated })

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const putNodeDefProps = usePutNodeDefProps()
  dispatch(
    debounceAction(
      putNodeDefProps({ nodeDefUuid, parentUuid: NodeDef.getParentUuid(nodeDef), props }),
      `${types.nodeDefUpdate}_${nodeDefUuid}_${key}`
    )
  )
}
