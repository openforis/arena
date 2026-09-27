/**
 * Rules about which node definitions can be used in a Data Explorer query:
 * which entities can be queried and, for a given entity, which attributes can be
 * selected (raw mode) or used as dimensions / measures (aggregate mode).
 *
 * Shared between the Data Explorer node defs selectors (webapp) and the AI data query generator (server)
 * so that both always agree on what makes a valid query.
 */
import type { NodeDef as ArenaNodeDef, NodeDefType, Survey as ArenaSurvey } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

type QueryNodeDef = ArenaNodeDef<NodeDefType>

/**
 * Returns true if the given node def can be used as a dimension in an aggregate query.
 * @param {object} nodeDef - The node definition.
 * @returns {boolean} - True if the node def can be used as a dimension.
 */
const isDimensionEligible = (nodeDef: QueryNodeDef): boolean =>
  NodeDef.isBoolean(nodeDef) || NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef) || NodeDef.isKey(nodeDef)

/**
 * Returns true if the given node def can be used as a measure in an aggregate query
 * (the entity frequency measure excluded).
 * @param {object} nodeDef - The node definition.
 * @returns {boolean} - True if the node def can be used as a measure.
 */
const isMeasureEligible = (nodeDef: QueryNodeDef): boolean =>
  (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) && !NodeDef.isKey(nodeDef)

/**
 * Returns true if the given node def is an entity that can be selected as the main entity of a query
 * (the root entity or a multiple entity).
 * @param {object} nodeDef - The node definition.
 * @returns {boolean} - True if the entity can be queried.
 */
const isQueryableEntity = (nodeDef: QueryNodeDef): boolean =>
  NodeDef.isEntity(nodeDef) && (NodeDef.isRoot(nodeDef) || !NodeDef.isSingleEntity(nodeDef))

const isInCycle = (cycle: string | null) => (nodeDef: QueryNodeDef) => !cycle || NodeDef.isInCycle(cycle)(nodeDef)

/**
 * Returns the entities that can be selected as the main entity of a query, in hierarchical order.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} [params.cycle] - The survey cycle.
 * @returns {object[]} - The queryable entity defs.
 */
const getQueryableEntityDefs = ({ survey, cycle = null }: { survey: ArenaSurvey; cycle?: string | null }) => {
  const result: QueryNodeDef[] = []
  const stack: QueryNodeDef[] = [Survey.getNodeDefRoot(survey)]
  while (stack.length > 0) {
    const nodeDef = stack.shift()
    if (isQueryableEntity(nodeDef) && isInCycle(cycle)(nodeDef)) {
      result.push(nodeDef)
    }
    if (!NodeDef.isVirtual(nodeDef)) {
      const childEntityDefs = Survey.getNodeDefChildrenSorted({ nodeDef, cycle })(survey).filter(NodeDef.isEntity)
      stack.unshift(...childEntityDefs)
    }
  }
  return result
}

/**
 * Returns the attribute defs that are descendants of the given entity def, including the ones inside single entities.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.entityDef - The entity def.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @param {boolean} [params.includeMultiple] - Whether to include multiple attributes.
 * @returns {object[]} - The attribute defs.
 */
const getAttributeDefsInSingleEntities = ({ survey, entityDef, cycle, includeAnalysis, includeMultiple }) =>
  Survey.getNodeDefDescendantsInSingleEntities({
    nodeDef: entityDef,
    includeAnalysis,
    cycle,
    sorted: true,
    filterFn: (nodeDef) =>
      NodeDef.isAttribute(nodeDef) && (includeMultiple || NodeDef.isSingle(nodeDef)) && isInCycle(cycle)(nodeDef),
  })(survey)

/**
 * Returns the attribute defs visible from the given entity def: the ones in the entity itself (and in its
 * descendant single entities) and the ones in the ancestor multiple entities.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.entityDef - The entity def.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @param {boolean} [params.includeMultiple] - Whether to include multiple attributes.
 * @returns {object[]} - The attribute defs.
 */
const getAttributeDefsInEntityAndAncestors = ({ survey, entityDef, cycle, includeAnalysis, includeMultiple }) => {
  const result: QueryNodeDef[] = []
  let entityDefCurrent = entityDef
  while (entityDefCurrent) {
    result.push(
      ...getAttributeDefsInSingleEntities({
        survey,
        entityDef: entityDefCurrent,
        cycle,
        includeAnalysis,
        includeMultiple,
      })
    )
    entityDefCurrent = NodeDef.isRoot(entityDefCurrent)
      ? null
      : Survey.getNodeDefAncestorMultipleEntity(entityDefCurrent)(survey)
  }
  return result
}

/**
 * Returns the attribute defs that can be selected in a raw mode query for the given entity.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.entityDef - The query entity def.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @returns {object[]} - The attribute defs.
 */
const getRawAttributeDefs = ({ survey, entityDef, cycle = null, includeAnalysis = false }) =>
  getAttributeDefsInEntityAndAncestors({ survey, entityDef, cycle, includeAnalysis, includeMultiple: true })

/**
 * Returns the attribute defs that can be used as dimensions in an aggregate query for the given entity.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.entityDef - The query entity def.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @returns {object[]} - The attribute defs.
 */
const getDimensionAttributeDefs = ({ survey, entityDef, cycle = null, includeAnalysis = false }) =>
  getAttributeDefsInEntityAndAncestors({ survey, entityDef, cycle, includeAnalysis, includeMultiple: false }).filter(
    isDimensionEligible
  )

/**
 * Returns the attribute defs that can be used as measures in an aggregate query for the given entity
 * (the entity frequency measure excluded).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {object} params.entityDef - The query entity def.
 * @param {string} [params.cycle] - The survey cycle.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @returns {object[]} - The attribute defs.
 */
const getMeasureAttributeDefs = ({ survey, entityDef, cycle = null, includeAnalysis = false }) =>
  Survey.getNodeDefChildrenSorted({ nodeDef: entityDef, cycle, includeAnalysis })(survey).filter(
    (nodeDef) =>
      NodeDef.isAttribute(nodeDef) &&
      NodeDef.isSingle(nodeDef) &&
      isInCycle(cycle)(nodeDef) &&
      isMeasureEligible(nodeDef)
  )

export const QueryNodeDefs = {
  isDimensionEligible,
  isMeasureEligible,
  isQueryableEntity,
  getQueryableEntityDefs,
  getRawAttributeDefs,
  getDimensionAttributeDefs,
  getMeasureAttributeDefs,
}
