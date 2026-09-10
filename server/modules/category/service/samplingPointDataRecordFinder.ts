import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

type RootEntityKeyDef = Record<string, any>
type RecordSummary = Record<string, any>
type SamplingPointDataItem = Record<string, any>
type SurveyWithNodeDefs = Record<string, any>

type SamplingPointDataRecordFinder = (samplingPointDataItem: SamplingPointDataItem) => RecordSummary | undefined

type ExtractRecordKeyParams = {
  rootEntityKeyDefs: RootEntityKeyDef[]
}

type ExtractSamplingPointItemKeyParams = {
  rootEntityKeyDefs: RootEntityKeyDef[]
  survey: SurveyWithNodeDefs
}

type CreateSamplingPointDataRecordFinderParams = {
  surveyId: number
  survey?: SurveyWithNodeDefs | null
  draft?: boolean
}

const keySeparator = '\x1f'

const extractRecordKey =
  ({ rootEntityKeyDefs }: ExtractRecordKeyParams) =>
  (record: RecordSummary): string =>
    rootEntityKeyDefs
      .map((keyDef) => {
        const keyDefName = NodeDef.getName(keyDef)
        const recordKeyValue = record[A.camelize(keyDefName) as string]
        return recordKeyValue ?? ''
      })
      .join(keySeparator)

const extractSamplingPointItemKey =
  ({ rootEntityKeyDefs, survey }: ExtractSamplingPointItemKeyParams) =>
  (samplingPointDataItem: SamplingPointDataItem): string => {
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
export const createSamplingPointDataRecordFinder = async ({
  surveyId,
  survey = null,
  draft = false,
}: CreateSamplingPointDataRecordFinderParams): Promise<SamplingPointDataRecordFinder | null> => {
  const surveyWithNodeDefs =
    survey ?? ((await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft })) as SurveyWithNodeDefs)
  if (!Survey.canHaveData(surveyWithNodeDefs)) return null

  if (!Survey.canRecordBeIdentifiedBySamplingPointDataItem(surveyWithNodeDefs)) return null

  const rootEntityKeyDefs = Survey.getNodeDefRootKeys(surveyWithNodeDefs)

  const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId })
  const { list: records } = recordsSummary

  const extractRecordKeyFn = extractRecordKey({ rootEntityKeyDefs })
  const recordsByKey = new Map(records.map((record: RecordSummary) => [extractRecordKeyFn(record), record]))

  const extractSamplingPointItemKeyFn = extractSamplingPointItemKey({
    rootEntityKeyDefs,
    survey: surveyWithNodeDefs,
  })

  return (samplingPointDataItem: SamplingPointDataItem): RecordSummary | undefined =>
    recordsByKey.get(extractSamplingPointItemKeyFn(samplingPointDataItem))
}
