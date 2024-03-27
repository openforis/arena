import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import { NodeDefsActions } from '@webapp/store/survey'
import * as SurveyState from '@webapp/store/survey/state'

import { State } from '../state'

export const useValidate = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)

  return useCallback(async ({ nodeDefUpdated }) => {
    const surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefUpdated })(survey)

    // Update local state immediately (see issue #3240)
    setState(State.assocNodeDef(nodeDefUpdated))

    // // Dispatch update action
    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated }))

    // // Validate node def
    const validation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDefUpdated)
    setState(State.assocValidation(validation))
  }, [])
}
