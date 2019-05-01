import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import * as SurveyState from '../../../survey/surveyState'
import * as SurveyViewsState from '../surveyViewsState'

const keys = {
  nodeDefUuidEdit: 'nodeDefUuidEdit', // current nodeDef edit
}

export const stateKey = 'nodeDefEdit'
const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = prop => R.pipe(getState, R.prop(prop))

export const assocNodeDefEdit = nodeDef => R.assoc(keys.nodeDefUuidEdit, NodeDef.getUuid(nodeDef))

export const getNodeDefEdit = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidEdit = getStateProp(keys.nodeDefUuidEdit)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidEdit)(survey)
}

export const hasNodeDef = R.pipe(
  getNodeDefEdit,
  R.isNil,
  R.not
)