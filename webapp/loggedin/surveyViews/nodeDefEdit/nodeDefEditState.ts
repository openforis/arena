import * as R from 'ramda'

import Survey from '../../../../core/survey/survey'
import NodeDef from '../../../../core/survey/nodeDef'
import * as SurveyState from '../../../survey/surveyState'
import * as SurveyViewsState from '../surveyViewsState'

const keys = {
  nodeDefUuid: 'nodeDefUuid', // current nodeDef edit
}

export const stateKey = 'nodeDefEdit'
const getState: (x: any) => any = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp: (prop: any) => (x: any) => any
= prop => R.pipe(getState, R.prop(prop))

export const assocNodeDef = nodeDef => R.assoc(keys.nodeDefUuid, NodeDef.getUuid(nodeDef))

export const getNodeDef = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidEdit = getStateProp(keys.nodeDefUuid)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidEdit)(survey)
}

export const hasNodeDef = R.pipe(
  getNodeDef,
  R.isNil,
  R.not
)
