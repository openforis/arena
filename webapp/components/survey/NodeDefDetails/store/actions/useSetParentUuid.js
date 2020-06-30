import * as NodeDef from '@core/survey/nodeDef'

import { useValidateNodeDef } from './useValidateNodeDef'
import * as NodeDefState from '../state'

export const useSetParentUuid = ({ nodeDefState, setNodeDefState }) => {
  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })

  return ({ parentUuid }) => {
    const nodeDef = NodeDefState.getNodeDef(nodeDefState)

    const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

    validateNodeDef({ nodeDef: nodeDefUpdated })
  }
}
