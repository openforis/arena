import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'
import { State } from '../state'
import { useValidate } from './useValidate'

export const useSetVisibleIfMode = ({ setState }) => {
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidate({ setState })

  return useCallback(
    async ({ state, clearVisibleIf, hidden, hiddenWhenNotRelevant }) => {
      const nodeDef = State.getNodeDef(state)

      let nodeDefUpdated = nodeDef

      if (clearVisibleIf) {
        nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.visibleIf, value: [] })(nodeDefUpdated)
      }
      nodeDefUpdated = NodeDef.assocProp({ key: NodeDef.propKeys.hidden, value: hidden })(nodeDefUpdated)
      nodeDefUpdated = NodeDef.clearNotApplicableProps(surveyCycleKey)(nodeDefUpdated)

      const nodeDefsUpdated = Survey.updateLayoutProp({
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
        key: NodeDefLayout.keys.hiddenWhenNotRelevant,
        value: hiddenWhenNotRelevant,
      })(survey)
      nodeDefUpdated = nodeDefsUpdated[nodeDef.uuid]

      await validateNodeDef({ nodeDef, nodeDefUpdated })
    },
    [survey, surveyCycleKey, validateNodeDef]
  )
}
