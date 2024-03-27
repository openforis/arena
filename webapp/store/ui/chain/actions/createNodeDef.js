import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { NodeDefsActions, SurveyState } from '@webapp/store/survey'

export const createNodeDef =
  ({ navigate, type, virtual = false }) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const { chain } = state.ui.chain
    const { uuid: chainUuid } = chain

    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycleKeys = Survey.getCycleKeys(surveyInfo)

    const analysisNodeDefs = Survey.getAnalysisNodeDefs({ chain, showInactiveResultVariables: true })(survey)

    const avancedProps = { chainUuid, active: true, index: analysisNodeDefs.length }
    const nodeDef = NodeDef.newNodeDef(null, type, cycleKeys, {}, avancedProps, true, virtual)

    await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
    navigate(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
  }
