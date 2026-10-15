import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'
import { uuidv4 } from '@core/uuid'

import { createNodesBatchReplyRegistry } from '@server/modules/record/service/update/nodesBatch/nodesBatchReplies'
import {
  NodesBatchServiceDeps,
  updateNodesBatch,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchService'
import { createNodesBatchSlots } from '@server/modules/record/service/update/nodesBatch/nodesBatchSlots'
import { NodesBatchMessageKeys } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const limits = { perUser: 1, perSurvey: 2, total: 3 }

describe('Nodes batch slots (340)', () => {
  test('a user holds one slot at a time, others are not affected', () => {
    const slots = createNodesBatchSlots(limits)
    const first = slots.tryAcquire({ userUuid: 'u1', surveyId: 1 })
    expect(first.ok).toBe(true)
    expect(slots.tryAcquire({ userUuid: 'u1', surveyId: 2 })).toEqual({ ok: false, scope: 'user' })
    expect(slots.tryAcquire({ userUuid: 'u2', surveyId: 1 }).ok).toBe(true)
  })

  test('a survey holds at most perSurvey slots', () => {
    const slots = createNodesBatchSlots(limits)
    expect(slots.tryAcquire({ userUuid: 'u1', surveyId: 1 }).ok).toBe(true)
    expect(slots.tryAcquire({ userUuid: 'u2', surveyId: 1 }).ok).toBe(true)
    expect(slots.tryAcquire({ userUuid: 'u3', surveyId: 1 })).toEqual({ ok: false, scope: 'survey' })
    expect(slots.tryAcquire({ userUuid: 'u3', surveyId: 2 }).ok).toBe(true)
  })

  test('the server holds at most total slots, whatever the surveys and users', () => {
    const slots = createNodesBatchSlots(limits)
    for (const surveyId of [1, 2, 3]) {
      expect(slots.tryAcquire({ userUuid: `u${surveyId}`, surveyId }).ok).toBe(true)
    }
    expect(slots.tryAcquire({ userUuid: 'u4', surveyId: 4 })).toEqual({ ok: false, scope: 'server' })
  })

  test('releasing frees the slot once; a second release does not free another holder’s slot', () => {
    const slots = createNodesBatchSlots(limits)
    const first = slots.tryAcquire({ userUuid: 'u1', surveyId: 1 })
    if (!first.ok) throw new Error('not acquired')
    first.release()
    const second = slots.tryAcquire({ userUuid: 'u1', surveyId: 1 })
    expect(second.ok).toBe(true)
    first.release()
    expect(slots.tryAcquire({ userUuid: 'u1', surveyId: 1 })).toEqual({ ok: false, scope: 'user' })
    expect(slots.size()).toBe(1)
  })

  test('everything is released: no counter is kept for an idle user or survey', () => {
    const slots = createNodesBatchSlots(limits)
    const slot = slots.tryAcquire({ userUuid: 'u1', surveyId: 1 })
    if (!slot.ok) throw new Error('not acquired')
    slot.release()
    expect(slots.size()).toBe(0)
  })
})

describe('updateNodesBatch concurrency (340)', () => {
  const user = { uuid: uuidv4(), authGroups: [{ name: 'systemAdmin' }] }
  const otherUser = { uuid: uuidv4(), authGroups: [{ name: 'systemAdmin' }] }
  let survey: any
  let record: any
  let recordUuid: string
  let aUuid: string

  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity('root', SB.attribute('root_key').key(), SB.attribute('a', NodeDef.nodeDefType.integer))
    ).build()
    record = RB.record(user, survey, RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('a', 1))).build()
    recordUuid = Record.getUuid(record)
    aUuid = Node.getUuid(RecordUtils.findNodeByPath('root/a')(survey, record))
  })

  // the thread answers when the test calls `answer()`
  const buildDeps = (overrides: Partial<NodesBatchServiceDeps> = {}) => {
    const replies = createNodesBatchReplyRegistry()
    const pendingRequestIds: string[] = []
    const deps: NodesBatchServiceDeps = {
      fetchSurvey: async () => survey,
      fetchQualifierFilters: async () => null,
      fetchRecord: async () => record,
      fetchNodeRecordUuid: async () => null,
      recordMatchesQualifierFilters: () => true,
      postBatchMessage: (msg) => {
        pendingRequestIds.push(msg.requestId)
      },
      replies,
      slots: createNodesBatchSlots(limits),
      logError: () => undefined,
      ...overrides,
    }
    const answer = () => {
      for (const requestId of pendingRequestIds.splice(0)) {
        replies.resolveReply({ requestId, results: [{ index: 0, status: 'applied' }] })
      }
    }
    return { deps, answer }
  }

  const run = (batchUser: any, deps: NodesBatchServiceDeps, surveyId = 1) =>
    updateNodesBatch(
      {
        user: batchUser,
        surveyId,
        cycle: Survey.cycleOneKey,
        edits: [{ recordUuid, nodeUuid: aUuid, from: 1, to: 5 }],
      },
      deps
    )

  const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

  test('a second batch of the same user while one is running is refused with 429 and a stable key', async () => {
    const { deps, answer } = buildDeps()
    const first = run(user, deps)
    await tick()

    await expect(run(user, deps)).rejects.toMatchObject({
      key: NodesBatchMessageKeys.busy,
      statusCode: 429,
      params: { scope: 'user' },
    })

    answer()
    await expect(first).resolves.toEqual([{ index: 0, status: 'applied' }])
  })

  test('the slot is free again once the batch is done', async () => {
    const { deps, answer } = buildDeps()
    const first = run(user, deps)
    await tick()
    answer()
    await first

    const second = run(user, deps)
    await tick()
    answer()
    await expect(second).resolves.toEqual([{ index: 0, status: 'applied' }])
  })

  test('another user of the same survey is served until the survey limit', async () => {
    const { deps, answer } = buildDeps()
    const first = run(user, deps)
    const second = run(otherUser, deps)
    await tick()
    await expect(run({ uuid: uuidv4(), authGroups: [{ name: 'systemAdmin' }] }, deps)).rejects.toMatchObject({
      statusCode: 429,
      params: { scope: 'survey' },
    })
    answer()
    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
  })

  test('the slot is released when the batch throws before reaching the thread', async () => {
    const { deps, answer } = buildDeps({
      fetchSurvey: async () => {
        throw new Error('db down')
      },
    })
    await expect(run(user, deps)).rejects.toThrow('db down')
    expect(deps.slots.size()).toBe(0)

    const working = buildDeps({ slots: deps.slots })
    const next = run(user, working.deps)
    await tick()
    working.answer()
    await expect(next).resolves.toHaveLength(1)
    answer()
  })

  test('the slot is released when the thread never answers (timeout)', async () => {
    const { deps } = buildDeps({ replies: createNodesBatchReplyRegistry({ timeoutMs: 5 }) })
    const results = await run(user, deps)
    expect(results).toEqual([{ index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.applyTimeout }])
    expect(deps.slots.size()).toBe(0)
  })

  test('the slot is released when the qualifier filters cannot be loaded', async () => {
    const { deps } = buildDeps({
      fetchQualifierFilters: async () => {
        throw new Error('no filters')
      },
    })
    await expect(run(user, deps)).rejects.toThrow('no filters')
    expect(deps.slots.size()).toBe(0)
  })
})
