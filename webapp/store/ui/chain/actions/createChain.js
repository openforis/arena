import axios from 'axios'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { SurveyState } from '@webapp/store/survey'

export const createChain =
  ({ history }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const { data: chain } = await axios.post(`/api/survey/${surveyId}/chain`, { cycle })

    history.push(`${appModuleUri(analysisModules.chain)}${chain.uuid}/`)
  }
