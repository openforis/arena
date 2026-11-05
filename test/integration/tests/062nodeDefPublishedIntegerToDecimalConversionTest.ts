import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import { TableDataNodeDef } from '@common/model/db'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as RecordUtils from '../../utils/recordUtils'

// A published integer attribute with decimal values (e.g. entered in Arena Mobile) can be converted to decimal:
// after the publish, the values are valid and stored in the RDB.

const { nodeDefType } = NodeDef

let survey: any = null
let record: any = null

const fetchPublishedSurveyAndRecord = async () => {
  const surveyId = Survey.getId(survey)
  const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: false,
    advanced: true,
  })
  const recordReloaded = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid: Record.getUuid(record),
    includeSurveyUuid: false,
    includeRecordUuid: false,
  })
  return { surveyPublished, recordReloaded }
}

const isDbhValid = ({ surveyPublished, recordReloaded }: any) => {
  const node = RecordUtils.findNodeByPath('tree/dbh')(surveyPublished, recordReloaded)
  return Validation.isValid(Validation.getFieldValidation(Node.getUuid(node))(Record.getValidation(recordReloaded)))
}

const fetchRdbDbh = async (surveyPublished: any) => {
  const table = new TableDataNodeDef(surveyPublished, Survey.getNodeDefByName('tree')(surveyPublished))
  const row = await db.one(`SELECT dbh FROM ${table.nameQualified}`)
  return row.dbh === null ? null : Number(row.dbh)
}

const convert = async (nodeDefName: string, toType: string) =>
  NodeDefService.convertNodeDef({
    user: getContextUser(),
    surveyId: Survey.getId(survey),
    nodeDefUuid: NodeDef.getUuid(Survey.getNodeDefByName(nodeDefName)(survey)),
    toType,
  })

describe('Published integer attribute conversion to decimal', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity('tree', SB.attribute('tree_no', nodeDefType.integer).key(), SB.attribute('dbh', nodeDefType.integer))
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity('tree', RB.attribute('tree_no', 1), RB.attribute('dbh', 2.5))
    ).buildAndStore()

    await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('the decimal value of an integer attribute is invalid and missing in the RDB', async () => {
    const state = await fetchPublishedSurveyAndRecord()

    expect(isDbhValid(state)).toBe(false)
    expect(await fetchRdbDbh(state.surveyPublished)).toBeNull()
  })

  test('a published attribute can only be converted from integer to decimal', async () => {
    await expect(convert('tree_no', nodeDefType.text)).rejects.toThrow()
  })

  test('after the conversion and the publish the value is valid and stored in the RDB', async () => {
    await convert('dbh', nodeDefType.decimal)
    await SurveyUtils.publishSurvey(getContextUser(), Survey.getId(survey))

    const state = await fetchPublishedSurveyAndRecord()

    expect(NodeDef.getType(Survey.getNodeDefByName('dbh')(state.surveyPublished))).toBe(nodeDefType.decimal)
    expect(isDbhValid(state)).toBe(true)
    expect(await fetchRdbDbh(state.surveyPublished)).toBe(2.5)
  })
})
