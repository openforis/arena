import { useCallback } from 'react'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useValidate } from './useValidate'
import { State } from '../state'
import { useSurvey } from '@webapp/store/survey'

export const useSetParentUuid = ({ setState }) => {
  const validateNodeDef = useValidate({ setState })
  const survey = useSurvey()

  return useCallback(
    ({ state, parentUuid }) => {
      const nodeDef = State.getNodeDef(state)
      const parentNodeDef = Survey.getNodeDefByUuid(parentUuid)(survey)
      const metaHierarchy = [...NodeDef.getMetaHierarchy(parentNodeDef), parentUuid]

      const nodeDefUpdated = A.pipe(
        NodeDef.assocParentUuid(parentUuid),
        NodeDef.assocMetaHierarchy(metaHierarchy)
      )(nodeDef)

      validateNodeDef({ state, nodeDefUpdated })
    },
    [survey, validateNodeDef]
  )
}
