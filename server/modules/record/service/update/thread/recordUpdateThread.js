import * as R from 'ramda'

import { SRSs, SystemError } from '@openforis/arena-core'
import { WebSocketEvent } from '@openforis/arena-server'

import * as Log from '@server/log/log'

import Thread from '@server/threads/thread'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import Queue from '@core/queue'

import * as RecordManager from '../../../manager/recordManager'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordUpdateThreadParams from './recordUpdateThreadParams'
import { messageTypes } from './recordThreadMessageTypes'

const Logger = Log.getLogger('RecordUpdateThread')

class RecordUpdateThread extends Thread {
  constructor(paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.survey = null
    this.record = null
    this.processing = false
  }

  sendThreadInitMsg() {
    ;(async () => {
      await this.messageHandler({ type: messageTypes.threadInit })
    })()
  }

  async handleNodesUpdated(updatedNodes) {
    if (!R.isEmpty(updatedNodes)) {
      this.postMessage({
        type: WebSocketEvent.nodesUpdate,
        content: updatedNodes,
      })
    }
  }

  async handleNodesValidationUpdated(validations) {
    const recordUpdated = Record.mergeNodeValidations(validations)(this.record)

    this.postMessage({
      type: WebSocketEvent.nodeValidationsUpdate,
      content: {
        recordUuid: Record.getUuid(this.record),
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

    // Init record
    this.record = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId: this.surveyId,
      recordUuid: RecordUpdateThreadParams.getRecordUuid(this.params),
    })

    // Init survey
    const preview = Record.isPreview(this.record)
    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId: this.surveyId,
      cycle: Record.getCycle(this.record),
      draft: preview,
      advanced: true,
    })

    // If in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = preview
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(this.surveyId)

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
  }

  async processMessage(msg) {
    Logger.debug('process message', msg)

    switch (msg.type) {
      case messageTypes.threadInit:
        await this.init()
        break

      case messageTypes.recordInit:
        this.record = await RecordManager.initNewRecord({
          user: this.user,
          survey: this.survey,
          record: this.record,
          nodesUpdateListener: this.handleNodesUpdated.bind(this),
          nodesValidationListener: this.handleNodesValidationUpdated.bind(this),
        })
        break

      case messageTypes.nodePersist:
        this.record = await RecordManager.persistNode(
          msg.user,
          this.survey,
          this.record,
          msg.node,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.nodeDelete:
        this.record = await RecordManager.deleteNode(
          msg.user,
          this.survey,
          this.record,
          msg.nodeUuid,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
        break

      case messageTypes.threadKill:
        this.postMessage(msg)
        break

      default:
        Logger.debug(`Skipping unknown message type: ${msg.type}`)
    }

    if (R.includes(msg.type, [messageTypes.nodePersist, messageTypes.nodeDelete])) {
      this.postMessage({ type: WebSocketEvent.nodesUpdateCompleted })
    }
  }
}

const thread = new RecordUpdateThread()
thread.sendThreadInitMsg()
