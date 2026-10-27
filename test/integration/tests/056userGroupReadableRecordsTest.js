import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as RecordService from '@server/modules/record/service/recordService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

// Records of the groups listed in readableGroupUuids of the user's group are listed as read-only,
// records of other groups are not listed at all.

const entityName = 'cluster'

const parseGroup = (row) => ({ uuid: row.uuid, surveyUuid: row.survey_uuid, props: row.props })

// minimal user group service (registered by ArenaServer.init when the server runs)
const userGroupServiceTest = {
  getAll: async ({ surveyUuid }, client = db) =>
    client.map(`SELECT * FROM user_group WHERE survey_uuid = $1`, [surveyUuid], parseGroup),
  getManyByUser: async ({ userUuid, surveyUuid }, client = db) =>
    client.map(
      `SELECT g.* FROM user_group g JOIN user_group_user gu ON gu.group_uuid = g.uuid
      WHERE gu.user_uuid = $1 AND g.survey_uuid = $2`,
      [userUuid, surveyUuid],
      parseGroup
    ),
}

const insertGroup = async ({ surveyUuid, props }) =>
  db.one(
    `INSERT INTO user_group (survey_uuid, props) VALUES ($1, $2::jsonb) RETURNING uuid`,
    [surveyUuid, props],
    (row) => row.uuid
  )

let survey = null
let userGroupServicePrev = null

const fetchSummariesByClusterNo = async () => {
  const { list } = await RecordManager.fetchRecordsSummaryBySurveyId({
    surveyId: Survey.getId(survey),
    cycle: Survey.cycleOneKey,
    user: getContextUser(),
  })
  return Object.fromEntries(list.map((summary) => [Number(summary.clusterNo), summary]))
}

describe('User group readable groups', () => {
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
        entityName,
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('team', NodeDef.nodeDefType.text).prop(NodeDef.propKeys.qualifier, true)
      )
    ).buildAndStore()

    const clusters = [
      [1, 'control'],
      [2, 'contractor_a'],
      [3, 'contractor_b'],
    ]
    for (const [clusterNo, team] of clusters) {
      await RB.record(
        user,
        survey,
        RB.entity(entityName, RB.attribute('cluster_no', clusterNo), RB.attribute('team', team))
      ).buildAndStore()
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

  test('own group records are editable, readable groups records are read-only, others are hidden', async () => {
    const summariesByClusterNo = await fetchSummariesByClusterNo()

    expect(Object.keys(summariesByClusterNo).sort()).toEqual(['1', '2'])
    expect(Record.isReadOnly(summariesByClusterNo[1])).toBe(false)
    expect(Record.isReadOnly(summariesByClusterNo[2])).toBe(true)
  })

  test('count includes the records of the readable groups', async () => {
    const count = await RecordManager.countRecordsBySurveyId({
      surveyId: Survey.getId(survey),
      cycle: Survey.cycleOneKey,
      user: getContextUser(),
    })
    expect(count).toBe(2)
  })

  test('records of readable groups are checked in as read-only', async () => {
    const summariesByClusterNo = await fetchSummariesByClusterNo()
    const record = await RecordService.checkIn({
      user: getContextUser(),
      surveyId: Survey.getId(survey),
      recordUuid: Record.getUuid(summariesByClusterNo[2]),
      draft: false,
    })
    expect(Record.isReadOnly(record)).toBe(true)
  })

  test('access filters', async () => {
    const surveyWithDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: Survey.getId(survey),
      cycle: Survey.cycleOneKey,
    })
    const { own, readable } = await SurveyManager.fetchUserGroupAccessFilters({
      user: getContextUser(),
      survey: surveyWithDefs,
    })
    expect(own.map(({ value }) => value)).toEqual(['control'])
    expect(readable.map((filters) => filters.map(({ value }) => value))).toEqual([['contractor_a']])
  })
})
