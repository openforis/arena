import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

/**
 * Returns a function like: (samplingPointDataCategoryItem) => record
 * It can be used to look for a record given a category item related to the sampling point data category.
 * The matching record has to have all the key attribute values equal to the codes of the given category item.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} [params.surveyId] - The id of the survey.
 * @param {boolean} [params.draft] - Draft or only published props.
 * @returns {Promise<Function>} - The record finder function.
 *
 */
export const createSamplingPointDataRecordFinder = async ({ surveyId, draft = false }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft })
  if (!Survey.canHaveData(survey)) return null

  if (!Survey.canRecordBeIdentifiedBySamplingPointDataItem(survey)) return null

  const rootEntityKeyDefs = Survey.getNodeDefRootKeys(survey)

  const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId })
  const { list: records } = recordsSummary

  return (samplingPointDataItem) => {
    const itemCodes = CategoryItem.getCodesHierarchy(samplingPointDataItem)

    return records.find((record) =>
      rootEntityKeyDefs.every((keyDef) => {
        const keyDefCategoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(keyDef)(survey)
        const codeValue = itemCodes[keyDefCategoryLevelIndex]
        const keyDefName = NodeDef.getName(keyDef)
        const recordKeyValue = record[A.camelize(keyDefName)]
        return codeValue === recordKeyValue
      })
    )
  }
}
