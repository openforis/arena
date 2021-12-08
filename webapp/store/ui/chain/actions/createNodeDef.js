import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { NodeDefsActions, SurveyState } from '@webapp/store/survey'

export const createNodeDef =
  ({ navigate, type, virtual = false }) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const { entityDefUuid, chain } = state.ui.chain
    const { uuid: chainUuid } = chain

    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycleKeys = Survey.getCycleKeys(surveyInfo)
    const nodeDefParent = Survey.getNodeDefByUuid(entityDefUuid)(survey)

    const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ chain, entityDefUuid })(survey)

    const defaultAdvancedProps = { chainUuid, active: true, index: analysisNodeDefsInEntity.length }
    const nodeDef = NodeDef.newNodeDef(nodeDefParent, type, cycleKeys, {}, defaultAdvancedProps, true, virtual)

    await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
    navigate(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
  }
