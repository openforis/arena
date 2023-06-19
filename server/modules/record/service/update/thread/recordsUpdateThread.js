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

const Logger = Log.getLogger('RecordsUpdateThread')

class RecordsUpdateThread extends Thread {
  constructor(paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.survey = null
    this.record = null
    this.processing = false
  }

  sendThreadInitMsg() {
    ;(async () => {
      await this.messageHandler({ type: RecordsUpdateThreadMessageTypes.threadInit })
    })()
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

  async init() {
    const { surveyId, cycle, draft } = this.params

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

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)

    this.recordsByUuid = {}
  }

  async processMessage(msg) {
    const { type } = msg
    Logger.debug('processing message', type)

    switch (type) {
      case RecordsUpdateThreadMessageTypes.threadInit:
        await this.init()
        break
      case RecordsUpdateThreadMessageTypes.recordInit:
        await this.processRecordInitMsg(msg)
        break
      case RecordsUpdateThreadMessageTypes.nodePersist:
        await this.processRecordNodePersistMsg(msg)
        break
      case RecordsUpdateThreadMessageTypes.nodeDelete:
        await this.processRecordNodeDeleteMsg(msg)
        break
      case RecordsUpdateThreadMessageTypes.threadKill:
        this.postMessage(msg)
        break
      default:
        Logger.debug(`Skipping unknown message type: ${type}`)
    }

    if ([RecordsUpdateThreadMessageTypes.nodePersist, RecordsUpdateThreadMessageTypes.nodeDelete].includes(type)) {
      const recordUuid = msg.recordUuid || msg.node?.recordUuid
      this.postMessage({ type: WebSocketEvent.nodesUpdateCompleted, content: { recordUuid } })
    }
  }

  async processRecordInitMsg(msg) {
    const { survey, surveyId } = this
    const { recordUuid, user } = msg

    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })

    record = await RecordManager.initNewRecord({
      user,
      survey,
      record,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated.bind(this)({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated.bind(this)({ record, validations }),
    })
    this.recordsByUuid[recordUuid] = record
  }

  async processRecordNodePersistMsg(msg) {
    const { survey } = this
    const { node, user } = msg
    const recordUuid = Node.getRecordUuid(node)
    let record = await this.getOrFetchRecord({ recordUuid })
    record = await RecordManager.persistNode({
      user,
      survey,
      record,
      node,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
    })
    this.recordsByUuid[recordUuid] = record
  }

  async processRecordNodeDeleteMsg(msg) {
    const { survey } = this
    const { nodeUuid, recordUuid, user } = msg

    let record = await this.getOrFetchRecord({ recordUuid })
    record = await RecordManager.deleteNode(
      user,
      survey,
      record,
      nodeUuid,
      (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      (validations) => this.handleNodesValidationUpdated({ record, validations })
    )
    this.recordsByUuid[recordUuid] = record
  }

  async getOrFetchRecord({ recordUuid }) {
    const { surveyId, recordsByUuid } = this
    let record = recordsByUuid[recordUuid]
    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
      recordsByUuid[recordUuid] = record
    }
    return record
  }
}

const thread = new RecordsUpdateThread()
thread.sendThreadInitMsg()
