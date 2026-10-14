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
  categoryLevelsChanged: 'categoryLevelsChanged',
  categoryMissing: 'categoryMissing',
  categoryReportingDataChanged: 'categoryReportingDataChanged',
  categoryRemovalNotSupported: 'categoryRemovalNotSupported',
  categoryItemsRemovalNotSupported: 'categoryItemsRemovalNotSupported',
  cycleMissing: 'cycleMissing',
  dependencyNotApplicable: 'dependencyNotApplicable',
  moveNotSupported: 'moveNotSupported',
  parentMissing: 'parentMissing',
  publishedCategoryChanged: 'publishedCategoryChanged',
  publishedKeyChanged: 'publishedKeyChanged',
  publishedMultipleChanged: 'publishedMultipleChanged',
  publishedTaxonomyChanged: 'publishedTaxonomyChanged',
  publishedTypeChanged: 'publishedTypeChanged',
  removalNotSupported: 'removalNotSupported',
  taxonomyMissing: 'taxonomyMissing',
  taxonomySyncNotSupported: 'taxonomySyncNotSupported',
  // warnings
  publishedNameChanged: 'publishedNameChanged',
  publishedCyclesRemoved: 'publishedCyclesRemoved',
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

interface SurveyCompareItemBase {
  /** Change id: used to select the change to apply. */
  id: string
  sourceUuid?: string
  targetUuid?: string
  matchedBy?: SurveyCompareMatchTypeValue
  status: SurveyCompareStatusValue
  propDiffs: SurveyComparePropDiff[]
  applicability?: SurveyCompareApplicability
  /** Changes that must be applied together with this one. */
  dependsOn: string[]
  /** Changes selected automatically together with this one (e.g. parent entity layout). */
  linkedTo: string[]
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
}

export interface SurveyCompareCategoryItemDiff {
  codePath: string[]
  status: SurveyCompareStatusValue
  propDiffs: SurveyComparePropDiff[]
}

export interface SurveyCompareCategoryDiff extends SurveyCompareItemBase {
  name: string
  items: SurveyCompareCategoryItemDiff[]
  itemsCount: { added: number; changed: number; removed: number }
}

export interface SurveyCompareTaxonomyDiff extends SurveyCompareItemBase {
  name: string
}

export interface SurveyCompareResult {
  identical: boolean
  surveyInfo: SurveyComparePropDiff[]
  nodeDefs: SurveyCompareNodeDefDiff[]
  categories: SurveyCompareCategoryDiff[]
  taxonomies: SurveyCompareTaxonomyDiff[]
  counts: {
    nodeDefs: { added: number; changed: number; removed: number }
    categories: { added: number; changed: number; removed: number }
    taxonomies: { added: number; changed: number; removed: number }
  }
}

/** Category items indexed by category uuid. */
export type CategoryItemsByCategoryUuid = Record<string, any[]>

export interface SurveyCompareParams {
  sourceSurvey: any
  targetSurvey: any
  sourceItemsByCategoryUuid: CategoryItemsByCategoryUuid
  targetItemsByCategoryUuid: CategoryItemsByCategoryUuid
}
