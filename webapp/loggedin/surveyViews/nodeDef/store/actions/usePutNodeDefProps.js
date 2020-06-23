import axios from 'axios'

import * as SurveyState from '@webapp/store/survey/state'

import { onNodeDefsUpdate } from './update'

export const usePutNodeDefProps = () => ({ nodeDefUuid, parentUuid, props, propsAdvanced }) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    parentUuid,
    cycle,
    props,
    propsAdvanced,
  })

  dispatch(onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
}
