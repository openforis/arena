import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import * as SurveyState from '@webapp/store/survey/state'

import * as NodeDefState from '../state'

import types from './types'

export const useValidateNodeDef = ({ nodeDefState, setNodeDefState }) => ({ nodeDef }) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  // Update survey with updated node def
  const surveyUpdated = R.pipe(
    // Associate updated node def
    Survey.assocNodeDef(nodeDef),
    // Build and associate dependency graph
    Survey.buildAndAssocDependencyGraph
  )(survey)

  // Validate node def
  const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDef)

  // Update local state
  setNodeDefState(NodeDefState.assocNodeDefAndValidation(nodeDef, nodeDefValidation)(nodeDefState))

  // Dispatch update action
  dispatch({ type: types.NODE_DEF_PROPS_UPDATE, nodeDef })
}
