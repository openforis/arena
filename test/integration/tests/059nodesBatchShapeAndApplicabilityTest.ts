import * as ActivityLog from '@common/activityLog/activityLog'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'
import { createNodesBatchReplyRegistry } from '@server/modules/record/service/update/nodesBatch/nodesBatchReplies'
import {
  createDefaultNodesBatchServiceDeps,
  updateNodesBatch,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchService'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const replies = createNodesBatchReplyRegistry()

// the worker thread doesn't run in the integration tests: process the messages in-process and route the replies
class TestRecordsUpdateThread extends RecordsUpdateThread {
  constructor() {
    super({})
  }

  postMessage(msg: any) {
    if (msg.type === RecordsUpdateThreadMessageTypes.nodesBatchPersistResult) {
      replies.resolveReply(msg.content)
    }
  }
}

const invalidValueKey = 'appErrors:record.nodesBatchInvalidValue'
const notEditableKey = 'validationErrors:nodeValueParser.attributeNotEditable'

describe('Batch record edit: value shape and applicability (059)', () => {
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

  const insertRecord = ({ key, num = 1, gate = 1 }: { key: string; num?: number; gate?: number }) =>
    RB.record(
      user,
      survey,
      RB.entity(
        'root',
        RB.attribute('root_key', key),
        RB.attribute('num', num),
        RB.attribute('gate', gate),
        RB.entity('plot', RB.attribute('plot_num', 3))
      )
    ).buildAndStore()

  const update = (edits: unknown[]) =>
    updateNodesBatch(
      { user, surveyId, cycle: Survey.cycleOneKey, edits: edits as any, timezoneOffset: 0, lang: 'en' },
      deps()
    )

  const editOf = (record: any, path: string, from: unknown, to: unknown) => ({
    recordUuid: Record.getUuid(record),
    nodeUuid: Node.getUuid(nodeOf(record, path)),
    from,
    to,
  })

  beforeAll(async () => {
    user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('num', NodeDef.nodeDefType.integer),
        SB.attribute('gate', NodeDef.nodeDefType.integer),
        SB.entity('plot', SB.attribute('plot_num', NodeDef.nodeDefType.integer)).applyIf('gate == 1')
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

  describe('the shape of the new value', () => {
    test.each([
      ['a text in an integer attribute', 'not a number'],
      ['an object in an integer attribute', { x: 1 }],
      ['a list in an integer attribute', [1, 2]],
    ])('%s is refused and not stored', async (_description, to) => {
      const record = await insertRecord({ key: `shape-${JSON.stringify(to).length}` })

      const results = await update([editOf(record, 'root/num', 1, to)])

      expect(results).toEqual([{ index: 0, status: 'failed', messageKey: invalidValueKey, params: expect.anything() }])
      expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/num'))).toBe(1)
    })

    test('a malformed value does not roll back the valid edit of another attribute of the same record', async () => {
      const record = await insertRecord({ key: 'shape-mixed' })

      const results = await update([editOf(record, 'root/num', 1, 'oops'), editOf(record, 'root/gate', 1, 5)])

      expect(results[0]).toMatchObject({ index: 0, status: 'failed', messageKey: invalidValueKey })
      expect(results[1]).toEqual({ index: 1, status: 'applied' })
      const recordDb = await fetchRecord(record)
      expect(Node.getValue(nodeOf(recordDb, 'root/num'))).toBe(1)
      expect(Node.getValue(nodeOf(recordDb, 'root/gate'))).toBe(5)
    })

    test('a well formed value is applied', async () => {
      const record = await insertRecord({ key: 'shape-ok' })

      const results = await update([editOf(record, 'root/num', 1, 42)])

      expect(results).toEqual([{ index: 0, status: 'applied' }])
      expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/num'))).toBe(42)
    })
  })

  describe('an attribute inside an entity that is not applicable', () => {
    test('is refused, and is edited when the entity is applicable', async () => {
      const notApplicable = await insertRecord({ key: 'applicability-off', gate: 2 })
      const applicable = await insertRecord({ key: 'applicability-on', gate: 1 })

      const results = await update([
        editOf(notApplicable, 'root/plot/plot_num', 3, 8),
        editOf(applicable, 'root/plot/plot_num', 3, 8),
      ])

      expect(results[0]).toMatchObject({ index: 0, status: 'failed', messageKey: notEditableKey })
      expect(results[1]).toEqual({ index: 1, status: 'applied' })
      expect(Node.getValue(nodeOf(await fetchRecord(notApplicable), 'root/plot/plot_num'))).toBe(3)
      expect(Node.getValue(nodeOf(await fetchRecord(applicable), 'root/plot/plot_num'))).toBe(8)
    })

    test('is refused once an earlier request made the entity not applicable', async () => {
      const record = await insertRecord({ key: 'applicability-flip', gate: 1 })

      const gateResults = await update([editOf(record, 'root/gate', 1, 2)])
      expect(gateResults).toEqual([{ index: 0, status: 'applied' }])

      // the applicability is read from the stored record, so the next request sees the new state
      const results = await update([editOf(record, 'root/plot/plot_num', 3, 9)])

      expect(results[0]).toMatchObject({ index: 0, status: 'failed', messageKey: notEditableKey })
      expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/plot/plot_num'))).toBe(3)
    })
  })

  describe('the activity log id bounds (parameters of the query)', () => {
    test('idLessThan and idGreaterThan select the rows around an id', async () => {
      const surveyInfo = Survey.getSurveyInfo(survey)
      const allLogs: any[] = await ActivityLogRepository.fetch({
        surveyInfo,
        activityTypes: [ActivityLog.type.nodeValueUpdate],
        limit: 1000,
      })
      expect(allLogs.length).toBeGreaterThanOrEqual(2)
      const ids = allLogs.map((log) => Number(log.id)).sort((a, b) => a - b)
      const middle = ids[1]

      const before = await ActivityLogRepository.fetch({
        surveyInfo,
        activityTypes: [ActivityLog.type.nodeValueUpdate],
        idLessThan: middle,
        limit: 1000,
      })
      const after = await ActivityLogRepository.fetch({
        surveyInfo,
        activityTypes: [ActivityLog.type.nodeValueUpdate],
        idGreaterThan: middle,
        limit: 1000,
      })

      expect(before.every((log: any) => Number(log.id) < middle)).toBe(true)
      expect(after.every((log: any) => Number(log.id) > middle)).toBe(true)
      expect(after.length).toBeGreaterThan(0)
    })
  })
})
