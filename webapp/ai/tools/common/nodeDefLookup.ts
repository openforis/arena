/**
 * Node definition lookup by name for every area. The model refers to node definitions by name; names are resolved by
 * scanning the array, because the name index of a draft survey may be stale after a rename, and only current node
 * definitions count (a deleted one is not there for the user).
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export type NodeDefLookupOptions = {
  // analysis attributes exist only for the users who see the analysis (default false)
  includeAnalysis?: boolean
}

/**
 * Returns true for the node definitions a tool may name: not deleted, virtual or a layout element, and not an
 * analysis one unless asked.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefLookupOptions} [options] - Options.
 * @returns {boolean} True when the tool may name it.
 */
export const isCurrentNodeDef = (nodeDef: any, { includeAnalysis = false }: NodeDefLookupOptions = {}): boolean =>
  !NodeDef.isDeleted(nodeDef) &&
  !NodeDef.isVirtual(nodeDef) &&
  !NodeDef.isLayoutElement(nodeDef) &&
  (includeAnalysis || !NodeDef.isAnalysis(nodeDef))

/**
 * Returns the current node definitions of the survey.
 * @param {object} survey - Survey.
 * @param {NodeDefLookupOptions} [options] - Options.
 * @returns {object[]} The node definitions.
 */
export const getCurrentNodeDefs = (survey: any, options: NodeDefLookupOptions = {}): any[] =>
  Survey.getNodeDefsArray(survey).filter((nodeDef: any) => isCurrentNodeDef(nodeDef, options))

/**
 * Returns the current node definition with the given name, or null.
 * @param {object} survey - Survey.
 * @param {string} name - Name.
 * @param {NodeDefLookupOptions} [options] - Options.
 * @returns {object|null} The node definition.
 */
export const findNodeDefByName = (survey: any, name: string, options: NodeDefLookupOptions = {}): any | null =>
  getCurrentNodeDefs(survey, options).find((nodeDef: any) => NodeDef.getName(nodeDef) === name) ?? null
