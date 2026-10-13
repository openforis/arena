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
} from './surveyCompareTypes'
import { NodeDefsIndex } from './surveyCompareNodeDefsIndex'
import { NodeDefMatches, nodeDefChangeId } from './surveyCompareNodeDefs'

export interface ApplicabilityContext {
  sourceSurvey: any
  sourceIndex: NodeDefsIndex
  targetIndex: NodeDefsIndex
  matches: NodeDefMatches
  categoryDiffBySourceUuid: Record<string, SurveyCompareCategoryDiff>
  taxonomyTargetUuidBySourceUuid: Record<string, string>
  targetTemplate: boolean
  targetCycleKeys: string[]
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

const checkCycles = ({ check, context, sourceNodeDef, targetNodeDef, published }) => {
  const sourceCycles: string[] = NodeDef.getCycles(sourceNodeDef)
  if (sourceCycles.some((cycle) => !context.targetCycleKeys.includes(cycle))) {
    check.errors.add(SurveyCompareReason.cycleMissing)
  }
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
  if (taxonomyUuid && !context.taxonomyTargetUuidBySourceUuid[taxonomyUuid]) {
    check.errors.add(SurveyCompareReason.taxonomyMissing)
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

const checkChanged = ({ check, context, diff }) => {
  const sourceNodeDef = context.sourceIndex.byUuid[diff.sourceUuid]
  const targetNodeDef = context.targetIndex.byUuid[diff.targetUuid]
  const published = NodeDef.isPublished(targetNodeDef) && !context.targetTemplate
  for (const { key, group } of diff.propDiffs) {
    if (group === SurveyComparePropGroup.structure) {
      if (key === 'parent') {
        check.errors.add(SurveyCompareReason.moveNotSupported)
      } else if (published) {
        check.errors.add(SurveyCompareReason.publishedTypeChanged)
      }
    } else if (group === SurveyComparePropGroup.props) {
      const publishedReason = notApplicableReasonByPublishedProp[key]
      if (published && publishedReason) {
        check.errors.add(publishedReason)
      } else if (published && key === NodeDef.propKeys.name) {
        check.warnings.add(SurveyCompareReason.publishedNameChanged)
      } else if (key === NodeDef.propKeys.cycles) {
        checkCycles({ check, context, sourceNodeDef, targetNodeDef, published })
      }
    }
  }
  checkReferences({ check, context, sourceNodeDef })
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

const checkNodeDefDiff = ({ context, diff }: { context: ApplicabilityContext; diff: SurveyCompareNodeDefDiff }) => {
  const check: ApplicabilityCheck = { errors: new Set(), warnings: new Set(), dependsOn: new Set() }
  if (diff.status === SurveyCompareStatus.added) {
    checkAdded({ check, context, diff })
  } else if (diff.status === SurveyCompareStatus.changed) {
    checkChanged({ check, context, diff })
  } else {
    check.errors.add(SurveyCompareReason.removalNotSupported)
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
 * Sets applicability, dependencies and links of node def and category diffs (diffs are modified in place).
 * @param {object} params - The parameters.
 * @param {ApplicabilityContext} params.context - The applicability context.
 * @param {SurveyCompareNodeDefDiff[]} params.nodeDefDiffs - Node def diffs.
 * @param {SurveyCompareCategoryDiff[]} params.categoryDiffs - Category diffs.
 * @returns {void}
 */
export const evaluateApplicability = ({
  context,
  nodeDefDiffs,
  categoryDiffs,
}: {
  context: ApplicabilityContext
  nodeDefDiffs: SurveyCompareNodeDefDiff[]
  categoryDiffs: SurveyCompareCategoryDiff[]
}): void => {
  for (const diff of nodeDefDiffs) {
    if (diff.status !== SurveyCompareStatus.identical) {
      checkNodeDefDiff({ context, diff })
    }
  }
  const diffsById = Object.fromEntries([...nodeDefDiffs, ...categoryDiffs].map((diff) => [diff.id, diff]))
  addExpressionDependencies({ context, diffsById })
  addLinks({ context, diffsById })
  propagateNotApplicable(diffsById)
}
