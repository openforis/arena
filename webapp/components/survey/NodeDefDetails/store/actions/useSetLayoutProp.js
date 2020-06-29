import { useSelector } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { SurveyState } from '@webapp/store/survey'
import * as NodeDefState from '../state'
import { useValidateNodeDef } from './useValidateNodeDef'

export const useSetLayoutProp = ({ nodeDefState, setNodeDefState }) => {
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })

  return ({ key, value }) => {
    const nodeDef = NodeDefState.getNodeDef(nodeDefState)

    const nodeDefUpdated = R.pipe(
      Survey.updateNodeDefLayoutProp({ surveyCycleKey, nodeDef, key, value }),
      Survey.getNodeDefByUuid(NodeDef.getUuid(nodeDef))
    )(survey)

    validateNodeDef({ nodeDef: nodeDefUpdated })
  }
}
