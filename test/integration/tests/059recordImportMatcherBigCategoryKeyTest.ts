import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import {
  findExistingRecordSummary,
  getRecordFormattedKeyValuesByDefUuid,
} from '@server/modules/dataImport/service/DataImportJob/recordImportMatcher'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

const categoryName = 'cluster_no_category'
const keyDefName = 'cluster_no'
const keyCode = '500'

describe('Record import matcher: root key code attribute of a big category', () => {
  let survey: any = null
  let surveyWithRefData: any = null
  let keyValue: any = null

  const buildRecord = (user: any) => RB.record(user, survey, RB.entity('cluster', RB.attribute(keyDefName, keyValue)))

  beforeAll(async () => {
    const user = getContextUser()
    const itemsCount = Category.maxCategoryItemsInIndex + 1
    const categoryBuilder = SB.category(categoryName)
      .levels('level_1')
      .items(...Array.from({ length: itemsCount }, (_, index) => SB.categoryItem(String(index + 1))))

    survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute(keyDefName, NodeDef.nodeDefType.code).category(categoryName).key())
    )
      .categories(categoryBuilder)
      .buildAndStore()

    const item = categoryBuilder.build().items.find((_item: any) => CategoryItem.getCode(_item) === keyCode)
    keyValue = Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item) })

    surveyWithRefData = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId: Survey.getId(survey),
      advanced: true,
    })
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('the item is not available in the survey ref data', () => {
    const { itemUuid } = keyValue
    expect(itemUuid).toBeTruthy()
    expect(Survey.getCategoryItemByUuid(itemUuid)(surveyWithRefData)).toBeFalsy()
  })

  test('key values are formatted with the item code', async () => {
    const record = buildRecord(getContextUser()).build()
    const keyDef = Survey.getNodeDefByName(keyDefName)(surveyWithRefData)
    const keyValues = await getRecordFormattedKeyValuesByDefUuid({ survey: surveyWithRefData, record })
    expect(keyValues[NodeDef.getUuid(keyDef)]).toBe(keyCode)
  })

  test('a record with the same keys is found when merging', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)
    const existingRecord = await buildRecord(user).buildAndStore()
    const importedRecord = buildRecord(user).build()
    const { list: existingRecordsSummary } = await RecordManager.fetchRecordsSummaryBySurveyId({
      surveyId,
      offset: 0,
      limit: null,
    } as any)

    const existingRecordSummary = await findExistingRecordSummary({
      survey: surveyWithRefData,
      record: importedRecord,
      existingRecordsSummary,
      conflictResolutionStrategy: ConflictResolutionStrategy.merge,
    })

    expect(existingRecordSummary).toBeTruthy()
    expect(Record.getUuid(existingRecordSummary)).toBe(Record.getUuid(existingRecord))
  })
})
