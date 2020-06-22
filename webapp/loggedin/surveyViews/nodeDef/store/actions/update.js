import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import * as SurveyState from '@webapp/store/survey/state'

export const updateLayoutProp = (nodeDef, key, value) => (_, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  let nodeDefLayout = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
  )(nodeDef)

  // If setting layout render mode (table | form), set the the proper layout
  if (NodeDef.isEntity(nodeDef) && key === NodeDefLayout.keys.renderType) {
    if (value === NodeDefLayout.renderType.table) {
      // Render mode table
      // Assoc layout children
      const nodeDefChildren = Survey.getNodeDefChildren(nodeDef)(survey)
      nodeDefLayout = NodeDefLayout.assocLayoutChildren(
        surveyCycleKey,
        R.map(NodeDef.getUuid, nodeDefChildren)
      )(nodeDefLayout)
    } else {
      // Render mode form
      // Dissoc layoutChildren (applicable only if render mode is table)
      nodeDefLayout = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(nodeDefLayout)
      // Entity rendered as form can only exists in its own page
      if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        nodeDefLayout = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayout)
      }
    }
  }
  return nodeDefLayout
}
