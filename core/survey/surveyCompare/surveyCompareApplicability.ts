import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import {
  SurveyCompareApplicabilityStatus,
  SurveyCompareCategoryDiff,
  SurveyCompareNodeDefDiff,
  SurveyComparePropGroup,
  SurveyCompareReason,
  SurveyCompareReasonValue,
  SurveyCompareStatus,
  SurveyCompareTaxonomyDiff,
} from './surveyCompareTypes'
import { NodeDefsIndex, getChildren } from './surveyCompareNodeDefsIndex'
import { NodeDefMatches, nodeDefChangeId } from './surveyCompareNodeDefs'

export interface ApplicabilityContext {
  sourceSurvey: any
  targetSurvey: any
  sourceIndex: NodeDefsIndex
  targetIndex: NodeDefsIndex
  matches: NodeDefMatches
  categoryDiffBySourceUuid: Record<string, SurveyCompareCategoryDiff>
  taxonomyDiffBySourceUuid: Record<string, SurveyCompareTaxonomyDiff>
  targetTemplate: boolean
  targetCycleKeys: string[]
  /** Id of the survey info change adding the missing cycles (if any). */
  cyclesChangeId?: string
  /** Cycles of the source survey (added to the target by the cycles change). */
  sourceCycleKeys: string[]
}

interface ApplicabilityCheck {
  errors: Set<SurveyCompareReasonValue>
  warnings: Set<SurveyCompareReasonValue>
  dependsOn: Set<string>
}

const notApplicableReasonByPublishedProp = {
  [NodeDef.propKeys.multiple]: SurveyCompareReason.publishedMultipleChanged,
  [NodeDef.propKeys.key]: SurveyCompareReason.publishedKeyChanged,
  [NodeDef.propKeys.categoryUuid]: SurveyCompareReason.publishedCategoryChanged,
  [NodeDef.propKeys.taxonomyUuid]: SurveyCompareReason.publishedTaxonomyChanged,
}

// cycles missing in the target survey can be added by the survey info change
const checkCyclesExist = ({
  check,
  context,
  cycles,
}: {
  check: ApplicabilityCheck
  context: ApplicabilityContext
  cycles: string[]
}) => {
  const missing = cycles.filter((cycle) => !context.targetCycleKeys.includes(cycle))
  if (missing.length === 0) return
  if (context.cyclesChangeId && missing.every((cycle) => context.sourceCycleKeys.includes(cycle))) {
    check.dependsOn.add(context.cyclesChangeId)
  } else {
    check.errors.add(SurveyCompareReason.cycleMissing)
  }
}

const checkCycles = ({ check, context, sourceNodeDef, targetNodeDef, published }) => {
  const sourceCycles: string[] = NodeDef.getCycles(sourceNodeDef)
  checkCyclesExist({ check, context, cycles: sourceCycles })
  if (published && NodeDef.getCycles(targetNodeDef).some((cycle: string) => !sourceCycles.includes(cycle))) {
    check.warnings.add(SurveyCompareReason.publishedCyclesRemoved)
  }
}

const checkNodeDefReference = ({ check, context, sourceUuid }) => {
  if (sourceUuid && !context.matches.targetUuidBySourceUuid[sourceUuid]) {
    if (context.sourceIndex.byUuid[sourceUuid]) {
      check.dependsOn.add(nodeDefChangeId(sourceUuid))
    } else {
      check.errors.add(SurveyCompareReason.parentMissing)
    }
  }
}

const checkCategoryReference = ({ check, context, sourceNodeDef }) => {
  const categoryUuid = NodeDef.getCategoryUuid(sourceNodeDef)
  if (!categoryUuid) return
  const categoryDiff = context.categoryDiffBySourceUuid[categoryUuid]
  if (!categoryDiff) {
    check.errors.add(SurveyCompareReason.categoryMissing)
  } else if (categoryDiff.status === SurveyCompareStatus.added) {
    check.dependsOn.add(categoryDiff.id)
  }
}

const checkTaxonomyReference = ({ check, context, sourceNodeDef }) => {
  const taxonomyUuid = NodeDef.getTaxonomyUuid(sourceNodeDef)
  if (!taxonomyUuid) return
  const taxonomyDiff = context.taxonomyDiffBySourceUuid[taxonomyUuid]
  if (!taxonomyDiff) {
    check.errors.add(SurveyCompareReason.taxonomyMissing)
  } else if (taxonomyDiff.status === SurveyCompareStatus.added) {
    check.dependsOn.add(taxonomyDiff.id)
  }
}

const checkReferences = ({ check, context, sourceNodeDef }) => {
  checkCategoryReference({ check, context, sourceNodeDef })
  checkTaxonomyReference({ check, context, sourceNodeDef })
  checkNodeDefReference({ check, context, sourceUuid: NodeDef.getParentCodeDefUuid(sourceNodeDef) })
}

const checkAdded = ({ check, context, diff }) => {
  const sourceNodeDef = context.sourceIndex.byUuid[diff.sourceUuid]
  checkNodeDefReference({ check, context, sourceUuid: NodeDef.getParentUuid(sourceNodeDef) })
  checkCycles({ check, context, sourceNodeDef, targetNodeDef: null, published: false })
  checkReferences({ check, context, sourceNodeDef })
}

// a node def can be moved only when not published; its new parent must exist or be added together with it
const checkMove = ({ check, context, sourceNodeDef, published }) => {
  if (published) {
    check.errors.add(SurveyCompareReason.publishedMoveNotSupported)
  }
  checkNodeDefReference({ check, context, sourceUuid: NodeDef.getParentUuid(sourceNodeDef) })
}

const checkChangedPropDiff = ({ check, context, sourceNodeDef, targetNodeDef, published, propDiff }) => {
  const { key, group } = propDiff
  if (group === SurveyComparePropGroup.structure) {
    if (key === 'parent') {
      checkMove({ check, context, sourceNodeDef, published })
    } else if (published) {
      check.errors.add(SurveyCompareReason.publishedTypeChanged)
    }
    return
  }
  if (group !== SurveyComparePropGroup.props) return
  const publishedReason = notApplicableReasonByPublishedProp[key]
  if (published && publishedReason) {
    check.errors.add(publishedReason)
  } else if (published && key === NodeDef.propKeys.name) {
    check.warnings.add(SurveyCompareReason.publishedNameChanged)
  } else if (key === NodeDef.propKeys.cycles) {
    checkCycles({ check, context, sourceNodeDef, targetNodeDef, published })
  }
}

const checkChanged = ({ check, context, diff }) => {
  const sourceNodeDef = context.sourceIndex.byUuid[diff.sourceUuid]
  const targetNodeDef = context.targetIndex.byUuid[diff.targetUuid]
  const published = NodeDef.isPublished(targetNodeDef) && !context.targetTemplate
  // layouts of cycles missing in the target survey are applied only when the cycles are added
  const hasDiffsInExistingCycles = diff.propDiffs.some(
    ({ group, cycle }) => group !== SurveyComparePropGroup.layout || context.targetCycleKeys.includes(cycle)
  )
  if (!hasDiffsInExistingCycles) {
    checkCyclesExist({ check, context, cycles: diff.propDiffs.map(({ cycle }) => cycle) })
  }
  for (const propDiff of diff.propDiffs) {
    checkChangedPropDiff({ check, context, sourceNodeDef, targetNodeDef, published, propDiff })
  }
  checkReferences({ check, context, sourceNodeDef })
}

const getTargetDependentUuids = ({ context, targetUuid }): string[] => {
  try {
    return Survey.getNodeDefDependentsUuids(targetUuid)(context.targetSurvey)
  } catch {
    return [] // dependency graph not available
  }
}

// a node def only in the target survey is deleted together with its descendants
const checkRemoved = ({ check, context, diff, diffsById }) => {
  const targetNodeDef = context.targetIndex.byUuid[diff.targetUuid]
  if (NodeDef.isPublished(targetNodeDef) && !context.targetTemplate) {
    check.warnings.add(SurveyCompareReason.publishedNodeDefDeleted)
  }
  for (const child of getChildren(context.targetIndex, diff.targetUuid)) {
    const childUuid = NodeDef.getUuid(child)
    const childSourceUuid = context.matches.sourceUuidByTargetUuid[childUuid]
    // a child matched elsewhere must be moved before its parent is deleted
    check.dependsOn.add(nodeDefChangeId(childSourceUuid ?? childUuid))
  }
  const usedByOthers = getTargetDependentUuids({ context, targetUuid: diff.targetUuid }).some((dependentUuid) => {
    if (dependentUuid === diff.targetUuid) return false
    const sourceUuid = context.matches.sourceUuidByTargetUuid[dependentUuid]
    return sourceUuid || diffsById[nodeDefChangeId(dependentUuid)]?.status !== SurveyCompareStatus.removed
  })
  if (usedByOthers) {
    check.warnings.add(SurveyCompareReason.nodeDefUsedByOthers)
  }
}

const toApplicability = (check: ApplicabilityCheck) => {
  if (check.errors.size > 0) {
    return { status: SurveyCompareApplicabilityStatus.notApplicable, reasons: [...check.errors] }
  }
  if (check.warnings.size > 0) {
    return { status: SurveyCompareApplicabilityStatus.applicableWithWarning, reasons: [...check.warnings] }
  }
  return { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] }
}

const checkNodeDefDiff = ({
  context,
  diff,
  diffsById,
}: {
  context: ApplicabilityContext
  diff: SurveyCompareNodeDefDiff
  diffsById: Record<string, any>
}) => {
  const check: ApplicabilityCheck = { errors: new Set(), warnings: new Set(), dependsOn: new Set() }
  if (diff.status === SurveyCompareStatus.added) {
    checkAdded({ check, context, diff })
  } else if (diff.status === SurveyCompareStatus.changed) {
    checkChanged({ check, context, diff })
  } else {
    checkRemoved({ check, context, diff, diffsById })
  }
  diff.applicability = toApplicability(check)
  diff.dependsOn = [...check.dependsOn]
}

// a changed or added node def whose expressions reference an added node def can be applied only together with it
const addExpressionDependencies = ({ context, diffsById }) => {
  for (const diff of Object.values(diffsById) as SurveyCompareNodeDefDiff[]) {
    if (diff.status !== SurveyCompareStatus.added) continue
    let dependentUuids: string[] = []
    try {
      dependentUuids = Survey.getNodeDefDependentsUuids(diff.sourceUuid)(context.sourceSurvey)
    } catch {
      // dependency graph not available
    }
    for (const dependentUuid of dependentUuids) {
      const dependentDiff = diffsById[nodeDefChangeId(dependentUuid)]
      if (
        dependentDiff &&
        dependentDiff !== diff &&
        [SurveyCompareStatus.added, SurveyCompareStatus.changed].includes(dependentDiff.status) &&
        !dependentDiff.dependsOn.includes(diff.id)
      ) {
        dependentDiff.dependsOn.push(diff.id)
      }
    }
  }
}

// parent layout changes are selected together with the added children they contain
const addLinks = ({ context, diffsById }) => {
  for (const diff of Object.values(diffsById) as SurveyCompareNodeDefDiff[]) {
    if (diff.status !== SurveyCompareStatus.added || !diff.parentId) continue
    const parentDiff = diffsById[diff.parentId]
    const parentLayoutChanged = parentDiff?.propDiffs.some(
      (propDiff) => propDiff.group === SurveyComparePropGroup.layout
    )
    if (parentDiff?.status === SurveyCompareStatus.changed && parentLayoutChanged) {
      diff.linkedTo.push(parentDiff.id)
    }
  }
  return context
}

// a category (or taxonomy) only in the target survey can be deleted only together with the node defs using it
const checkReferencedItemRemoval = ({ context, diff, getReferenceUuid, inUseReason, diffsById }) => {
  const usingNodeDefs = Object.values(context.targetIndex.byUuid).filter(
    (nodeDef) => getReferenceUuid(nodeDef) === diff.targetUuid
  )
  const dependsOn = []
  let inUse = false
  for (const nodeDef of usingNodeDefs) {
    const nodeDefDiff = diffsById[nodeDefChangeId(NodeDef.getUuid(nodeDef))]
    if (nodeDefDiff?.status === SurveyCompareStatus.removed) {
      dependsOn.push(nodeDefDiff.id)
    } else {
      inUse = true
    }
  }
  diff.dependsOn = dependsOn
  diff.applicability = inUse
    ? { status: SurveyCompareApplicabilityStatus.notApplicable, reasons: [inUseReason] }
    : { status: SurveyCompareApplicabilityStatus.applicable, reasons: [] }
}

const checkRemovedCategoriesAndTaxonomies = ({ context, categoryDiffs, taxonomyDiffs, diffsById }) => {
  for (const diff of categoryDiffs) {
    if (diff.status !== SurveyCompareStatus.removed) continue
    checkReferencedItemRemoval({
      context,
      diff,
      getReferenceUuid: NodeDef.getCategoryUuid,
      inUseReason: SurveyCompareReason.categoryInUse,
      diffsById,
    })
  }
  for (const diff of taxonomyDiffs) {
    if (diff.status !== SurveyCompareStatus.removed) continue
    checkReferencedItemRemoval({
      context,
      diff,
      getReferenceUuid: NodeDef.getTaxonomyUuid,
      inUseReason: SurveyCompareReason.taxonomyInUse,
      diffsById,
    })
  }
}

const propagateNotApplicable = (diffsById: Record<string, any>) => {
  let changed = true
  while (changed) {
    changed = false
    for (const diff of Object.values(diffsById)) {
      const { applicability } = diff
      if (!applicability || applicability.status === SurveyCompareApplicabilityStatus.notApplicable) continue
      const blocked = diff.dependsOn.some(
        (id: string) => diffsById[id]?.applicability?.status === SurveyCompareApplicabilityStatus.notApplicable
      )
      if (blocked) {
        diff.applicability = {
          status: SurveyCompareApplicabilityStatus.notApplicable,
          reasons: [SurveyCompareReason.dependencyNotApplicable],
        }
        changed = true
      }
    }
  }
}

/**
 * Sets applicability, dependencies and links of node def, category and taxonomy diffs (diffs are modified in place).
 * @param {object} params - The parameters.
 * @param {ApplicabilityContext} params.context - The applicability context.
 * @param {SurveyCompareNodeDefDiff[]} params.nodeDefDiffs - Node def diffs.
 * @param {SurveyCompareCategoryDiff[]} params.categoryDiffs - Category diffs.
 * @param {SurveyCompareTaxonomyDiff[]} params.taxonomyDiffs - Taxonomy diffs.
 * @param {any[]} params.otherChanges - Other changes the diffs can depend on (e.g. survey info).
 * @returns {void}
 */
export const evaluateApplicability = ({
  context,
  nodeDefDiffs,
  categoryDiffs,
  taxonomyDiffs,
  otherChanges,
}: {
  context: ApplicabilityContext
  nodeDefDiffs: SurveyCompareNodeDefDiff[]
  categoryDiffs: SurveyCompareCategoryDiff[]
  taxonomyDiffs: SurveyCompareTaxonomyDiff[]
  otherChanges: any[]
}): void => {
  const diffsById = Object.fromEntries(
    [...nodeDefDiffs, ...categoryDiffs, ...taxonomyDiffs, ...otherChanges].map((diff) => [diff.id, diff])
  )
  for (const diff of nodeDefDiffs) {
    if (diff.status !== SurveyCompareStatus.identical) {
      checkNodeDefDiff({ context, diff, diffsById })
    }
  }
  checkRemovedCategoriesAndTaxonomies({ context, categoryDiffs, taxonomyDiffs, diffsById })
  addExpressionDependencies({ context, diffsById })
  addLinks({ context, diffsById })
  propagateNotApplicable(diffsById)
}
