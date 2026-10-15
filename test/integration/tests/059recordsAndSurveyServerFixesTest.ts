import * as ActivityLog from '@common/activityLog/activityLog'
import { ENV } from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as CategoryApi from '@server/modules/category/api/categoryApi'
import * as RecordApi from '@server/modules/record/api/recordApi'
import * as SurveyApi from '@server/modules/survey/api/surveyApi'
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

import { createFakeResponse } from '../../unit/utils/fakeExpress'

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

type Route = { method: string; path: string; handlers: any[] }

/**
 * Collects the routes registered by an API module.
 * @param {Function} init - The init function of the API module.
 * @returns {Route[]} The routes.
 */
const collectRoutes = (init: (app: any) => void): Route[] => {
  const routes: Route[] = []
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
  init(app)
  return routes
}

/**
 * Calls the route handler (the last one of its chain, after the permission middlewares).
 * @param {object} params - The parameters.
 * @param {Function} params.init - The init function of the API module.
 * @param {string} params.method - The http method.
 * @param {string} params.path - The route path.
 * @param {object} [params.body] - The request body.
 * @param {object} [params.user] - The user of the request.
 * @returns {Promise<{res: any, next: jest.Mock}>} The fake response and the next callback.
 */
const callRoute = async ({
  init,
  method,
  path,
  body = {},
  user = { uuid: 'u1' },
}: {
  init: (app: any) => void
  method: string
  path: string
  body?: object
  user?: object
}) => {
  const route = collectRoutes(init).find((r) => r.method === method && r.path === path)
  const res = createFakeResponse()
  const next = jest.fn()
  await route!.handlers.at(-1)({ params: { surveyId: '1' }, query: { cycle: '0' }, body, user }, res, next)
  return { res, next }
}

const invalidValueKey = 'appErrors:record.nodesBatchInvalidValue'
const notEditableKey = 'validationErrors:nodeValueParser.attributeNotEditable'

describe('Batch record edit: value shape, applicability and activity log bounds (059)', () => {
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

  describe('the permission under the record lock', () => {
    test('a promotion to analysis after the thread cached the record is seen: the step is read from the database', async () => {
      const record = await insertRecord({ key: 'lock-step' })
      // the first edit makes the thread cache the record
      expect(await update([editOf(record, 'root/num', 1, 2)])).toEqual([{ index: 0, status: 'applied' }])
      // the step change does not touch the date the cache is checked with
      await RecordRepository.updateRecordStep(surveyId, Record.getUuid(record), RecordStep.analysisCode)
      // the request check is skipped on purpose (the race): the thread check is the only guard
      const staleRecord = await fetchRecord(record)
      const staleDeps = { ...deps(), fetchRecord: async () => ({ ...staleRecord, step: '1' }) }

      const results = await updateNodesBatch(
        {
          user,
          surveyId,
          cycle: Survey.cycleOneKey,
          edits: [editOf(record, 'root/num', 2, 3)] as any,
          timezoneOffset: 0,
          lang: 'en',
        },
        staleDeps
      )

      expect(results).toEqual([{ index: 0, status: 'failed', messageKey: 'appErrors:forbidden' }])
      expect(Node.getValue(nodeOf(await fetchRecord(record), 'root/num'))).toBe(2)
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

describe('Schema summary routes send their errors as JSON with the error key (059)', () => {
  const aiItems = { init: SurveyApi.init, method: 'get', path: '/survey/:surveyId/schema-summary/ai-items' }
  const exportRoute = { init: SurveyApi.init, method: 'post', path: '/survey/:surveyId/schema-summary/export' }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('the legacy includeAiDescriptions flag is refused with aiIncludeAiDescriptionsRemoved (400)', async () => {
    const { res, next } = await callRoute({ ...exportRoute, body: { includeAiDescriptions: true } })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiIncludeAiDescriptionsRemoved' })
  })

  test('the AI items of a server with the AI features off are refused with aiFeaturesDisabled (404)', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

    const { res, next } = await callRoute(aiItems)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({
      status: 'error',
      key: 'aiFeaturesDisabled',
      params: { feature: 'dataDictionary' },
    })
  })

  test('the AI items of a feature turned off by the server flags are refused with aiFeatureDisabled (403)', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
    jest.replaceProperty(ENV, 'aiFeatureFlags', { dataDictionary: false })

    const { res, next } = await callRoute(aiItems)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeatureDisabled' })
  })

  test('the export with AI descriptions is refused with the same key when the feature is off', async () => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

    const { res, next } = await callRoute({ ...exportRoute, body: { aiDescriptions: {} } })

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(404)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled' })
  })
})

describe('The AI write routes are off when the AI is off (059)', () => {
  // every AI category on, as saved by the AI settings
  const aiUser = {
    uuid: 'u1',
    prefs: { ai: { accessLevel: 3, featureToggles: { assistantCleaning: true, assistantDesign: true } } },
  }
  const aiOffUser = { uuid: 'u2', prefs: { ai: { accessLevel: 0 } } }

  const writeRoutes = [
    {
      name: 'the batch record edit',
      init: RecordApi.init,
      method: 'post',
      path: '/survey/:surveyId/records/nodes/update',
      feature: 'assistantCleaning',
    },
    {
      name: 'the category item labels update',
      init: CategoryApi.init,
      method: 'put',
      path: '/survey/:surveyId/categories/items/labels',
      feature: 'assistantDesign',
    },
  ]

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test.each(writeRoutes)(
    '$name answers 404 aiFeaturesDisabled when the server has the AI features off',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', false)

      const { res, next } = await callRoute({ ...route, user: aiUser })

      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(404)
      expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled', params: { feature: route.feature } })
    }
  )

  test.each(writeRoutes)(
    '$name answers 403 aiFeatureDisabled when the server flags turn its feature off',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
      jest.replaceProperty(ENV, 'aiFeatureFlags', { [route.feature]: false })

      const { res } = await callRoute({ ...route, user: aiUser })

      expect(res.statusCode).toBe(403)
      expect(res.body).toMatchObject({ status: 'error', key: 'aiFeatureDisabled', params: { feature: route.feature } })
    }
  )

  test.each(writeRoutes)('$name answers 403 aiFeaturesDisabled to a user who turned the AI off', async (route) => {
    jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
    jest.replaceProperty(ENV, 'aiFeatureFlags', null)

    const { res } = await callRoute({ ...route, user: aiOffUser })

    expect(res.statusCode).toBe(403)
    expect(res.body).toMatchObject({ status: 'error', key: 'aiFeaturesDisabled' })
  })

  test.each(writeRoutes)(
    '$name keeps its own answer when the feature is on (an empty body is refused)',
    async (route) => {
      jest.replaceProperty(ENV, 'aiFeaturesEnabled', true)
      jest.replaceProperty(ENV, 'aiFeatureFlags', null)

      const { res } = await callRoute({ ...route, user: aiUser })

      expect(res.body).toMatchObject({ status: 'error' })
      expect(res.body.key).not.toMatch(/^aiFeature/)
    }
  )
})
