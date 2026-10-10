/**
 * Feature switches of the AI settings panel, grouped by the data they send. Pure.
 */
import { AiDataClass, AiFeatureCategory } from '@common/ai/features'
import type { AiPolicyLevel } from '@common/ai/policy'

export type FeatureGroupId = 'noSurveyContent' | 'surveyDesign' | 'recordData'

// badge of a group: its data class, or "none" for features that read no survey
export type DataBadgeKind = AiDataClass | 'none'

export type FeatureGroup = {
  id: FeatureGroupId
  // null: the features read no survey (the Help chat)
  dataClass: AiDataClass | null
  // default survey policy level of the data class (features.groupHints.<hintKey>)
  hintKey: AiPolicyLevel | 'none'
  categories: AiFeatureCategory[]
}

const { chat, expressions, translation, assistantDesign, dataQuery, dataDictionary } = AiFeatureCategory
const { assistantAnalysis, assistantCleaning, userActivity } = AiFeatureCategory

export const FEATURE_GROUPS: FeatureGroup[] = [
  { id: 'noSurveyContent', dataClass: null, hintKey: 'none', categories: [chat] },
  {
    id: 'surveyDesign',
    dataClass: AiDataClass.schema,
    hintKey: 'cloud',
    categories: [expressions, translation, assistantDesign, dataQuery, dataDictionary],
  },
  {
    id: 'recordData',
    dataClass: AiDataClass.data,
    hintKey: 'onDevice',
    categories: [assistantAnalysis, assistantCleaning, userActivity],
  },
]

export const DATA_BADGE_KINDS: DataBadgeKind[] = ['none', AiDataClass.schema, AiDataClass.data]

/**
 * Returns the badge of a group.
 * @param {FeatureGroup} group - Group.
 * @returns {DataBadgeKind} Its data class, or none.
 */
export const getDataBadgeKind = (group: FeatureGroup): DataBadgeKind => group.dataClass ?? 'none'
