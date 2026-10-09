import { SystemError as ArenaSystemError } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import {
  NodesBatchProcessorDeps,
  processNodesBatch,
} from '@server/modules/record/service/update/nodesBatch/nodesBatchProcessor'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const user = { uuid: 'user-uuid' }

describe('processNodesBatch', () => {
  let survey: any
  let record: any
  let recordUuid: string
  let aUuid: string
  let bUuid: string
  let cUuid: string

  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity(
        'root',
        SB.attribute('root_key').key(),
        SB.attribute('a', NodeDef.nodeDefType.integer),
        SB.attribute('b', NodeDef.nodeDefType.integer),
        SB.attribute('c', NodeDef.nodeDefType.integer)
      )
    ).build()
    record = RB.record(
      user,
      survey,
      RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('a', 1), RB.attribute('b', 2), RB.attribute('c', 3))
    ).build()
    recordUuid = Record.getUuid(record)
    aUuid = Node.getUuid(RecordUtils.findNodeByPath('root/a')(survey, record))
    bUuid = Node.getUuid(RecordUtils.findNodeByPath('root/b')(survey, record))
    cUuid = Node.getUuid(RecordUtils.findNodeByPath('root/c')(survey, record))
  })

  const msgOf = (edits: unknown[]) => ({
    type: 'nodesBatchPersist',
    requestId: 'req-1',
    user,
    surveyId: 1,
    cycle: '0',
    draft: false as const,
    recordUuid,
    edits: edits as any,
    timezoneOffset: 0,
    lang: 'en',
  })

  // in-memory stand-ins for the thread: persistNode merges the node and notifies the listeners
  const createDeps = ({
    failOnNodeUuid = null,
    validationFor = () => ({}),
    lockError = null,
    recordInDb = record,
    nodeRecordUuids = {},
  }: {
    failOnNodeUuid?: string | null
    validationFor?: (node: any) => any
    lockError?: Error | null
    recordInDb?: any
    nodeRecordUuids?: Record<string, string>
  } = {}) => {
    const posted: any[] = []
    const errors: string[] = []
    const calls = { cacheRecord: 0, clearCachedRecord: 0, persistNode: 0, insideLock: false, postedInsideLock: 0 }
    const deps: NodesBatchProcessorDeps = {
      getSurvey: async () => survey,
      runWithRecordLock: async (_recordUuid, fn) => {
        if (lockError) throw lockError
        calls.insideLock = true
        try {
          return await fn('tx')
        } finally {
          calls.insideLock = false
        }
      },
      getOrFetchRecord: async () => recordInDb,
      findNodeRecordUuid: async ({ nodeUuid, t }) => {
        expect(t).toBe('tx')
        return nodeRecordUuids[nodeUuid] ?? null
      },
      logError: (message) => {
        errors.push(message)
      },
      persistNode: async (
        { record: recordParam, node, nodesUpdateListener, nodesValidationListener }: any,
        t: unknown
      ) => {
        expect(t).toBe('tx')
        calls.persistNode += 1
        if (Node.getUuid(node) === failOnNodeUuid) throw new Error('boom')
        nodesUpdateListener({ [Node.getUuid(node)]: node })
        nodesValidationListener(validationFor(node))
        return Record.assocNode(node)(recordParam)
      },
      cacheRecord: async () => {
        calls.cacheRecord += 1
      },
      clearCachedRecord: async () => {
        calls.clearCachedRecord += 1
      },
      postMessage: (message: any) => {
        if (calls.insideLock) calls.postedInsideLock += 1
        posted.push(message)
      },
    }
    return { deps, posted, calls, errors }
  }

  test('applies the matching edits, refuses the changed ones, and posts events after commit', async () => {
    const { deps, posted, calls } = createDeps()
    const results = await processNodesBatch({
      msg: msgOf([
        { index: 4, nodeUuid: aUuid, from: 1, to: 10 },
        { index: 1, nodeUuid: bUuid, from: 99, to: 20 },
      ]),
      deps,
    })
    expect(results).toEqual([
      { index: 1, status: 'conflict' },
      { index: 4, status: 'applied' },
    ])
    expect(calls.persistNode).toBe(1)
    expect(calls.cacheRecord).toBe(1)
    expect(calls.postedInsideLock).toBe(0)
    expect(posted.map((message) => message.type)).toEqual([
      'nodesUpdate',
      'nodeValidationsUpdate',
      'nodesUpdateCompleted',
    ])
    expect(posted[0].content.recordUuid).toBe(recordUuid)
    expect(posted[2].content).toEqual({ recordUuid })
  })

  test('a persist error rolls back the record: applied and pending edits fail, conflicts stay, no events', async () => {
    const { deps, posted, calls, errors } = createDeps({ failOnNodeUuid: bUuid })
    const results = await processNodesBatch({
      msg: msgOf([
        { index: 0, nodeUuid: aUuid, from: 1, to: 10 },
        { index: 1, nodeUuid: cUuid, from: 99, to: 30 },
        { index: 2, nodeUuid: bUuid, from: 2, to: 20 },
        { index: 3, nodeUuid: 'unchecked-node', from: null, to: 1 },
      ]),
      deps,
    })
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'appErrors:generic', params: { text: 'boom' } },
      { index: 1, status: 'conflict' },
      { index: 2, status: 'failed', messageKey: 'appErrors:generic', params: { text: 'boom' } },
      { index: 3, status: 'failed', messageKey: 'appErrors:generic', params: { text: 'boom' } },
    ])
    expect(posted).toEqual([])
    expect(calls.cacheRecord).toBe(0)
    expect(calls.clearCachedRecord).toBe(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('boom')
  })

  test('a lock timeout fails every edit with appErrors:record.lockTimeout', async () => {
    const { deps } = createDeps({ lockError: new ArenaSystemError('record.lockTimeout', { recordUuid }) })
    const results = await processNodesBatch({ msg: msgOf([{ index: 0, nodeUuid: aUuid, from: 1, to: 2 }]), deps })
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'appErrors:record.lockTimeout', params: { recordUuid } },
    ])
  })

  test('a record key duplicate on the edited node rolls the record back with the validation key', async () => {
    const { deps, posted } = createDeps({
      validationFor: (node) =>
        Validation.newInstance(false, { [Node.getUuid(node)]: RecordValidation.newValidationRecordDuplicate() }),
    })
    const results = await processNodesBatch({ msg: msgOf([{ index: 0, nodeUuid: aUuid, from: 1, to: 2 }]), deps })
    expect(results).toEqual([{ index: 0, status: 'failed', messageKey: 'validationErrors:record.keyDuplicate' }])
    expect(posted).toEqual([])
  })

  test('a record deleted since the proposal: every edit is a conflict', async () => {
    const { deps, posted } = createDeps({ recordInDb: null })
    const results = await processNodesBatch({ msg: msgOf([{ index: 0, nodeUuid: aUuid, from: 1, to: 2 }]), deps })
    expect(results).toEqual([{ index: 0, status: 'conflict' }])
    expect(posted).toEqual([])
  })

  test('nothing applied: no nodesUpdateCompleted and no cache write', async () => {
    const { deps, posted, calls } = createDeps()
    await processNodesBatch({ msg: msgOf([{ index: 0, nodeUuid: aUuid, from: 5, to: 2 }]), deps })
    expect(posted).toEqual([])
    expect(calls.cacheRecord).toBe(0)
  })

  test('a node of another record fails with nodeNotInRecord; a node that exists nowhere is a conflict', async () => {
    const { deps, posted } = createDeps({ nodeRecordUuids: { 'foreign-node': 'other-record-uuid' } })
    const results = await processNodesBatch({
      msg: msgOf([
        { index: 0, nodeUuid: 'foreign-node', from: 1, to: 2 },
        { index: 1, nodeUuid: 'gone-node', from: 1, to: 2 },
      ]),
      deps,
    })
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'appErrors:record.nodeNotInRecord' },
      { index: 1, status: 'conflict' },
    ])
    expect(posted).toEqual([])
  })

  test('a node deleted from this very record stays a conflict', async () => {
    const { deps } = createDeps({ nodeRecordUuids: { 'deleted-node': recordUuid } })
    const results = await processNodesBatch({
      msg: msgOf([{ index: 0, nodeUuid: 'deleted-node', from: 1, to: 2 }]),
      deps,
    })
    expect(results).toEqual([{ index: 0, status: 'conflict' }])
  })

  test('a duplicate on the second edit rolls back the first one too: both fail, cache cleared, no events', async () => {
    const { deps, posted, calls } = createDeps({
      validationFor: (node) =>
        Node.getUuid(node) === bUuid
          ? Validation.newInstance(false, { [bUuid]: RecordValidation.newValidationRecordDuplicate() })
          : {},
    })
    const results = await processNodesBatch({
      msg: msgOf([
        { index: 0, nodeUuid: aUuid, from: 1, to: 10 },
        { index: 1, nodeUuid: bUuid, from: 2, to: 20 },
      ]),
      deps,
    })
    expect(results).toEqual([
      { index: 0, status: 'failed', messageKey: 'validationErrors:record.keyDuplicate' },
      { index: 1, status: 'failed', messageKey: 'validationErrors:record.keyDuplicate' },
    ])
    expect(calls.clearCachedRecord).toBe(1)
    expect(calls.cacheRecord).toBe(0)
    expect(posted).toEqual([])
  })
})
