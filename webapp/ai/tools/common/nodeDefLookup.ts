/**
 * Node definition lookup by name for every area. The model refers to node definitions by name; names are resolved by
 * scanning the array, because the name index of a draft survey may be stale after a rename, and only current node
 * definitions count (a deleted one is not there for the user).
 */
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

export type NodeDefLookupOptions = {
  // analysis attributes exist only for the users who see the analysis (default false)
  includeAnalysis?: boolean
}

/**
 * Returns true for the node definitions a tool may name: not deleted, virtual or a layout element, and not an
 * analysis one unless asked.
 * @returns {boolean} True when the tool may name it.
 */
export const isCurrentNodeDef = (nodeDef: any, { includeAnalysis = false }: NodeDefLookupOptions = {}): boolean =>
  !NodeDef.isDeleted(nodeDef) &&
  !NodeDef.isVirtual(nodeDef) &&
  !NodeDef.isLayoutElement(nodeDef) &&
  (includeAnalysis || !NodeDef.isAnalysis(nodeDef))

export const getCurrentNodeDefs = (survey: any, options: NodeDefLookupOptions = {}): any[] =>
  Survey.getNodeDefsArray(survey).filter((nodeDef: any) => isCurrentNodeDef(nodeDef, options))

export const findNodeDefByName = (survey: any, name: string, options: NodeDefLookupOptions = {}): any =>
  getCurrentNodeDefs(survey, options).find((nodeDef: any) => NodeDef.getName(nodeDef) === name) ?? null
