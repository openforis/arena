import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { NodeDefsActions, SurveyState } from '@webapp/store/survey'

export const createNodeDef = ({ history, type }) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const { entityDefUuid } = state.ui.chain

  const surveyInfo = Survey.getSurveyInfo(survey)
  const cycleKeys = Survey.getCycleKeys(surveyInfo)
  const nodeDefParent = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const nodeDef = NodeDef.newNodeDef(nodeDefParent, type, cycleKeys, {}, {}, true)

  await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
  history.push(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
}
