import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefState from '../state'
import { useValidateNodeDef } from './useValidateNodeDef'

export const useSetNodeDefParentUuid = ({ nodeDefState, setNodeDefState }) => (parentUuid) => (dispatch) => {
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)

  const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })
  dispatch(validateNodeDef(nodeDefUpdated))
}
