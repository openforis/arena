/** Max size of the survey file to compare: a survey exported with records and files is not accepted. */
export const SurveyCompareMaxFileSizeMB = 20

export const SurveyCompareStatus = {
  identical: 'identical',
  changed: 'changed',
  added: 'added', // only in the source (uploaded) survey
  removed: 'removed', // only in the target (open) survey
} as const

export type SurveyCompareStatusValue = (typeof SurveyCompareStatus)[keyof typeof SurveyCompareStatus]

export const SurveyCompareMatchType = {
  uuid: 'uuid',
  name: 'name',
  manual: 'manual', // confirmed by the user (e.g. a rename)
} as const

export type SurveyCompareMatchTypeValue = (typeof SurveyCompareMatchType)[keyof typeof SurveyCompareMatchType]

export const SurveyComparePropGroup = {
  props: 'props',
  propsAdvanced: 'propsAdvanced',
  layout: 'layout',
  structure: 'structure', // type, parent
} as const

export type SurveyComparePropGroupValue = (typeof SurveyComparePropGroup)[keyof typeof SurveyComparePropGroup]

export const SurveyCompareApplicabilityStatus = {
  applicable: 'applicable',
  applicableWithWarning: 'applicableWithWarning',
  notApplicable: 'notApplicable',
} as const

export type SurveyCompareApplicabilityStatusValue =
  (typeof SurveyCompareApplicabilityStatus)[keyof typeof SurveyCompareApplicabilityStatus]

/** Reason keys (i18n keys under surveyCompareView.reasons). */
export const SurveyCompareReason = {
  // not applicable
  categoryInUse: 'categoryInUse',
  categoryMissing: 'categoryMissing',
  cycleMissing: 'cycleMissing',
  dependencyNotApplicable: 'dependencyNotApplicable',
  parentMissing: 'parentMissing',
  publishedCategoryChanged: 'publishedCategoryChanged',
  publishedKeyChanged: 'publishedKeyChanged',
  publishedMoveNotSupported: 'publishedMoveNotSupported',
  publishedMultipleChanged: 'publishedMultipleChanged',
  publishedTaxonomyChanged: 'publishedTaxonomyChanged',
  publishedTypeChanged: 'publishedTypeChanged',
  taxonomyInUse: 'taxonomyInUse',
  taxonomyMissing: 'taxonomyMissing',
  // warnings
  nodeDefUsedByOthers: 'nodeDefUsedByOthers',
  publishedCategoryItemsKept: 'publishedCategoryItemsKept',
  publishedCategoryLevelsKept: 'publishedCategoryLevelsKept',
  publishedCyclesRemoved: 'publishedCyclesRemoved',
  publishedLanguagesRemoved: 'publishedLanguagesRemoved',
  publishedNameChanged: 'publishedNameChanged',
  publishedNodeDefDeleted: 'publishedNodeDefDeleted',
  publishedSurveyCyclesRemoved: 'publishedSurveyCyclesRemoved',
  publishedTaxaKept: 'publishedTaxaKept',
  publishedVernacularNamesKept: 'publishedVernacularNamesKept',
} as const

export type SurveyCompareReasonValue = (typeof SurveyCompareReason)[keyof typeof SurveyCompareReason]

export interface SurveyComparePropDiff {
  key: string
  group: SurveyComparePropGroupValue
  cycle?: string
  source?: unknown
  target?: unknown
}

export interface SurveyCompareApplicability {
  status: SurveyCompareApplicabilityStatusValue
  reasons: SurveyCompareReasonValue[]
}

/** A change that can be selected and applied. */
export interface SurveyCompareChange {
  /** Change id: used to select the change to apply. */
  id: string
  status: SurveyCompareStatusValue
  applicability?: SurveyCompareApplicability
  /** Changes that must be applied together with this one. */
  dependsOn: string[]
  /** Changes selected automatically together with this one (e.g. parent entity layout). */
  linkedTo: string[]
}

interface SurveyCompareItemBase extends SurveyCompareChange {
  sourceUuid?: string
  targetUuid?: string
  matchedBy?: SurveyCompareMatchTypeValue
  propDiffs: SurveyComparePropDiff[]
}

export interface SurveyCompareRenameCandidate {
  targetUuid: string
  name: string
  path: string
}

export interface SurveyCompareNodeDefDiff extends SurveyCompareItemBase {
  name: string
  type: string
  path: string
  parentId?: string
  depth: number
  /** True when only layout props differ. */
  layoutOnly: boolean
  /** True when this node def or any of its descendants differs. */
  hasDifferences: boolean
  /** Node def only in the target survey that could be the same node def renamed (added node defs only). */
  renameCandidate?: SurveyCompareRenameCandidate
}

export interface SurveyCompareChildItemDiff {
  status: SurveyCompareStatusValue
  propDiffs: SurveyComparePropDiff[]
  /** True when the item is only in the target survey and it has been published (it cannot be deleted). */
  published?: boolean
}

export interface SurveyCompareCategoryItemDiff extends SurveyCompareChildItemDiff {
  codePath: string[]
}

export interface SurveyCompareTaxonDiff extends SurveyCompareChildItemDiff {
  code: string
}

export interface SurveyCompareCounts {
  added: number
  changed: number
  removed: number
}

export interface SurveyCompareCategoryDiff extends SurveyCompareItemBase {
  name: string
  items: SurveyCompareCategoryItemDiff[]
  itemsCount: SurveyCompareCounts
  /** Removal of the items (and levels) only in the target survey: a separate change, never selected by default. */
  removal?: SurveyCompareChange
}

export interface SurveyCompareTaxonomyDiff extends SurveyCompareItemBase {
  name: string
  taxa: SurveyCompareTaxonDiff[]
  taxaCount: SurveyCompareCounts
  /** Removal of the taxa (and vernacular names) only in the target survey: a separate change. */
  removal?: SurveyCompareChange
}

export interface SurveyCompareSurveyInfoDiff extends SurveyCompareItemBase {
  key: string
}

export interface SurveyCompareSurveyFileDiff extends SurveyCompareItemBase {
  name: string
  fileType: string
}

export interface SurveyCompareResult {
  identical: boolean
  surveyInfo: SurveyCompareSurveyInfoDiff[]
  surveyFiles: SurveyCompareSurveyFileDiff[]
  nodeDefs: SurveyCompareNodeDefDiff[]
  categories: SurveyCompareCategoryDiff[]
  taxonomies: SurveyCompareTaxonomyDiff[]
  counts: {
    nodeDefs: SurveyCompareCounts
    categories: SurveyCompareCounts
    taxonomies: SurveyCompareCounts
    surveyFiles: SurveyCompareCounts
  }
}

/** Category items indexed by category uuid. */
export type CategoryItemsByCategoryUuid = Record<string, any[]>

/** Taxa (with vernacular names) indexed by taxonomy uuid. */
export type TaxaByTaxonomyUuid = Record<string, any[]>

export interface SurveyCompareParams {
  sourceSurvey: any
  targetSurvey: any
  sourceItemsByCategoryUuid: CategoryItemsByCategoryUuid
  targetItemsByCategoryUuid: CategoryItemsByCategoryUuid
  sourceTaxaByTaxonomyUuid?: TaxaByTaxonomyUuid
  targetTaxaByTaxonomyUuid?: TaxaByTaxonomyUuid
  /** Node defs matched by the user (e.g. renames): target node def uuid by source node def uuid. */
  manualMatches?: Record<string, string>
}

const getRemovalChanges = (diffs: { removal?: SurveyCompareChange }[]): SurveyCompareChange[] =>
  diffs.flatMap((diff) => (diff.removal ? [diff.removal] : []))

/**
 * Returns all the changes of a comparison result (sub-changes like removals of category items included).
 * @param {SurveyCompareResult} result - The comparison result.
 * @returns {SurveyCompareChange[]} - The changes.
 */
export const getAllChanges = (result: SurveyCompareResult): SurveyCompareChange[] => [
  ...result.surveyInfo,
  ...result.surveyFiles,
  ...result.nodeDefs,
  ...result.categories,
  ...getRemovalChanges(result.categories),
  ...result.taxonomies,
  ...getRemovalChanges(result.taxonomies),
]
