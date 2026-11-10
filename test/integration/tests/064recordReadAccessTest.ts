import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import { Query } from '@common/model/query'
import * as AuthGroup from '@core/auth/authGroup'
import * as Expression from '@core/expressionParser/expression'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { StatusCodes } from '@core/systemError'

import { db } from '@server/db/db'
import { requireNotOwnedRecordViewAllowed } from '@server/modules/record/api/recordOwnerMiddleware'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as RecordService from '@server/modules/record/service/recordService'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

// "view not owned records" survey setting and user group qualifiers applied to record reads and the validation report

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

let survey: any = null
let surveyId: number
let userGroupServicePrev: any = null
let otherUserUuid: string
let ownRecordUuid: string
let notOwnedRecordUuid: string

const getAdmin = () => getContextUser()

// same user (owner of the "own" record) with the data editor role
const getDataEditor = () => {
  const dataEditorGroup = Survey.getAuthGroupByName(AuthGroup.groupNames.dataEditor)(Survey.getSurveyInfo(survey))
  return { ...getAdmin(), authGroups: [dataEditorGroup] }
}

const setDataEditorViewNotOwnedRecordsAllowed = async (allowed: boolean) =>
  db.none(
    `UPDATE survey
    SET props = props || jsonb_build_object('security', COALESCE(props -> 'security', '{}'::jsonb) || jsonb_build_object('dataEditorViewNotOwnedRecordsAllowed', $2::boolean))
    WHERE id = $1`,
    [surveyId, allowed]
  )

const fetchReportRecordUuids = async ({ user, query = null }: { user: any; query?: any }) => {
  const list = await RecordService.fetchValidationReport({ user, surveyId, cycle, query } as any)
  return new Set(list.map((item: any) => item.recordUuid))
}

const runOwnerMiddleware = async ({ user, recordUuid }: { user: any; recordUuid: string }) => {
  const req: any = { params: { surveyId, recordUuid }, query: {}, body: {}, user }
  const res: any = {
    statusCode: StatusCodes.OK,
    status(code: number) {
      this.statusCode = code
      return this
    },
    send() {
      return this
    },
  }
  const next = jest.fn()
  await requireNotOwnedRecordViewAllowed(req, res, next)
  return { allowed: next.mock.calls.length === 1 && next.mock.calls[0].length === 0, statusCode: res.statusCode }
}

const filterQuery = (expression: string) =>
  Query.assocFilter(Expression.fromString(expression, Expression.modes.sql))(
    Query.create({ entityDefUuid: NodeDef.getUuid(Survey.getNodeDefRoot(survey)) })
  )

describe('Record read access', () => {
  beforeAll(async () => {
    const registry = ServiceRegistry.getInstance()
    try {
      userGroupServicePrev = registry.getService(ServerServiceType.userGroup)
    } catch {
      userGroupServicePrev = null
    }
    registry.registerService(ServerServiceType.userGroup, userGroupServiceTest)

    const user = getAdmin()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('team', NodeDef.nodeDefType.text).prop(NodeDef.propKeys.qualifier, true),
        // left empty: every record has a validation error
        SB.attribute('required_attr').required()
      )
    ).buildAndStore()
    surveyId = Survey.getId(survey)

    const records: any[] = []
    for (const [clusterNo, team] of [
      [1, 'team_a'],
      [2, 'team_b'],
    ]) {
      const record = await /* NOSONAR */ RB.record(
        user,
        survey,
        RB.entity('cluster', RB.attribute('cluster_no', clusterNo), RB.attribute('team', team))
      ).buildAndStore()
      records.push(record)
    }
    ownRecordUuid = Record.getUuid(records[0])
    notOwnedRecordUuid = Record.getUuid(records[1])

    otherUserUuid = await db.one(
      `INSERT INTO "user" (name, email, status) VALUES ($1, $2, $3) RETURNING uuid`,
      ['record_read_access_test', 'record_read_access_test@openforis-arena.org', User.userStatus.ACCEPTED],
      (row: { uuid: string }) => row.uuid
    )
    await RecordRepository.updateRecordOwner({ surveyId, recordUuid: notOwnedRecordUuid, ownerUuid: otherUserUuid })
  })

  afterAll(async () => {
    await db.none(`DELETE FROM user_group_user WHERE user_uuid = $1`, [User.getUuid(getAdmin())])
    if (survey) {
      await SurveyManager.deleteSurvey(surveyId)
    }
    if (otherUserUuid) {
      await db.none(`DELETE FROM "user" WHERE uuid = $1`, [otherUserUuid])
    }
    if (userGroupServicePrev) {
      ServiceRegistry.getInstance().registerService(ServerServiceType.userGroup, userGroupServicePrev)
    }
  })

  test('data editor can read not owned records when the survey allows it', async () => {
    await setDataEditorViewNotOwnedRecordsAllowed(true)
    const dataEditor = getDataEditor()

    expect((await runOwnerMiddleware({ user: dataEditor, recordUuid: notOwnedRecordUuid })).allowed).toBe(true)
    expect(await fetchReportRecordUuids({ user: dataEditor })).toEqual(new Set([ownRecordUuid, notOwnedRecordUuid]))
  })

  test('data editor cannot read not owned records when the survey does not allow it', async () => {
    await setDataEditorViewNotOwnedRecordsAllowed(false)
    const dataEditor = getDataEditor()

    const notOwned = await runOwnerMiddleware({ user: dataEditor, recordUuid: notOwnedRecordUuid })
    expect(notOwned.allowed).toBe(false)
    expect(notOwned.statusCode).toBe(StatusCodes.FORBIDDEN)
    expect((await runOwnerMiddleware({ user: dataEditor, recordUuid: ownRecordUuid })).allowed).toBe(true)

    expect(await fetchReportRecordUuids({ user: dataEditor })).toEqual(new Set([ownRecordUuid]))
    const countEditor = await RecordService.countValidationReportItems({ user: dataEditor, surveyId, cycle } as any)
    const countAdmin = await RecordService.countValidationReportItems({ user: getAdmin(), surveyId, cycle } as any)
    expect(countEditor).toBeGreaterThan(0)
    expect(countEditor).toBeLessThan(countAdmin)

    const recordsUuidAndCycle = await RecordService.fetchRecordsUuidAndCycle({
      surveyId,
      ownerUuid: User.getUuid(dataEditor),
    })
    expect(recordsUuidAndCycle.map(Record.getUuid)).toEqual([ownRecordUuid])

    // the setting doesn't apply to admins
    expect((await runOwnerMiddleware({ user: getAdmin(), recordUuid: notOwnedRecordUuid })).allowed).toBe(true)
    expect(await fetchReportRecordUuids({ user: getAdmin() })).toEqual(new Set([ownRecordUuid, notOwnedRecordUuid]))
  })

  test('validation report filter accepts only columns of the root entity data view', async () => {
    const admin = getAdmin()
    expect(await fetchReportRecordUuids({ user: admin, query: filterQuery('cluster_no = 2') })).toEqual(
      new Set([notOwnedRecordUuid])
    )
    await expect(
      RecordService.countValidationReportItems({
        user: admin,
        surveyId,
        cycle,
        query: filterQuery(`email = 'admin@openforis.org'`),
      } as any)
    ).rejects.toMatchObject({ key: 'appErrors:expression.identifierNotFound', params: { name: 'email' } })
  })

  test('validation report includes only the records of the user group', async () => {
    const groupUuid = await db.one(
      `INSERT INTO user_group (survey_uuid, props) VALUES ($1, $2::jsonb) RETURNING uuid`,
      [Survey.getUuid(survey), { name: 'team_a', qualifiers: [{ name: 'team', value: 'team_a' }] }],
      (row: { uuid: string }) => row.uuid
    )
    await db.none(`INSERT INTO user_group_user (user_uuid, group_uuid) VALUES ($1, $2)`, [
      User.getUuid(getAdmin()),
      groupUuid,
    ])

    expect(await fetchReportRecordUuids({ user: getAdmin() })).toEqual(new Set([ownRecordUuid]))
  })
})
