import * as NodeDef from '@core/survey/nodeDef'
import { useValidateNodeDef } from './useValidateNodeDef'
import * as NodeDefState from '../state'

export const useSetNodeDefParentUuid = ({ nodeDefState, setNodeDefState }) => (parentUuid) => async (dispatch) => {
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)

  const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })
  dispatch(validateNodeDef({ nodeDef: nodeDefUpdated }))
}
