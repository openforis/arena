import { Objects, SystemError } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'

import Thread from '@server/threads/thread'
import IdleTimeoutCache from '@server/utils/IdleTimeoutCache'

import Queue from '@core/queue'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordManager from '../../../manager/recordManager'
import { RecordsUpdateThreadMessageTypes } from './recordsThreadMessageTypes'

const Logger = Log.getLogger('RecordsUpdateThread')

// Maximum time to wait for another dyno to release a record's advisory lock.
// There's a single RecordsUpdateThread per dyno processing messages one at a time, so an unbounded
// wait would stall every record edit on this dyno behind one slow record held elsewhere.
const recordLockTimeoutMs = 10000

// Postgres error code for "lock_not_available" (raised when lock_timeout expires)
const pgErrorCodeLockNotAvailable = '55P03'

// Serializes record mutations across dynos: acquires a transaction-scoped Postgres advisory
// lock keyed by recordUuid, runs fn with that transaction's client, and lets the lock be
// auto-released on commit/rollback.
const acquireRecordLockAndRun = ({ recordUuid, fn }) =>
  db.tx(async (t) => {
    await t.none('SET LOCAL lock_timeout = $1', [`${recordLockTimeoutMs}ms`])
    try {
      await t.any('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
      return await fn(t)
    } catch (error) {
      if (error?.code === pgErrorCodeLockNotAvailable) {
        // Some other transaction (another dyno's records thread waiting on the advisory lock, or
        // any other writer holding row locks on this record) kept this record locked for too long.
        // The timeout applies to the whole transaction, so map it - wherever it comes from - to an
        // expected, recoverable condition (see processNext's SystemError handling), so that only
        // this message fails instead of crashing the whole thread.
        throw new SystemError('record.lockTimeout', { recordUuid })
      }
      throw error
    }
  })

// Exported only so that tests can instantiate the thread class directly (in the main thread,
// overriding postMessage): the module still creates and initializes the real worker instance below.
export class RecordsUpdateThread extends Thread {
  constructor(paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.surveysDataCache = new IdleTimeoutCache()
    this.processing = false

    this.messageProcessorByType = {
      [RecordsUpdateThreadMessageTypes.recordInit]: this.processRecordInitMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.recordReload]: this.processRecordReloadMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.nodePersist]: this.processRecordNodePersistMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.nodeDelete]: this.processRecordNodeDeleteMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.recordClear]: this.processRecordClearMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.surveyClear]: this.processSurveyClearMsg.bind(this),
      [RecordsUpdateThreadMessageTypes.threadKill]: this.postMessage.bind(this),
    }
  }

  init() {
    // do nothing
  }

  async handleNodesUpdated({ record, updatedNodes }) {
    if (!Objects.isEmpty(updatedNodes)) {
      const recordUuid = Record.getUuid(record)
      this.postMessage({
        type: WebSocketEvent.nodesUpdate,
        content: {
          recordUuid,
          updatedNodes,
        },
      })
    }
  }

  async handleNodesValidationUpdated({ record, validations }) {
    const recordUpdated = Record.mergeNodeValidations(validations)(record)

    this.postMessage({
      type: WebSocketEvent.nodeValidationsUpdate,
      content: {
        recordUuid: Record.getUuid(record),
        recordValid: Validation.isObjValid(recordUpdated),
        validations,
      },
    })
  }

  async onMessage(msg) {
    this.queue.enqueue(msg)
    await this.processNext()
  }

  async processNext() {
    if (!this.processing && !this.queue.isEmpty()) {
      this.processing = true

      const msg = this.queue.dequeue()
      try {
        await this.processMessage(msg)
      } catch (error) {
        // SystemError is an expected error type, e.g. when there's a problem with expressions.
        if (error instanceof SystemError) {
          const recordUuid = msg.recordUuid ?? msg.node?.recordUuid
          const { key, params } = error
          const nestedError = params.error
          if (nestedError && nestedError instanceof SystemError) {
            params.error = { key: nestedError.key, params: nestedError.params }
          }
          this.postMessage({
            type: WebSocketEvent.applicationError,
            content: {
              key,
              params,
              recordUuid,
            },
          })
          return // Stop processing
        }
        // Unexpected error: Crash and burn
        throw error
      } finally {
        this.processing = false
      }
      await this.processNext()
    }
  }

  getSurveyDataKey(msg) {
    const { surveyId, cycle, draft } = msg
    return `${surveyId}_${cycle}_${draft}`
  }

  async getOrFetchSurveyData(msg) {
    const { surveyId, cycle, draft } = msg

    const key = this.getSurveyDataKey(msg)

    let data = this.surveysDataCache.get(key)
    if (data) {
      return data
    }

    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      cycle,
      draft,
      advanced: true,
      includeBigCategories: false,
      includeBigTaxonomies: false,
    })

    // always rebuild dependency graph to ensure it's up to date
    const dependencyGraph = await Survey.buildDependencyGraph(surveyDb)

    const survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)

    data = {
      survey,
      recordsCache: new IdleTimeoutCache(),
    }
    this.surveysDataCache.set(key, data)

    return data
  }

  async processMessage(msg) {
    const { type } = msg
    Logger.debug('processing message', type)

    const messageProcessor = this.messageProcessorByType[type]
    if (messageProcessor) {
      await messageProcessor(msg)

      if ([RecordsUpdateThreadMessageTypes.nodePersist, RecordsUpdateThreadMessageTypes.nodeDelete].includes(type)) {
        const recordUuid = msg.recordUuid ?? msg.node?.recordUuid
        this.postMessage({ type: WebSocketEvent.nodesUpdateCompleted, content: { recordUuid } })
      }
    } else {
      Logger.debug(`Skipping unknown message type: ${type}`)
    }
  }

  async processRecordInitMsg(msg) {
    const { surveyId, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, t)

        record = await RecordManager.initNewRecord(
          {
            user,
            survey,
            record,
            timezoneOffset,
            nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated.bind(this)({ record, updatedNodes }),
            nodesValidationListener: (validations) =>
              this.handleNodesValidationUpdated.bind(this)({ record, validations }),
          },
          t
        )
        await this.cacheRecordWithDbDateModified({ surveyId, recordUuid, record, recordsCache, t })
      },
    })
  }

  async processRecordReloadMsg(msg) {
    const { surveyId, recordUuid, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    if (!recordsCache.has(recordUuid)) return

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user }, t)
        recordsCache.set(recordUuid, record)
      },
    })
  }

  async processRecordNodePersistMsg(msg) {
    const { surveyId, node, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    const recordUuid = Node.getRecordUuid(node)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await this.getOrFetchRecord({ msg, recordUuid, t })

        record = await RecordManager.persistNode(
          {
            user,
            survey,
            record,
            node,
            timezoneOffset,
            nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
            nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
          },
          t
        )
        await this.cacheRecordWithDbDateModified({ surveyId, recordUuid, record, recordsCache, t })
      },
    })
  }

  async processRecordNodeDeleteMsg(msg) {
    const { surveyId, nodeUuid, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    await acquireRecordLockAndRun({
      recordUuid,
      fn: async (t) => {
        let record = await this.getOrFetchRecord({ msg, recordUuid, t })
        record = await RecordManager.deleteNode(
          user,
          survey,
          record,
          nodeUuid,
          timezoneOffset,
          (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
          (validations) => this.handleNodesValidationUpdated({ record, validations }),
          t
        )
        await this.cacheRecordWithDbDateModified({ surveyId, recordUuid, record, recordsCache, t })
      },
    })
  }

  async processRecordClearMsg(msg) {
    const { recordUuid } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)
    recordsCache.delete(recordUuid)

    if (recordsCache.isEmpty()) {
      await this.processSurveyClearMsg(msg)
    }
  }

  async processSurveyClearMsg(msg) {
    const { surveyId, cycle } = msg

    const keysToDelete = []

    if (!Objects.isNil(cycle)) {
      const key = this.getSurveyDataKey(msg)
      keysToDelete.push(key)
    } else {
      const keyPrefix = `${surveyId}_`
      keysToDelete.push(...this.surveysDataCache.findKeys((key) => key.startsWith(keyPrefix)))
    }
    keysToDelete.forEach((key) => {
      this.surveysDataCache.delete(key)
    })
  }

  /**
   * Caches a record that has just been written inside the current transaction, stamping onto it the
   * authoritative date_modified produced by that write.
   *
   * The in-memory dateModified is stamped before validations and the RDB persistence run, while the
   * DB one is written afterwards: without this reconciliation the two always differ and
   * getOrFetchRecord's staleness check would consider the cached record stale on every single write,
   * forcing a full record reload on the next message.
   * @param {!object} params - The parameters.
   * @param {!number} params.surveyId - The survey id.
   * @param {!string} params.recordUuid - The record uuid.
   * @param {!object} params.record - The record to cache.
   * @param {!object} params.recordsCache - The cache to store the record into.
   * @param {!object} params.t - The transaction client used by the write.
   * @returns {Promise<void>} - A promise resolved when the record has been cached.
   */
  async cacheRecordWithDbDateModified({ surveyId, recordUuid, record, recordsCache, t }) {
    const dateModified = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid }, t)
    recordsCache.set(recordUuid, dateModified ? Record.assocDateModified(dateModified)(record) : record)
  }

  async getOrFetchRecord({ msg, recordUuid, t }) {
    const { surveyId, user } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    const cachedRecord = recordsCache.get(recordUuid)
    const dbDateModified = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid }, t)

    const cachedDateModified = cachedRecord ? Record.getDateModified(cachedRecord) : null
    const isCacheFresh =
      cachedRecord && dbDateModified && cachedDateModified && cachedDateModified.getTime() === dbDateModified.getTime()

    if (isCacheFresh) {
      return cachedRecord
    }

    // No cached copy, or another dyno committed a change since this dyno cached the record - refetch.
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, user }, t)
    recordsCache.set(recordUuid, record)
    return record
  }
}

const thread = new RecordsUpdateThread()
thread.init()
