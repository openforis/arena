import { useCallback } from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import { useValidate } from './useValidate'
import { State } from '../state'

export const useSetParentUuid = ({ setState }) => {
  const validateNodeDef = useValidate({ setState })

  return useCallback(({ state, parentUuid }) => {
    const nodeDef = State.getNodeDef(state)

    const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

    validateNodeDef({ state, nodeDefUpdated })
  }, [])
}
