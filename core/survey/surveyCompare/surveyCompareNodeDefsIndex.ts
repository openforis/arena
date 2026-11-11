import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export interface NodeDefsIndex {
  survey: any
  root: any
  byUuid: Record<string, any>
  childrenByParentUuid: Record<string, any[]>
  pathByUuid: Record<string, string>
}

// analysis node defs belong to processing chains, out of the comparison scope
const isComparable = (nodeDef: any): boolean =>
  !NodeDef.isAnalysis(nodeDef) && !NodeDef.isVirtual(nodeDef) && !NodeDef.isDeleted(nodeDef)

const compareByIdOrName = (nodeDefA: any, nodeDefB: any): number => {
  const idA = nodeDefA.id
  const idB = nodeDefB.id
  if (idA !== undefined && idB !== undefined && idA !== idB) return idA - idB
  return String(NodeDef.getName(nodeDefA)).localeCompare(String(NodeDef.getName(nodeDefB)))
}

/**
 * Indexes the comparable node defs of a survey (hierarchy and name paths).
 * @param {any} survey - The survey.
 * @returns {NodeDefsIndex} - The node defs index.
 */
export const buildNodeDefsIndex = (survey: any): NodeDefsIndex => {
  const nodeDefs = Survey.getNodeDefsArray(survey).filter(isComparable)
  const byUuid: Record<string, any> = {}
  const childrenByParentUuid: Record<string, any[]> = {}
  let root = null
  for (const nodeDef of nodeDefs) {
    byUuid[NodeDef.getUuid(nodeDef)] = nodeDef
    const parentUuid = NodeDef.getParentUuid(nodeDef)
    if (parentUuid) {
      const siblings = childrenByParentUuid[parentUuid] ?? []
      siblings.push(nodeDef)
      childrenByParentUuid[parentUuid] = siblings
    } else {
      root = nodeDef
    }
  }
  for (const children of Object.values(childrenByParentUuid)) {
    children.sort(compareByIdOrName)
  }
  const pathByUuid: Record<string, string> = {}
  const visit = (nodeDef: any, parentPath: string | null): void => {
    const path = parentPath === null ? NodeDef.getName(nodeDef) : `${parentPath}/${NodeDef.getName(nodeDef)}`
    const uuid = NodeDef.getUuid(nodeDef)
    pathByUuid[uuid] = path
    for (const child of childrenByParentUuid[uuid] ?? []) {
      visit(child, path)
    }
  }
  if (root) visit(root, null)

  return { survey, root, byUuid, childrenByParentUuid, pathByUuid }
}

export const getChildren = (index: NodeDefsIndex, nodeDefUuid: string): any[] =>
  index.childrenByParentUuid[nodeDefUuid] ?? []

export const getNameByUuid = (index: NodeDefsIndex, uuid: string): string => {
  const nodeDef = index.byUuid[uuid]
  return nodeDef ? NodeDef.getName(nodeDef) : uuid
}
