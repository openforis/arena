import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const keySeparator = '\x1f'

const extractRecordKey =
  ({ rootEntityKeyDefs }) =>
  (record) =>
    rootEntityKeyDefs
      .map((keyDef) => {
        const keyDefName = NodeDef.getName(keyDef)
        const recordKeyValue = record[A.camelize(keyDefName)]
        return recordKeyValue ?? ''
      })
      .join(keySeparator)

const extractSamplingPointItemKey =
  ({ rootEntityKeyDefs, survey }) =>
  (samplingPointDataItem) => {
    const itemCodes = CategoryItem.getCodesHierarchy(samplingPointDataItem)

    return rootEntityKeyDefs
      .map((keyDef) => {
        const keyDefCategoryLevelIndex = Survey.getNodeDefCategoryLevelIndex(keyDef)(survey)
        return itemCodes[keyDefCategoryLevelIndex] ?? ''
      })
      .join(keySeparator)
  }

/**
 * Returns a function like: (samplingPointDataCategoryItem) => record
 * It can be used to look for a record given a category item related to the sampling point data category.
 * The matching record has to have all the key attribute values equal to the codes of the given category item.
 * @param {!object} params - The query parameters.
 * @param {!number} [params.surveyId] - The id of the survey.
 * @param {boolean} [params.draft] - Draft or only published props.
 * @returns {Promise<((samplingPointDataItem: object) => object)|null>} - The record finder function.
 */
export const createSamplingPointDataRecordFinder = async ({ surveyId, survey = null, draft = false }) => {
  const surveyWithNodeDefs = survey ?? (await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft }))
  if (!Survey.canHaveData(surveyWithNodeDefs)) return null

  if (!Survey.canRecordBeIdentifiedBySamplingPointDataItem(surveyWithNodeDefs)) return null

  const rootEntityKeyDefs = Survey.getNodeDefRootKeys(surveyWithNodeDefs)

  const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId })
  const { list: records } = recordsSummary

  const extractRecordKeyFn = extractRecordKey({ rootEntityKeyDefs })
  const recordsByKey = new Map(records.map((record) => [extractRecordKeyFn(record), record]))

  const extractSamplingPointItemKeyFn = extractSamplingPointItemKey({
    rootEntityKeyDefs,
    survey: surveyWithNodeDefs,
  })

  return (samplingPointDataItem) => recordsByKey.get(extractSamplingPointItemKeyFn(samplingPointDataItem))
}
