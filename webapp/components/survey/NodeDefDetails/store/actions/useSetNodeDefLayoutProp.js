import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState } from '@webapp/store/survey'
import * as NodeDefState from '../state'
import { useValidateNodeDef } from './useValidateNodeDef'

export const useSetNodeDefLayoutProp = ({ nodeDefState, setNodeDefState }) => (key, value) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)

  const nodeDefUpdated = R.pipe(
    Survey.updateNodeDefLayoutProp({ surveyCycleKey, nodeDef, key, value }),
    Survey.getNodeDefByUuid(NodeDef.getUuid(nodeDef))
  )(survey)

  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })
  dispatch(validateNodeDef({ nodeDef: nodeDefUpdated }))
}
