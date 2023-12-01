import { Objects, SystemError } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import Thread from '@server/threads/thread'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import Queue from '@core/queue'

import * as RecordManager from '../../../manager/recordManager'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import { RecordsUpdateThreadMessageTypes } from './recordsThreadMessageTypes'
import IdleTimeoutCache from './IdleTimeoutCache'

const Logger = Log.getLogger('RecordsUpdateThread')

class RecordsUpdateThread extends Thread {
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
          this.postMessage({
            type: WebSocketEvent.applicationError,
            content: {
              key: error.key,
              params: error.params,
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
    })

    // If in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = draft
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(surveyId)

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

    console.log('===init record', recordUuid)
    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })

    console.log('===record1', record)

    record = await RecordManager.initNewRecord({
      user,
      survey,
      record,
      timezoneOffset,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated.bind(this)({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated.bind(this)({ record, validations }),
    })
    console.log('===record2', record)
    recordsCache.set(recordUuid, record)
  }

  async processRecordReloadMsg(msg) {
    const { surveyId, recordUuid } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    if (recordsCache.has(recordUuid)) {
      const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
      recordsCache.set(recordUuid, record)
    }
  }

  async processRecordNodePersistMsg(msg) {
    const { node, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    const recordUuid = Node.getRecordUuid(node)
    let record = await this.getOrFetchRecord({ msg, recordUuid })

    record = await RecordManager.persistNode({
      user,
      survey,
      record,
      node,
      timezoneOffset,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
    })
    recordsCache.set(recordUuid, record)
  }

  async processRecordNodeDeleteMsg(msg) {
    const { nodeUuid, recordUuid, user, timezoneOffset } = msg

    const { survey, recordsCache } = await this.getOrFetchSurveyData(msg)

    let record = await this.getOrFetchRecord({ msg, recordUuid })
    record = await RecordManager.deleteNode(
      user,
      survey,
      record,
      nodeUuid,
      timezoneOffset,
      (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      (validations) => this.handleNodesValidationUpdated({ record, validations })
    )
    recordsCache.set(recordUuid, record)
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

    let keysToDelete = []

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

  async getOrFetchRecord({ msg, recordUuid }) {
    const { surveyId } = msg

    const { recordsCache } = await this.getOrFetchSurveyData(msg)

    let record = recordsCache.get(recordUuid)

    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
      recordsCache.set(recordUuid, record)
    }
    return record
  }
}

const thread = new RecordsUpdateThread()
thread.init()
