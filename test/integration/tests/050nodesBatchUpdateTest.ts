import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'
import * as ObjectUtils from '@core/objectUtils'
import * as ActivityLog from '@common/activityLog/activityLog'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import { createNodesBatchReplyRegistry } from '@server/modules/record/service/update/nodesBatch/nodesBatchReplies'
import {
  createDefaultNodesBatchServiceDeps,
  updateNodesBatch,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchService'

import { getContextUser } from '../config/context'

import * as RecordApi from '@server/modules/record/api/recordApi'
import { requireRecordCleansePermission, requireSurveyViewPermission } from '@server/modules/auth/authApiMiddleware'

import { createFakeResponse } from '../../unit/utils/fakeExpress'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const replies = createNodesBatchReplyRegistry()

// the worker thread doesn't run in the integration tests: process the messages in-process and route the replies
class TestRecordsUpdateThread extends RecordsUpdateThread {
  messagesPosted: any[]

  constructor() {
    super({})
    this.messagesPosted = []
  }

  postMessage(msg: any) {
    this.messagesPosted.push(msg)
    if (msg.type === RecordsUpdateThreadMessageTypes.nodesBatchPersistResult) {
      replies.resolveReply(msg.content)
    }
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('Batch record edit (POST /records/nodes/update)', () => {
  let user: any
  let survey: any
  let surveyId: number
  let thread: TestRecordsUpdateThread

  const deps = () => ({
    ...createDefaultNodesBatchServiceDeps(),
    replies,
    postBatchMessage: (msg: any) => {
      thread.onMessage(msg)
    },
  })

  const fetchRecord = (record: any) =>
    RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid: Record.getUuid(record) })

  const nodeOf = (record: any, path: string) => RecordUtils.findNodeByPath(path)(survey, record)

  const insertRecord = (key: string, num: number) =>
    RB.record(user, survey, RB.entity('root', RB.attribute('root_key', key), RB.attribute('num', num))).buildAndStore()

  const update = (edits: unknown[]) =>
    updateNodesBatch(
      { user, surveyId, cycle: Survey.cycleOneKey, edits: edits as any, timezoneOffset: 0, lang: 'en' },
      deps()
    )

  beforeAll(async () => {
    user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('num', NodeDef.nodeDefType.integer).required(),
        SB.attribute('num_double', NodeDef.nodeDefType.integer)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num * 2' }))
      )
    ).buildAndStore()
    surveyId = Survey.getId(survey)
  })

  beforeEach(() => {
    thread = new TestRecordsUpdateThread()
  })

  afterAll(async () => {
    await SurveyManager.deleteSurvey(surveyId)
  })

  test('applies an edit: dependents, validation, activity log, RDB and socket events are updated', async () => {
    const record = await insertRecord('1', 1)
    const numNode = nodeOf(record, 'root/num')

    const results = await update([
      { recordUuid: Record.getUuid(record), nodeUuid: Node.getUuid(numNode), from: 1, to: 5 },
    ])

    expect(results).toEqual([{ index: 0, status: 'applied' }])
    const recordDb = await fetchRecord(record)
    expect(Node.getValue(nodeOf(recordDb, 'root/num'))).toBe(5)
    expect(Node.getValue(nodeOf(recordDb, 'root/num_double'))).toBe(10)

    const logs = await ActivityLogRepository.fetch({
      surveyInfo: Survey.getSurveyInfo(survey),
      activityTypes: [ActivityLog.type.nodeValueUpdate],
    })
    expect(logs.some((log: any) => ObjectUtils.getUuid(ActivityLog.getContent(log)) === Node.getUuid(numNode))).toBe(
      true
    )

    const row = await db.one(
      `SELECT num, num_double FROM ${SchemaRdb.getName(String(surveyId))}.data_root WHERE record_uuid = $1`,
      [Record.getUuid(recordDb)]
    )
    expect(Number(row.num)).toBe(5)
    expect(Number(row.num_double)).toBe(10)

    const types = thread.messagesPosted.map((message) => message.type)
    expect(types).toEqual(expect.arrayContaining(['nodesUpdate', 'nodesUpdateCompleted', 'nodesBatchPersistResult']))
    expect(types.indexOf('nodesUpdateCompleted')).toBeLessThan(types.indexOf('nodesBatchPersistResult'))
  })

  test('clearing a required value makes the node invalid', async () => {
    const record = await insertRecord('2', 1)
    const numNode = nodeOf(record, 'root/num')

    const results = await update([
      { recordUuid: Record.getUuid(record), nodeUuid: Node.getUuid(numNode), from: 1, to: null },
    ])

    expect(results).toEqual([{ index: 0, status: 'applied' }])
    const recordDb = await fetchRecord(record)
    const nodeValidation = Validation.getFieldValidation(Node.getUuid(numNode))(Record.getValidation(recordDb))
    expect(Validation.isValid(nodeValidation)).toBe(false)
  })

  test('a value changed since the proposal is a conflict and is not written', async () => {
    const record = await insertRecord('3', 1)
    const numNode = nodeOf(record, 'root/num')

    const results = await update([
      { recordUuid: Record.getUuid(record), nodeUuid: Node.getUuid(numNode), from: 7, to: 5 },
    ])

    expect(results).toEqual([{ index: 0, status: 'conflict' }])
    expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/num'))).toBe(1)
  })

  test('permitted and forbidden records in one request: only the permitted one is written', async () => {
    const recordEditable = await insertRecord('4', 1)
    const recordInAnalysis = await insertRecord('5', 1)
    await RecordRepository.updateRecordStep(surveyId, Record.getUuid(recordInAnalysis), RecordStep.analysisCode)

    const results = await update([
      {
        recordUuid: Record.getUuid(recordInAnalysis),
        nodeUuid: Node.getUuid(nodeOf(recordInAnalysis, 'root/num')),
        from: 1,
        to: 9,
      },
      {
        recordUuid: Record.getUuid(recordEditable),
        nodeUuid: Node.getUuid(nodeOf(recordEditable, 'root/num')),
        from: 1,
        to: 9,
      },
    ])

    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'appErrors:forbidden' },
      { index: 1, status: 'applied' },
    ])
    expect(Node.getValue(nodeOf(await fetchRecord(recordInAnalysis), 'root/num'))).toBe(1)
    expect(Node.getValue(nodeOf(await fetchRecord(recordEditable), 'root/num'))).toBe(9)
  })

  test('a node of another record is refused and nothing is written', async () => {
    const recordA = await insertRecord('6', 1)
    const recordB = await insertRecord('7', 2)
    const nodeB = nodeOf(recordB, 'root/num')

    const results = await update([
      { recordUuid: Record.getUuid(recordA), nodeUuid: Node.getUuid(nodeB), from: 2, to: 3 },
    ])

    expect(results).toEqual([{ index: 0, status: 'failed', messageKey: 'appErrors:record.nodeNotInRecord' }])
    expect(Node.getValue(nodeOf(await fetchRecord(recordB), 'root/num'))).toBe(2)
  })

  test('a key duplicate on the second edit of a record rolls back its first edit in the database', async () => {
    const record = await insertRecord('9', 1)
    await insertRecord('10', 1)

    const results = await update([
      {
        recordUuid: Record.getUuid(record),
        nodeUuid: Node.getUuid(nodeOf(record, 'root/num')),
        from: 1,
        to: 5,
      },
      {
        recordUuid: Record.getUuid(record),
        nodeUuid: Node.getUuid(nodeOf(record, 'root/root_key')),
        from: '9',
        to: '10',
      },
    ])

    expect(results).toEqual([
      expect.objectContaining({ index: 0, status: 'failed' }),
      { index: 1, status: 'failed', messageKey: 'validationErrors:record.keyDuplicate' },
    ])
    const recordDb = await fetchRecord(record)
    expect(Node.getValue(nodeOf(recordDb, 'root/num'))).toBe(1)
    expect(Node.getValue(nodeOf(recordDb, 'root/root_key'))).toBe('9')
    const row = await db.one(
      `SELECT num, root_key FROM ${SchemaRdb.getName(String(surveyId))}.data_root WHERE record_uuid = $1`,
      [Record.getUuid(recordDb)]
    )
    expect(Number(row.num)).toBe(1)
    expect(row.root_key).toBe('9')
  })

  test('a record locked for longer than the lock timeout fails with appErrors:record.lockTimeout', async () => {
    const record = await insertRecord('8', 1)
    const recordUuid = Record.getUuid(record)
    const numNode = nodeOf(record, 'root/num')

    const holder = db.tx(async (t) => {
      await t.any('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
      await sleep(11_000)
    })
    await sleep(100) // let the holder take the lock first

    const results = await update([{ recordUuid, nodeUuid: Node.getUuid(numNode), from: 1, to: 5 }])
    await holder

    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'appErrors:record.lockTimeout', params: { recordUuid } },
    ])
    expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/num'))).toBe(1)
  }, 30_000)

  test('the route is registered with the view and cleanse permissions, and a bad request is a 400 with its key', async () => {
    const routes: any[] = []
    const app = new Proxy(
      {},
      {
        get:
          (_target, method: string) =>
          (path: string, ...handlers: any[]) => {
            routes.push({ method, path, handlers })
          },
      }
    )
    RecordApi.init(app)
    const route = routes.find(
      ({ method, path }) => method === 'post' && path === '/survey/:surveyId/records/nodes/update'
    )
    expect(route).toBeDefined()
    expect(route.handlers.slice(0, 2)).toEqual([requireSurveyViewPermission, requireRecordCleansePermission])

    const handler = route.handlers[route.handlers.length - 1]
    const res = createFakeResponse()
    await handler(
      { user, params: { surveyId: String(surveyId) }, query: {}, body: { cycle: Survey.cycleOneKey, edits: [{}] } },
      res
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ key: 'appErrors:record.nodesBatchInvalid' })
  })
})
