/**
 * Pure versions of the form designer's edit guards on a node definition's `multiple` and `key` props, shared by the
 * designer hooks and the assistant's change set validation.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

/**
 * Tells whether a node definition is locked by publication: it was published and the survey is not a template.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node definition.
 * @returns {boolean} True when published and not in a template.
 */
export const isLockedByPublication = ({ survey, nodeDef }: { survey: any; nodeDef: any }): boolean =>
  NodeDef.isPublished(nodeDef) && !Survey.isTemplate(Survey.getSurveyInfo(survey))

/**
 * Returns the reference props of a props update (category of a code attribute, taxonomy of a taxon attribute) that
 * the designer would not let change: a published attribute keeps its category and taxonomy (except in a template),
 * because its records already hold values of them. A value equal to the current one is not a change.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node definition before the update.
 * @param {object} params.props - Props about to be saved.
 * @returns {string[]} The locked props that change, in `categoryUuid`, `taxonomyUuid` order.
 */
export const getLockedRefPropsChanged = ({
  survey,
  nodeDef,
  props,
}: {
  survey: any
  nodeDef: any
  props: Record<string, unknown>
}): string[] => {
  if (!nodeDef || !isLockedByPublication({ survey, nodeDef })) return []
  const current: Record<string, unknown> = {
    [NodeDef.propKeys.categoryUuid]: NodeDef.getCategoryUuid(nodeDef) ?? null,
    [NodeDef.propKeys.taxonomyUuid]: NodeDef.getTaxonomyUuid(nodeDef) ?? null,
  }
  return Object.keys(current).filter((key) => key in props && (props[key] ?? null) !== current[key])
}

/**
 * Tells whether the designer disables the "multiple" control of a node definition.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node definition (undefined: disabled).
 * @param {string} params.cycle - Cycle key.
 * @returns {boolean} True when "multiple" cannot be edited.
 */
export const isMultipleEditDisabled = ({
  survey,
  nodeDef,
  cycle,
}: {
  survey: any
  nodeDef: any
  cycle: string
}): boolean =>
  !nodeDef ||
  isLockedByPublication({ survey, nodeDef }) ||
  NodeDef.isKey(nodeDef) ||
  NodeDefLayout.isRenderTable(cycle)(nodeDef) ||
  Survey.isNodeDefParentCode(nodeDef)(survey) ||
  NodeDef.isReadOnly(nodeDef) ||
  NodeDef.isAnalysis(nodeDef)

/**
 * Tells whether the maximum number of key attributes of the parent entity is reached.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node definition.
 * @returns {boolean} True when reached.
 */
export const isMaxKeysCountReached = ({ survey, nodeDef }: { survey: any; nodeDef: any }): boolean => {
  if (!nodeDef) return false
  const parentDef = Survey.getNodeDefParent(nodeDef)(survey)
  if (!parentDef) return false
  return Survey.getNodeDefKeys(parentDef)(survey).length >= NodeDef.maxKeyAttributes
}

/**
 * Tells whether the designer disables the "key" control of a node definition.
 * @param {object} params - Parameters.
 * @param {object} params.nodeDef - Node definition (undefined: disabled).
 * @param {boolean} params.maxKeysCountReached - Whether the parent entity has the maximum number of keys.
 * @returns {boolean} True when "key" cannot be edited.
 */
export const isKeyEditDisabled = ({
  nodeDef,
  maxKeysCountReached,
}: {
  nodeDef: any
  maxKeysCountReached: boolean
}): boolean => {
  if (!nodeDef || NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)) return true
  return NodeDef.isAutoIncrementalKey(nodeDef) || (!NodeDef.isKey(nodeDef) && maxKeysCountReached)
}
