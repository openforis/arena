import * as R from 'ramda'

import * as Log from '@server/log/log'

import { messageTypes } from './recordThreadMessageTypes'
import Thread from '@server/threads/thread'

import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordManager from '../../../manager/recordManager'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import Queue from '@core/queue'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

import * as RecordUpdateThreadParams from './recordUpdateThreadParams'
import SystemError from '@core/systemError'

const Logger = Log.getLogger('RecordUpdateThread')

class RecordUpdateThread extends Thread {

  constructor (paramsObj) {
    super(paramsObj)

    this.queue = new Queue()
    this.survey = null
    this.record = null
    this.processing = false

    this.sendThreadInitMsg()
  }

  sendThreadInitMsg () {
    (async () => {
      await this.messageHandler({ type: messageTypes.threadInit })
    })()
  }

  async handleNodesUpdated (updatedNodes) {
    if (!R.isEmpty(updatedNodes)) {
      this.postMessage({
        type: WebSocketEvents.nodesUpdate,
        content: updatedNodes
      })
    }
  }

  async handleNodesValidationUpdated (validations) {
    const recordUpdated = Record.mergeNodeValidations(validations)(this.record)

    this.postMessage({
      type: WebSocketEvents.nodeValidationsUpdate,
      content: {
        recordUuid: Record.getUuid(this.record),
        recordValid: Validation.isObjValid(recordUpdated),
        validations
      }
    })
  }

  async onMessage (msg) {
    this.queue.enqueue(msg)
    await this.processNext()
  }

  async processNext () {
    if (!this.processing && !this.queue.isEmpty()) {
      this.processing = true

      const msg = this.queue.dequeue()
      try {
        await this.processMessage(msg)
      } catch (e) {
        // SystemError is an expected error type, e.g. when there's a problem with expressions.
        if (e instanceof SystemError) {
          this.postMessage({
            type: WebSocketEvents.applicationError,
            content: {
              key: e.key,
              params: e.params,
            }
          })
          return // Stop processing
        } else {
          // Unexpected error: Crash and burn
          throw e
        }
      }

      this.processing = false
      await this.processNext()
    }
  }

  async initRecordAndSurvey () {
    // init record
    this.record = await RecordManager.fetchRecordAndNodesByUuid(this.surveyId, RecordUpdateThreadParams.getRecordUuid(this.params))

    // init survey
    const preview = Record.isPreview(this.record)
    const surveyDb = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, Record.getCycle(this.record), preview, true)

    // if in preview mode, unpublished dependencies have not been stored in the db, so we need to build them
    const dependencyGraph = preview
      ? Survey.buildDependencyGraph(surveyDb)
      : await SurveyManager.fetchDependencies(this.surveyId)

    this.survey = Survey.assocDependencyGraph(dependencyGraph)(surveyDb)
  }

  async processMessage (msg) {
    Logger.debug('process message', msg)

    switch (msg.type) {
      case messageTypes.threadInit:
        await this.initRecordAndSurvey()
        break

      case messageTypes.recordInit:
        this.record = await RecordManager.initNewRecord(
          this.user,
          this.survey,
          this.record,
          this.handleNodesUpdated.bind(this),
          this.handleNodesValidationUpdated.bind(this)
        )
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
    }

    if (R.includes(msg.type, [messageTypes.nodePersist, messageTypes.nodeDelete])) {
      this.postMessage({ type: WebSocketEvents.nodesUpdateCompleted })
    }
  }

}

new RecordUpdateThread()


