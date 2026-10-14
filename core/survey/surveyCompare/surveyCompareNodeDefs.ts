import * as NodeDef from '@core/survey/nodeDef'

import {
  SurveyCompareMatchType,
  SurveyCompareMatchTypeValue,
  SurveyCompareNodeDefDiff,
  SurveyComparePropDiff,
  SurveyComparePropGroup,
  SurveyCompareStatus,
} from './surveyCompareTypes'
import { NodeDefsIndex, getChildren } from './surveyCompareNodeDefsIndex'
import { normalizeNodeDef } from './surveyCompareNodeDefNormalizer'
import { getDifferentKeys } from './surveyCompareValues'

export interface NodeDefMatches {
  /** Target node def uuid by source node def uuid. */
  targetUuidBySourceUuid: Record<string, string>
  matchedByBySourceUuid: Record<string, SurveyCompareMatchTypeValue>
  /** Source node def uuid by target node def uuid. */
  sourceUuidByTargetUuid: Record<string, string>
}

export const nodeDefChangeId = (uuid: string): string => `nodeDef:${uuid}`

const addMatch = ({ matches, sourceUuid, targetUuid, matchedBy }) => {
  matches.targetUuidBySourceUuid[sourceUuid] = targetUuid
  matches.sourceUuidByTargetUuid[targetUuid] = sourceUuid
  matches.matchedByBySourceUuid[sourceUuid] = matchedBy
}

// node defs not matched by uuid are matched by name, among the children of matched parents
const matchByName = ({ sourceIndex, targetIndex, matches, sourceNodeDef }) => {
  const sourceUuid = NodeDef.getUuid(sourceNodeDef)
  const targetUuid = matches.targetUuidBySourceUuid[sourceUuid]
  if (targetUuid) {
    const targetChildren = getChildren(targetIndex, targetUuid)
    for (const sourceChild of getChildren(sourceIndex, sourceUuid)) {
      const sourceChildUuid = NodeDef.getUuid(sourceChild)
      if (matches.targetUuidBySourceUuid[sourceChildUuid]) continue
      const targetChild = targetChildren.find(
        (child) =>
          !matches.sourceUuidByTargetUuid[NodeDef.getUuid(child)] &&
          NodeDef.getName(child) === NodeDef.getName(sourceChild)
      )
      if (targetChild) {
        addMatch({
          matches,
          sourceUuid: sourceChildUuid,
          targetUuid: NodeDef.getUuid(targetChild),
          matchedBy: SurveyCompareMatchType.name,
        })
      }
    }
  }
  for (const sourceChild of getChildren(sourceIndex, sourceUuid)) {
    matchByName({ sourceIndex, targetIndex, matches, sourceNodeDef: sourceChild })
  }
}

/**
 * Matches the node defs of two surveys: by uuid first, then by name (among children of matched parents).
 * @param {object} params - The parameters.
 * @param {NodeDefsIndex} params.sourceIndex - Source survey node defs index.
 * @param {NodeDefsIndex} params.targetIndex - Target survey node defs index.
 * @returns {NodeDefMatches} - The matches.
 */
export const matchNodeDefs = ({
  sourceIndex,
  targetIndex,
}: {
  sourceIndex: NodeDefsIndex
  targetIndex: NodeDefsIndex
}): NodeDefMatches => {
  const matches: NodeDefMatches = { targetUuidBySourceUuid: {}, matchedByBySourceUuid: {}, sourceUuidByTargetUuid: {} }
  for (const sourceUuid of Object.keys(sourceIndex.pathByUuid)) {
    if (targetIndex.pathByUuid[sourceUuid]) {
      addMatch({ matches, sourceUuid, targetUuid: sourceUuid, matchedBy: SurveyCompareMatchType.uuid })
    }
  }
  const { root: sourceRoot } = sourceIndex
  const { root: targetRoot } = targetIndex
  if (sourceRoot && targetRoot && !matches.targetUuidBySourceUuid[NodeDef.getUuid(sourceRoot)]) {
    addMatch({
      matches,
      sourceUuid: NodeDef.getUuid(sourceRoot),
      targetUuid: NodeDef.getUuid(targetRoot),
      matchedBy: SurveyCompareMatchType.name,
    })
  }
  if (sourceRoot) {
    matchByName({ sourceIndex, targetIndex, matches, sourceNodeDef: sourceRoot })
  }
  return matches
}

const toPropDiffs = ({ source, target, group, cycle = undefined }): SurveyComparePropDiff[] =>
  getDifferentKeys({ source, target }).map((key) => ({
    key,
    group,
    ...(cycle === undefined ? {} : { cycle }),
    source: source?.[key],
    target: target?.[key],
  }))

const getLayoutPropDiffs = ({ sourceNormalized, targetNormalized }): SurveyComparePropDiff[] => {
  const sourceLayout = sourceNormalized.layoutByCycle
  const targetLayout = targetNormalized.layoutByCycle
  return getDifferentKeys({ source: sourceLayout, target: targetLayout }).map((cycle) => ({
    key: 'layout',
    group: SurveyComparePropGroup.layout,
    cycle,
    source: sourceLayout[cycle],
    target: targetLayout[cycle],
  }))
}

const getMovePropDiffs = ({ sourceNodeDef, targetNodeDef, sourceIndex, targetIndex, matches }) => {
  const sourceParentUuid = NodeDef.getParentUuid(sourceNodeDef)
  const targetParentUuid = NodeDef.getParentUuid(targetNodeDef)
  if (!sourceParentUuid || matches.targetUuidBySourceUuid[sourceParentUuid] === targetParentUuid) {
    return []
  }
  return [
    {
      key: 'parent',
      group: SurveyComparePropGroup.structure,
      source: sourceIndex.pathByUuid[sourceParentUuid],
      target: targetIndex.pathByUuid[targetParentUuid],
    },
  ]
}

/**
 * Computes the differences between two matched node defs.
 * @param {object} params - The parameters.
 * @returns {SurveyComparePropDiff[]} - The prop differences.
 */
export const getNodeDefPropDiffs = ({
  sourceNodeDef,
  targetNodeDef,
  sourceIndex,
  targetIndex,
  matches,
}): SurveyComparePropDiff[] => {
  const sourceNormalized = normalizeNodeDef({ index: sourceIndex, nodeDef: sourceNodeDef })
  const targetNormalized = normalizeNodeDef({ index: targetIndex, nodeDef: targetNodeDef })
  return [
    ...toPropDiffs({
      source: sourceNormalized.structure,
      target: targetNormalized.structure,
      group: SurveyComparePropGroup.structure,
    }),
    ...getMovePropDiffs({ sourceNodeDef, targetNodeDef, sourceIndex, targetIndex, matches }),
    ...toPropDiffs({
      source: sourceNormalized.props,
      target: targetNormalized.props,
      group: SurveyComparePropGroup.props,
    }),
    ...toPropDiffs({
      source: sourceNormalized.propsAdvanced,
      target: targetNormalized.propsAdvanced,
      group: SurveyComparePropGroup.propsAdvanced,
    }),
    ...getLayoutPropDiffs({ sourceNormalized, targetNormalized }),
  ]
}

const newNodeDefDiff = ({ nodeDef, path, status, parentId, depth, sourceUuid, targetUuid, matchedBy, propDiffs }) => ({
  id: nodeDefChangeId(sourceUuid ?? targetUuid),
  sourceUuid,
  targetUuid,
  matchedBy,
  name: NodeDef.getName(nodeDef),
  type: NodeDef.getType(nodeDef),
  path,
  status,
  parentId,
  depth,
  propDiffs,
  layoutOnly: propDiffs.length > 0 && propDiffs.every((propDiff) => propDiff.group === SurveyComparePropGroup.layout),
  hasDifferences: status !== SurveyCompareStatus.identical,
  dependsOn: [],
  linkedTo: [],
})

const visitRemoved = ({ context, targetNodeDef, parentId, depth }) => {
  const { targetIndex, matches, result } = context
  const targetUuid = NodeDef.getUuid(targetNodeDef)
  const diff = newNodeDefDiff({
    nodeDef: targetNodeDef,
    path: targetIndex.pathByUuid[targetUuid],
    status: SurveyCompareStatus.removed,
    parentId,
    depth,
    sourceUuid: undefined,
    targetUuid,
    matchedBy: undefined,
    propDiffs: [],
  })
  result.push(diff)
  for (const child of getChildren(targetIndex, targetUuid)) {
    if (!matches.sourceUuidByTargetUuid[NodeDef.getUuid(child)]) {
      visitRemoved({ context, targetNodeDef: child, parentId: diff.id, depth: depth + 1 })
    }
  }
}

const visitSource = ({ context, sourceNodeDef, parentId, depth }) => {
  const { sourceIndex, targetIndex, matches, result } = context
  const sourceUuid = NodeDef.getUuid(sourceNodeDef)
  const targetUuid = matches.targetUuidBySourceUuid[sourceUuid]
  const targetNodeDef = targetUuid ? targetIndex.byUuid[targetUuid] : null
  const propDiffs = targetNodeDef
    ? getNodeDefPropDiffs({ sourceNodeDef, targetNodeDef, sourceIndex, targetIndex, matches })
    : []
  let status: string = SurveyCompareStatus.added
  if (targetNodeDef) {
    status = propDiffs.length > 0 ? SurveyCompareStatus.changed : SurveyCompareStatus.identical
  }
  const diff = newNodeDefDiff({
    nodeDef: sourceNodeDef,
    path: sourceIndex.pathByUuid[sourceUuid],
    status,
    parentId,
    depth,
    sourceUuid,
    targetUuid,
    matchedBy: matches.matchedByBySourceUuid[sourceUuid],
    propDiffs,
  })
  result.push(diff)

  for (const child of getChildren(sourceIndex, sourceUuid)) {
    visitSource({ context, sourceNodeDef: child, parentId: diff.id, depth: depth + 1 })
  }
  if (targetUuid) {
    for (const targetChild of getChildren(targetIndex, targetUuid)) {
      if (!matches.sourceUuidByTargetUuid[NodeDef.getUuid(targetChild)]) {
        visitRemoved({ context, targetNodeDef: targetChild, parentId: diff.id, depth: depth + 1 })
      }
    }
  }
}

// marks parents of node defs with differences as having differences too
const rollUpDifferences = (diffs: SurveyCompareNodeDefDiff[]): void => {
  const diffsById = Object.fromEntries(diffs.map((diff) => [diff.id, diff]))
  for (const diff of [...diffs].reverse()) {
    if (diff.hasDifferences && diff.parentId) {
      diffsById[diff.parentId].hasDifferences = true
    }
  }
}

/**
 * Compares the node defs of two surveys.
 * Node defs are returned in hierarchical order (depth first), following the source survey hierarchy;
 * node defs only in the target survey are placed under their target parent.
 * @param {object} params - The parameters.
 * @param {NodeDefsIndex} params.sourceIndex - Source node defs index.
 * @param {NodeDefsIndex} params.targetIndex - Target node defs index.
 * @param {NodeDefMatches} params.matches - Node def matches.
 * @returns {SurveyCompareNodeDefDiff[]} - The node def diffs.
 */
export const compareNodeDefs = ({
  sourceIndex,
  targetIndex,
  matches,
}: {
  sourceIndex: NodeDefsIndex
  targetIndex: NodeDefsIndex
  matches: NodeDefMatches
}): SurveyCompareNodeDefDiff[] => {
  const result: SurveyCompareNodeDefDiff[] = []
  const context = { sourceIndex, targetIndex, matches, result }
  if (sourceIndex.root) {
    visitSource({ context, sourceNodeDef: sourceIndex.root, parentId: undefined, depth: 0 })
  }
  rollUpDifferences(result)
  return result
}
