import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { uuidv4 } from '@core/uuid'

import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileUtils from '@server/utils/file/fileUtils'

import { getContextUser } from '../config/context'

import {
  createSurveyWithUserGroupRecords,
  deleteSurveyWithUserGroupRecords,
  registerUserGroupServiceTest,
  restoreUserGroupService,
} from './_record/userGroupRecordsTestUtils'

// Data Explorer queries, counts and exports include only the records of the user's group
// and of the groups its group can read.

const cycle = Survey.cycleOneKey

describe('Data Explorer user group access', () => {
  let survey: any = null
  let userGroupServicePrev: any = null
  let recordUuidsByClusterNo: { [clusterNo: number]: string } = {}

  const getDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

  const createRawQuery = () =>
    Query.create({
      entityDefUuid: getDefUuid('cluster'),
      attributeDefUuids: [getDefUuid('cluster_no'), getDefUuid('team')],
    })

  const createAggregateQuery = () =>
    Query.assocDimensions([getDefUuid('team')])(
      Query.assocMeasures({ [getDefUuid('cluster_no')]: ['cnt'] })(
        Query.assocMode(Query.modes.aggregate)(Query.create({ entityDefUuid: getDefUuid('cluster') }))
      )
    )

  const fetchClusterNos = async ({ user = getContextUser(), query = createRawQuery() } = {}) => {
    const rows = await SurveyRdbService.fetchViewData({ user, surveyId: Survey.getId(survey), cycle, query })
    return rows.map((row: any) => Number(row.cluster_no)).sort((a: number, b: number) => a - b)
  }

  beforeAll(async () => {
    userGroupServicePrev = registerUserGroupServiceTest()
    const created = await createSurveyWithUserGroupRecords(getContextUser())
    survey = created.survey
    recordUuidsByClusterNo = created.recordUuidsByClusterNo
  })

  afterAll(async () => {
    await deleteSurveyWithUserGroupRecords({ user: getContextUser(), survey })
    restoreUserGroupService(userGroupServicePrev)
  })

  test('query: records of the own and readable groups only', async () => {
    expect(await fetchClusterNos()).toEqual([1, 2])
  })

  test('query: the record UUIDs filter cannot include records of other groups', async () => {
    const query = Query.assocFilterRecordUuids([recordUuidsByClusterNo[2], recordUuidsByClusterNo[3]])(createRawQuery())
    expect(await fetchClusterNos({ query })).toEqual([2])
  })

  test('query: users not in a group are not restricted', async () => {
    const userNotInGroup = { ...getContextUser(), uuid: uuidv4() }
    expect(await fetchClusterNos({ user: userNotInGroup })).toEqual([1, 2, 3])
  })

  test('aggregate query: records of the own and readable groups only', async () => {
    const rows = await SurveyRdbService.fetchViewData({
      user: getContextUser(),
      surveyId: Survey.getId(survey),
      cycle,
      query: createAggregateQuery(),
    })
    expect(rows.map((row: any) => row.team).sort((a: string, b: string) => a.localeCompare(b))).toEqual([
      'contractor_a',
      'control',
    ])
  })

  test('count', async () => {
    const params = { user: getContextUser(), surveyId: Survey.getId(survey), cycle }
    expect(await SurveyRdbService.countTable({ ...params, query: createRawQuery() })).toBe(2)
    expect(await SurveyRdbService.countTable({ ...params, query: createAggregateQuery() })).toBe(2)
  })

  test('rows count by entity', async () => {
    const entityDefUuid = getDefUuid('cluster')
    const countsByUuid = await SurveyRdbService.fetchTableRowsCountByEntityDefUuid({
      user: getContextUser(),
      surveyId: Survey.getId(survey),
      cycle,
      entityDefUuids: [entityDefUuid],
    })
    expect(countsByUuid).toEqual({ [entityDefUuid]: 2 })
  })

  test('export: records of the own and readable groups only, server-side parameters not overridden', async () => {
    const tempFileName = await SurveyRdbService.exportViewDataToTempFile({
      user: getContextUser(),
      surveyId: Survey.getId(survey),
      cycle,
      query: createRawQuery(),
      addCycle: true,
      // only the export options are used: the record owner filter is determined server-side
      options: { fileFormat: FileFormats.csv, recordOwnerUuid: uuidv4() },
    })
    const filePath = FileUtils.tempFilePath(tempFileName)
    const content = await FileUtils.readFile(filePath)
    await FileUtils.deleteFile(filePath)

    const lines = content.split(/\r?\n/).filter((line: string) => line.length > 0)
    // header + 2 records
    expect(lines).toHaveLength(3)
    expect(content).toContain('contractor_a')
    expect(content).not.toContain('contractor_b')
  })
})
