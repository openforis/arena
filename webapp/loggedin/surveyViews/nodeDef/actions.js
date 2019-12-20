import * as Survey from '@core/survey/survey'
import * as SurveyState from '@webapp/survey/surveyState'

export const nodeDefEditUpdate = 'surveyViews/nodeDef/update'

// Set current nodeDef edit
export const setNodeDefUuidForEdit = nodeDefUuid => (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefValidation = Survey.getNodeDefValidation(nodeDef)(survey)
  dispatch({ type: nodeDefEditUpdate, nodeDef, nodeDefValidation })
}
