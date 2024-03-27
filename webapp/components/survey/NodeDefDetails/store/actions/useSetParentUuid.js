import { useCallback } from 'react'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import { State } from '../state'

import { useValidate } from './useValidate'

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
