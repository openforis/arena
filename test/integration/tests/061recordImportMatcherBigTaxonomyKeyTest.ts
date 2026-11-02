import { ConflictResolutionStrategy } from '@common/dataImport'

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

const taxonomyName = 'species_list'
const keyDefName = 'species'
const keyCode = 'SP500'

describe('Record import matcher: root key taxon attribute of a big taxonomy', () => {
  let survey: any = null
  let surveyWithRefData: any = null
  let keyValue: any = null

  const buildRecord = (user: any) => RB.record(user, survey, RB.entity('cluster', RB.attribute(keyDefName, keyValue)))

  beforeAll(async () => {
    const user = getContextUser()
    const taxaCount = Taxonomy.maxTaxaInIndex + 1
    const taxonomyBuilder = SB.taxonomy(taxonomyName).taxa(
      ...Array.from({ length: taxaCount }, (_, index) => {
        const number = index + 1
        return SB.taxon(`SP${number}`, 'Family', 'Genus', `Genus species ${number}`)
      })
    )

    survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute(keyDefName, NodeDef.nodeDefType.taxon).taxonomy(taxonomyName).key())
    )
      .taxonomies(taxonomyBuilder)
      .buildAndStore()

    const taxon = taxonomyBuilder.build().taxa.find((_taxon: any) => Taxon.getCode(_taxon) === keyCode)
    keyValue = { [Node.valuePropsTaxon.taxonUuid]: Taxon.getUuid(taxon) }

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

  test('the taxon is not available in the survey ref data', () => {
    const taxonUuid = keyValue[Node.valuePropsTaxon.taxonUuid]
    expect(taxonUuid).toBeTruthy()
    expect(Survey.getTaxonByUuid(taxonUuid)(surveyWithRefData)).toBeFalsy()
  })

  test('key values are formatted with the taxon code', async () => {
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
