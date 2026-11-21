import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

// getNodeDefChildren is a JS function whose inferred parameter type lacks `nodeDef`.
type NodeDefChildrenParams = Parameters<typeof Survey.getNodeDefChildren>[0] & { nodeDef: unknown }

/**
 * Returns the node defs sharing the parent of the given one (the fields an expression can reference by name).
 * @param {object} params - Parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.nodeDef - The node def.
 * @returns {object[]} The sibling node defs (empty for the root).
 */
export const getSiblingNodeDefs = ({ survey, nodeDef }: { survey: any; nodeDef: any }): any[] => {
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)
  if (!parentNodeDef) return []
  const params: NodeDefChildrenParams = { nodeDef: parentNodeDef }
  return Survey.getNodeDefChildren(params)(survey).filter((nd) => NodeDef.getUuid(nd) !== NodeDef.getUuid(nodeDef))
}
