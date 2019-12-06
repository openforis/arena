import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyState from '@webapp/survey/surveyState'
import * as SurveyViewsState from '../surveyViewsState'

const keys = {
  nodeDefUuid: 'nodeDefUuid', // Current nodeDef edit
}

export const stateKey = 'nodeDefEdit'
const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = prop => R.pipe(getState, R.prop(prop))

export const assocNodeDefUuid = R.assoc(keys.nodeDefUuid)

export const getNodeDef = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidEdit = getStateProp(keys.nodeDefUuid)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidEdit)(survey)
}
