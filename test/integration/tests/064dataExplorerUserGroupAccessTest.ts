import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { uuidv4 } from '@core/uuid'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'
import * as FileUtils from '@server/utils/file/fileUtils'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

// Data Explorer queries, counts and exports include only the records of the user's group
// and of the groups its group can read.

const cycle = Survey.cycleOneKey

const parseGroup = (row: any) => ({ uuid: row.uuid, surveyUuid: row.survey_uuid, props: row.props })

// minimal user group service (registered by ArenaServer.init when the server runs)
const userGroupServiceTest = {
  getAll: async ({ surveyUuid }: any, client: any = db) =>
    client.map(`SELECT * FROM user_group WHERE survey_uuid = $1`, [surveyUuid], parseGroup),
  getManyByUser: async ({ userUuid, surveyUuid }: any, client: any = db) =>
    client.map(
      `SELECT g.* FROM user_group g JOIN user_group_user gu ON gu.group_uuid = g.uuid
      WHERE gu.user_uuid = $1 AND g.survey_uuid = $2`,
      [userUuid, surveyUuid],
      parseGroup
    ),
}

const insertGroup = async ({ surveyUuid, props }: { surveyUuid: string; props: object }) =>
  db.one(
    `INSERT INTO user_group (survey_uuid, props) VALUES ($1, $2::jsonb) RETURNING uuid`,
    [surveyUuid, props],
    (row: any) => row.uuid
  )

describe('Data Explorer user group access', () => {
  let survey: any = null
  let userGroupServicePrev: any = null
  const recordUuidsByClusterNo: { [clusterNo: number]: string } = {}

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
    const registry = ServiceRegistry.getInstance()
    try {
      userGroupServicePrev = registry.getService(ServerServiceType.userGroup)
    } catch {
      userGroupServicePrev = null
    }
    registry.registerService(ServerServiceType.userGroup, userGroupServiceTest)

    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('team', NodeDef.nodeDefType.text).prop(NodeDef.propKeys.qualifier, true)
      )
    ).buildAndStore()

    const clusters: [number, string][] = [
      [1, 'control'],
      [2, 'contractor_a'],
      [3, 'contractor_b'],
    ]
    for (const [clusterNo, team] of clusters) {
      // records stored one at a time (same survey RDB tables)
      const record = await /* NOSONAR */ RB.record(
        user,
        survey,
        RB.entity('cluster', RB.attribute('cluster_no', clusterNo), RB.attribute('team', team))
      ).buildAndStore()
      recordUuidsByClusterNo[clusterNo] = Record.getUuid(record)
    }

    const surveyUuid = Survey.getUuid(survey)
    const groupAUuid = await insertGroup({
      surveyUuid,
      props: { name: 'contractor_a', qualifiers: [{ name: 'team', value: 'contractor_a' }] },
    })
    await insertGroup({
      surveyUuid,
      props: { name: 'contractor_b', qualifiers: [{ name: 'team', value: 'contractor_b' }] },
    })
    const controlGroupUuid = await insertGroup({
      surveyUuid,
      props: {
        name: 'control',
        qualifiers: [{ name: 'team', value: 'control' }],
        readableGroupUuids: [groupAUuid],
      },
    })
    await db.none(`INSERT INTO user_group_user (user_uuid, group_uuid) VALUES ($1, $2)`, [
      User.getUuid(user),
      controlGroupUuid,
    ])
  })

  afterAll(async () => {
    await db.none(`DELETE FROM user_group_user WHERE user_uuid = $1`, [User.getUuid(getContextUser())])
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
    if (userGroupServicePrev) {
      ServiceRegistry.getInstance().registerService(ServerServiceType.userGroup, userGroupServicePrev)
    }
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
