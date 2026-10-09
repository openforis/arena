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
import { NodesBatchMessageKeys } from '@server/modules/record/service/update/nodesBatch/nodesBatchTypes'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const admin = { uuid: uuidv4(), authGroups: [{ name: 'systemAdmin' }] }
const nobody = { uuid: uuidv4(), authGroups: [] }

describe('updateNodesBatch', () => {
  let survey: any
  let record: any
  let recordUuid: string
  let aUuid: string
  let bUuid: string

  beforeAll(async () => {
    survey = await SB.survey(
      admin,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('a', NodeDef.nodeDefType.integer),
        SB.attribute('b', NodeDef.nodeDefType.integer)
      )
    ).build()
    record = RB.record(
      admin,
      survey,
      RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('a', 1), RB.attribute('b', 2))
    ).build()
    recordUuid = Record.getUuid(record)
    aUuid = Node.getUuid(RecordUtils.findNodeByPath('root/a')(survey, record))
    bUuid = Node.getUuid(RecordUtils.findNodeByPath('root/b')(survey, record))
  })

  const cycle = Survey.cycleOneKey

  const buildDeps = (overrides: Partial<NodesBatchServiceDeps> = {}) => {
    const posted: any[] = []
    const errors: string[] = []
    const replies = createNodesBatchReplyRegistry()
    const deps: NodesBatchServiceDeps = {
      fetchSurvey: async () => survey,
      fetchQualifierFilters: async () => null,
      fetchRecord: async () => record,
      fetchNodeRecordUuid: async () => null,
      recordMatchesQualifierFilters: () => true,
      postBatchMessage: (msg) => {
        posted.push(msg)
        replies.resolveReply({
          requestId: msg.requestId,
          results: msg.edits.map(({ index }) => ({ index, status: 'applied' as const })),
        })
      },
      replies,
      logError: (message) => {
        errors.push(message)
      },
      ...overrides,
    }
    return { deps, posted, errors }
  }

  const run = (user: any, edits: any[], deps: NodesBatchServiceDeps, recordCycle = cycle) =>
    updateNodesBatch({ user, surveyId: 1, cycle: recordCycle, edits }, deps)

  const edit = (nodeUuid: string, to: unknown) => ({ recordUuid, nodeUuid, from: 1, to })

  test('posts one message per record and returns the results sorted by index', async () => {
    const { deps, posted } = buildDeps()
    const results = await run(admin, [edit(aUuid, 5), edit(bUuid, 6)], deps)
    expect(results).toEqual([
      { index: 0, status: 'applied' },
      { index: 1, status: 'applied' },
    ])
    expect(posted).toHaveLength(1)
    expect(posted[0]).toMatchObject({ recordUuid, cycle, draft: false, surveyId: 1 })
    expect(posted[0].edits.map((e: any) => e.nodeUuid)).toEqual([aUuid, bUuid])
  })

  test('a missing reply (timeout) fails every edit of the record with aiApplyTimeout and still returns', async () => {
    const { deps } = buildDeps({
      postBatchMessage: () => undefined,
      replies: createNodesBatchReplyRegistry({ timeoutMs: 5 }),
    })
    const results = await run(admin, [edit(aUuid, 5), edit(bUuid, 6)], deps)
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.applyTimeout },
      { index: 1, status: 'failed', messageKey: NodesBatchMessageKeys.applyTimeout },
    ])
  })

  test('a record of another cycle is a conflict and nothing is posted', async () => {
    const { deps, posted } = buildDeps()
    const results = await run(admin, [edit(aUuid, 5)], deps, '1')
    expect(results).toEqual([{ index: 0, status: 'conflict' }])
    expect(posted).toHaveLength(0)
  })

  test('a missing record is a conflict', async () => {
    const { deps } = buildDeps({ fetchRecord: async () => null })
    expect(await run(admin, [edit(aUuid, 5)], deps)).toEqual([{ index: 0, status: 'conflict' }])
  })

  test('a user who cannot edit the record is forbidden', async () => {
    const { deps, posted } = buildDeps()
    const results = await run(nobody, [edit(aUuid, 5)], deps)
    expect(results).toEqual([{ index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.forbidden }])
    expect(posted).toHaveLength(0)
  })

  test('a record outside the user qualifiers is forbidden', async () => {
    const { deps } = buildDeps({ recordMatchesQualifierFilters: () => false })
    const results = await run(admin, [edit(aUuid, 5)], deps)
    expect(results).toEqual([{ index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.forbidden }])
  })

  test('a new value that takes the record out of the qualifiers is forbidden, the other edit is sent', async () => {
    const { deps, posted } = buildDeps({
      recordMatchesQualifierFilters: ({ pendingNode }) => !pendingNode || Node.getValue(pendingNode) !== 99,
    })
    const results = await run(admin, [edit(aUuid, 99), edit(bUuid, 6)], deps)
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.forbidden },
      { index: 1, status: 'applied' },
    ])
    expect(posted[0].edits.map((e: any) => e.index)).toEqual([1])
  })

  test('a node of another record is failed, a node that exists nowhere is a conflict', async () => {
    const foreign = uuidv4()
    const gone = uuidv4()
    const { deps } = buildDeps({
      fetchNodeRecordUuid: async ({ nodeUuid }) => (nodeUuid === foreign ? uuidv4() : null),
    })
    const results = await run(admin, [edit(foreign, 1), edit(gone, 1)], deps)
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.nodeNotInRecord },
      { index: 1, status: 'conflict' },
    ])
  })

  test('an exception on one record fails its edits with generic, is logged, and the other records proceed', async () => {
    const otherRecord = RB.record(
      admin,
      survey,
      RB.entity('root', RB.attribute('root_key', '2'), RB.attribute('a', 1), RB.attribute('b', 2))
    ).build()
    const otherUuid = Record.getUuid(otherRecord)
    const otherNode = Node.getUuid(RecordUtils.findNodeByPath('root/a')(survey, otherRecord))
    const { deps, errors } = buildDeps({
      fetchRecord: async ({ recordUuid: uuid }) => {
        if (uuid === recordUuid) throw new Error('db down')
        return otherRecord
      },
    })
    const results = await run(
      admin,
      [edit(aUuid, 5), { recordUuid: otherUuid, nodeUuid: otherNode, from: 1, to: 5 }, edit(bUuid, 6)],
      deps
    )
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: NodesBatchMessageKeys.generic },
      { index: 1, status: 'applied' },
      { index: 2, status: 'failed', messageKey: NodesBatchMessageKeys.generic },
    ])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('db down')
  })
})
