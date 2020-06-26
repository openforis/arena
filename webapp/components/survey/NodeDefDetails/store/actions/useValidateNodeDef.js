import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import * as SurveyState from '@webapp/store/survey/state'

import { NodeDefsActions } from '@webapp/store/survey'
import * as NodeDefState from '../state'

export const useValidateNodeDef = ({ nodeDefState, setNodeDefState }) => ({ nodeDef }) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  const surveyUpdated = Survey.assocNodeDef({ nodeDef, updateDependencyGraph: true })(survey)

  // Validate node def
  const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDef)

  // Update local state
  setNodeDefState(NodeDefState.assocNodeDefAndValidation(nodeDef, nodeDefValidation)(nodeDefState))

  // Dispatch update action
  dispatch(NodeDefsActions.updateNodeDef({ nodeDef }))
}
