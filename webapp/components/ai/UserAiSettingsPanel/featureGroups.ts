/**
 * Feature switches of the AI settings panel, grouped by the data they send. Pure.
 */
import { AiDataClass, AiFeatureCategory } from '@common/ai/features'

export type FeatureGroupId = 'noSurveyContent' | 'surveyDesign' | 'recordData'

// badge of a group: its data class, or "none" for features that read no survey
export type DataBadgeKind = AiDataClass | 'none'

export type FeatureGroup = {
  id: FeatureGroupId
  // null: the features read no survey (the Help chat)
  dataClass: AiDataClass | null
  categories: AiFeatureCategory[]
}

const { chat, expressions, translation, assistantDesign, dataQuery, dataDictionary } = AiFeatureCategory
const { assistantAnalysis, assistantCleaning, assistantSuggestions, userActivity } = AiFeatureCategory

export const FEATURE_GROUPS: FeatureGroup[] = [
  // the suggestions read the survey in the browser and send nothing until Do it (then the area's switch applies)
  { id: 'noSurveyContent', dataClass: null, categories: [chat, assistantSuggestions] },
  {
    id: 'surveyDesign',
    dataClass: AiDataClass.schema,
    categories: [expressions, translation, assistantDesign, dataQuery, dataDictionary],
  },
  {
    id: 'recordData',
    dataClass: AiDataClass.data,
    categories: [assistantAnalysis, assistantCleaning, userActivity],
  },
]

/**
 * Returns the badge of a group.
 * @param {FeatureGroup} group - Group.
 * @returns {DataBadgeKind} Its data class, or none.
 */
export const getDataBadgeKind = (group: FeatureGroup): DataBadgeKind => group.dataClass ?? 'none'
