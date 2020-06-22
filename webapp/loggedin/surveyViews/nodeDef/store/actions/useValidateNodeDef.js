import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'

import * as SurveyState from '@webapp/store/survey/state'

import * as NodeDefState from '../nodeDefState'

export const useValidateNodeDef = ({ nodeDefState, setNodeDefState }) => ({
  nodeDef,
  props = {},
  propsAdvanced = {},
}) => async (_, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  //   const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  //   const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  // Validate node def
  const surveyUpdated = R.pipe(
    // Associate updated node def
    Survey.assocNodeDef(nodeDef),
    // Build and associate dependency graph
    Survey.buildAndAssocDependencyGraph
  )(survey)

  const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDef)

  setNodeDefState(NodeDefState.assocNodeDefProps(nodeDef, nodeDefValidation, props, propsAdvanced)(nodeDefState))
  /*
    dispatch({
      type: nodeDefPropsUpdate,
      nodeDef,
      nodeDefValidation,
      parentNodeDef,
      props,
      propsAdvanced,
      surveyCycleKey,
    })
    */
}
