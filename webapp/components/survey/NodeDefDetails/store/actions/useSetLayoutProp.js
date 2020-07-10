import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState } from '@webapp/store/survey'
import { State } from '../state'
import { useValidate } from './useValidate'

export const useSetLayoutProp = ({ setState }) => {
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidate({ setState })

  return useCallback(({ state, key, value }) => {
    const nodeDef = State.getNodeDef(state)

    const nodeDefUpdated = R.pipe(
      Survey.updateNodeDefLayoutProp({ surveyCycleKey, nodeDef, key, value }),
      Survey.getNodeDefByUuid(NodeDef.getUuid(nodeDef))
    )(survey)

    validateNodeDef({ state, nodeDefUpdated })
  }, [])
}
