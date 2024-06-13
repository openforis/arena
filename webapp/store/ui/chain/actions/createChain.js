import axios from 'axios'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { SurveyState } from '@webapp/store/survey'

export const createChain =
  ({ navigate }) =>
  async (_dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { data: chain } = await axios.post(`/api/survey/${surveyId}/chain`)

    navigate(`${appModuleUri(analysisModules.chain)}${chain.uuid}/`)
  }
