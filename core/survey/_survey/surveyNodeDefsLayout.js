import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyNodeDefs from './surveyNodeDefs'

const _updateRenderType = ({ survey, surveyCycleKey, nodeDef, renderType, nodeDefLayout }) => {
  if (renderType === NodeDefLayout.renderType.table) {
    // Assoc layout children
    const nodeDefChildren = SurveyNodeDefs.getNodeDefChildren(nodeDef)(survey)
    return NodeDefLayout.assocLayoutChildren(surveyCycleKey, R.map(NodeDef.getUuid, nodeDefChildren))(nodeDefLayout)
  }

  if (renderType === NodeDefLayout.renderType.form) {
    const nodeDefLayoutUpdated = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(nodeDefLayout)
    // Entity rendered as form can only exists in its own page
    if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
      return NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayoutUpdated)
    }
    return nodeDefLayoutUpdated
  }

  return nodeDefLayout
}

export const updateNodeDefLayoutProp = ({ surveyCycleKey, nodeDef, key, value }) => (survey) => {
  let nodeDefLayoutUpdated = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
  )(nodeDef)

  if (key === NodeDefLayout.keys.renderType && NodeDef.isEntity(nodeDef))
    nodeDefLayoutUpdated = _updateRenderType({
      survey,
      surveyCycleKey,
      nodeDef,
      nodeDefLayout: nodeDefLayoutUpdated,
      renderType: value,
    })

  const nodeDefUpdated = NodeDefLayout.assocLayout(nodeDefLayoutUpdated)(nodeDef)
  return SurveyNodeDefs.assocNodeDef(nodeDefUpdated)(survey)
}
