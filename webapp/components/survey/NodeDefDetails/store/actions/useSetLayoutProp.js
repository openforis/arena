import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'

import { State } from '../state'

import { useValidate } from './useValidate'

export const useSetLayoutProp = ({ setState }) => {
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidate({ setState })

  return useCallback(({ state, key, value }) => {
    const nodeDef = State.getNodeDef(state)

    const nodeDefsUpdated = Survey.updateLayoutProp({ surveyCycleKey, nodeDef, key, value })(survey)

    // validate current node def
    const nodeDefUpdated = nodeDefsUpdated[nodeDef.uuid]
    validateNodeDef({ state, nodeDefUpdated })
  }, [])
}
