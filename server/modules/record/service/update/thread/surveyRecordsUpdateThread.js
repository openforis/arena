import { Objects, SRSs, SystemError } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import Thread from '@server/threads/thread'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import Queue from '@core/queue'

import * as RecordManager from '../../../manager/recordManager'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import { messageTypes } from './recordThreadMessageTypes'

const Logger = Log.getLogger('SurveyRecordsUpdateThread')

class SurveyRecordsUpdateThread extends Thread {
  constructor(paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.survey = null
    this.record = null
    this.processing = false

    this.handleNodesUpdated = this.handleNodesUpdated.bind(this)
    this.handleNodesValidationUpdated = this.handleNodesValidationUpdated.bind(this)
  }

  sendThreadInitMsg() {
    ;(async () => {
      await this.messageHandler({ type: messageTypes.threadInit })
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
      }

      this.processing = false
      await this.processNext()
    }
  }

  async init() {
    // Init SRSs
    await SRSs.init()

    const { surveyId, cycle, draft } = this

    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      cycle,
      draft,
      advanced: true,
    })

    // If in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = draft
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(this.surveyId)

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)

    this.recordsByUuid = {}
  }

  async processRecordInitMsg(msg) {
    const { survey, surveyId } = this
    const { recordUuid, user } = msg
    let record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })
    record = await RecordManager.initNewRecord({
      user,
      survey,
      record,
      nodesUpdateListener: (updatedNodes) => this.handleNodesUpdated({ record, updatedNodes }),
      nodesValidationListener: (validations) => this.handleNodesValidationUpdated({ record, validations }),
    })
    this.recordsByUuid[recordUuid] = record
  }

  async processRecordNodePersistMsg(msg) {
    const { survey } = this
    const { node, recordUuid, user } = msg
    let record = this.recordsByUuid[recordUuid]
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

    let record = this.recordsByUuid[recordUuid]
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

  async processMessage(msg) {
    Logger.debug('process message', msg)
    const { type } = msg

    switch (type) {
      case messageTypes.threadInit:
        await this.init()
        break
      case messageTypes.recordInit:
        await this.processRecordInitMsg(msg)
        break
      case messageTypes.nodePersist:
        await this.processRecordNodePersistMsg(msg)
        break
      case messageTypes.nodeDelete:
        await this.processRecordNodeDeleteMsg(msg)
        break
      case messageTypes.threadKill:
        this.postMessage(msg)
        break
      default:
        Logger.debug(`Skipping unknown message type: ${type}`)
    }

    if ([messageTypes.nodePersist, messageTypes.nodeDelete].includes(type)) {
      this.postMessage({ type: WebSocketEvent.nodesUpdateCompleted })
    }
  }
}

const thread = new SurveyRecordsUpdateThread()
thread.sendThreadInitMsg()
