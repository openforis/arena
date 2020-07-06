import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import * as SurveyState from '@webapp/store/survey/state'

import { NodeDefsActions } from '@webapp/store/survey'
import { State } from '../state'

export const useValidate = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)

  return useCallback(async ({ state, nodeDefUpdated }) => {
    const surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefUpdated, updateDependencyGraph: true })(survey)

    // Validate node def
    const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDefUpdated)

    // Update local state
    setState(State.assocNodeDefAndValidation(nodeDefUpdated, nodeDefValidation)(state))

    // Dispatch update action
    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: nodeDefUpdated }))
  })
}
