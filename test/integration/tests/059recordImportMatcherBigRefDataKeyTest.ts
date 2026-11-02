import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxon from '@core/survey/taxon'
import * as Taxonomy from '@core/survey/taxonomy'
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

const refDataName = 'big_ref_data'
const keyDefName = 'key_attribute'

const numbersUpTo = (count: number): number[] => Array.from({ length: count }, (_, index) => index + 1)

const scenarios = [
  {
    title: 'code attribute of a big category',
    keyCode: '500',
    keyDefBuilder: () => SB.attribute(keyDefName, NodeDef.nodeDefType.code).category(refDataName).key(),
    refDataBuilder: () =>
      SB.category(refDataName)
        .levels('level_1')
        .items(...numbersUpTo(Category.maxCategoryItemsInIndex + 1).map((number) => SB.categoryItem(String(number)))),
    assocRefDataBuilder: (surveyBuilder: any, refDataBuilder: any) => surveyBuilder.categories(refDataBuilder),
    findKeyValue: (refDataBuilder: any, keyCode: string) => {
      const item = refDataBuilder.build().items.find((_item: any) => CategoryItem.getCode(_item) === keyCode)
      return Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item) })
    },
    findInSurveyRefData: (survey: any, keyValue: any) =>
      Survey.getCategoryItemByUuid(keyValue[Node.valuePropsCode.itemUuid])(survey),
  },
  {
    title: 'taxon attribute of a big taxonomy',
    keyCode: 'SP500',
    keyDefBuilder: () => SB.attribute(keyDefName, NodeDef.nodeDefType.taxon).taxonomy(refDataName).key(),
    refDataBuilder: () =>
      SB.taxonomy(refDataName).taxa(
        ...numbersUpTo(Taxonomy.maxTaxaInIndex + 1).map((number) =>
          SB.taxon(`SP${number}`, 'Family', 'Genus', `Genus species ${number}`)
        )
      ),
    assocRefDataBuilder: (surveyBuilder: any, refDataBuilder: any) => surveyBuilder.taxonomies(refDataBuilder),
    findKeyValue: (refDataBuilder: any, keyCode: string) => {
      const taxon = refDataBuilder.build().taxa.find((_taxon: any) => Taxon.getCode(_taxon) === keyCode)
      return { [Node.valuePropsTaxon.taxonUuid]: Taxon.getUuid(taxon) }
    },
    findInSurveyRefData: (survey: any, keyValue: any) =>
      Survey.getTaxonByUuid(keyValue[Node.valuePropsTaxon.taxonUuid])(survey),
  },
]

describe.each(scenarios)('Record import matcher: root key $title', (scenario) => {
  const { keyCode, keyDefBuilder, refDataBuilder, assocRefDataBuilder, findKeyValue, findInSurveyRefData } = scenario

  let survey: any = null
  let surveyWithRefData: any = null
  let keyValue: any = null

  const buildRecord = (user: any) => RB.record(user, survey, RB.entity('cluster', RB.attribute(keyDefName, keyValue)))

  beforeAll(async () => {
    const user = getContextUser()
    const refData = refDataBuilder()

    survey = await assocRefDataBuilder(SB.survey(user, SB.entity('cluster', keyDefBuilder())), refData).buildAndStore()

    keyValue = findKeyValue(refData, keyCode)

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

  test('the value is not available in the survey ref data', () => {
    expect(Object.values(keyValue)[0]).toBeTruthy()
    expect(findInSurveyRefData(surveyWithRefData, keyValue)).toBeFalsy()
  })

  test('key values are formatted with the code', async () => {
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
