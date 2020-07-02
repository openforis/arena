import * as NodeDef from '@core/survey/nodeDef'

import { useValidate } from './useValidate'
import * as State from '../state'

export const useSetParentUuid = ({ state, setState }) => {
  const validateNodeDef = useValidate({ state, setState })

  return ({ parentUuid }) => {
    const nodeDef = State.getNodeDef(state)

    const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

    validateNodeDef({ nodeDef: nodeDefUpdated })
  }
}
