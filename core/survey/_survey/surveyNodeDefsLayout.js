import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyNodeDefs from './surveyNodeDefs'

export const updateLayoutProp = (surveyCycleKey, nodeDef, key, value) => (survey) => {
  let nodeDefLayout = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
  )(nodeDef)

  // If setting layout render mode (table | form), set the the proper layout
  if (NodeDef.isEntity(nodeDef) && key === NodeDefLayout.keys.renderType) {
    if (value === NodeDefLayout.renderType.table) {
      // Render mode table
      // Assoc layout children
      const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)
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
  const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayout)(nodeDef)
  return SurveyNodeDefs.assocNodeDef(nodeDefUpdated)(survey)
}
