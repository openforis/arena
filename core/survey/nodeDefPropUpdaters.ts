import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

// side effects of a prop change on the node def (shared by the form designer and the AI change sets);
// each takes the node def with the prop already set

export const onUpdateMultiple = ({ survey, surveyCycleKey, nodeDef, value: multiple }) => {
  // Reset validations required (or required if) or count
  const validations = NodeDef.getValidations(nodeDef)
  const validationsUpdated = multiple
    ? A.pipe(NodeDefValidations.dissocRequired, NodeDefValidations.dissocRequiredIf)(validations)
    : NodeDefValidations.dissocCount(validations)
  let nodeDefUpdated = NodeDef.assocValidations(validationsUpdated)(nodeDef)

  if (NodeDef.isEntity(nodeDefUpdated) && !multiple) {
    nodeDefUpdated = NodeDef.dissocEnumerate(nodeDefUpdated)
    nodeDefUpdated = NodeDef.mergePropsAdvanced({
      [NodeDef.keysPropsAdvanced.enumeratingItemsExpression]: null,
    })(nodeDefUpdated)

    if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefUpdated)) {
      const nodeDefsUpdated = Survey.updateLayoutProp({
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
        key: NodeDefLayout.keys.renderType,
        value: NodeDefLayout.renderType.form,
      })(survey)
      nodeDefUpdated = nodeDefsUpdated[nodeDef.uuid]
    }
  }
  return nodeDefUpdated
}

// key attributes are always required: "required if" doesn't apply to them
export const onUpdateKey = ({ nodeDef, value: key }) => {
  if (!key) return nodeDef
  const validations = NodeDef.getValidations(nodeDef)
  return NodeDef.assocValidations(NodeDefValidations.dissocRequiredIf(validations))(nodeDef)
}
