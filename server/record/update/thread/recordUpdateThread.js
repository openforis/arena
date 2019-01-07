const {isMainThread} = require('worker_threads')

const R = require('ramda')
const Promise = require('bluebird')

const db = require('../../../db/db')

const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const SurveyManager = require('../../../survey/surveyManager')
const NodeDefManager = require('../../../nodeDef/nodeDefManager')
const SurveyRdbManager = require('../../../surveyRdb/surveyRdbManager')

const NodeRepository = require('../../../record/nodeRepository')

const Survey = require('../../../../common/survey/survey')
const {toUuidIndexedObj} = require('../../../../common/survey/surveyUtils')
const Node = require('../../../../common/record/node')
const Queue = require('../../../../common/queue')

const DefaultValuesUpdater = require('./defaultValuesUpdater')
const ApplicableIfUpdater = require('./applicableIfIUpdater')

const RecordDependencyManager = require('../../recordDependencyManager')
const {dependencyTypes} = require('../../../survey/surveyDependenchyGraph')

class RecordUpdateThread extends Thread {

  constructor (params) {
    super(params)
    this.queue = new Queue()
    this.processing = false

    // init survey
    if (this.params.surveyId)
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.params.surveyId, false, true, false)
        .then(survey => this.survey = survey)
  }

  async onMessage (msg) {
    this.queue.enqueue(msg)

    await this.processNext()
  }

  async processNext () {
    if (!(this.processing || this.queue.isEmpty())) {

      this.processing = true

      const msg = this.queue.dequeue()
      await this.processMessage(msg)

      this.processing = false

      await this.processNext()
    }
  }

  async processMessage (msg) {
    await db.tx(async t => {
      const {user, surveyId} = msg

      let nodes = null

      switch (msg.type) {
        case messageTypes.createRecord:
          nodes = await RecordProcessor.createRecord(user, surveyId, msg.record, t)
          break
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(user, surveyId, msg.node, t)
          break
        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(user, surveyId, msg.nodeUuid, t)
          break
      }

      if (!isMainThread)
        this.postMessage(nodes)

      let allUpdatedNodes = R.clone(nodes)
      let updatedNodes = R.clone(nodes)
      let iterationCount = 0
      do {
        updatedNodes = await this.afterNodeValuesUpdated(user, updatedNodes, t)
        allUpdatedNodes = R.mergeRight(allUpdatedNodes, updatedNodes)
        iterationCount ++

        //console.log(iterationCount)
      } while (!R.isEmpty(updatedNodes) && iterationCount < 5)

      console.log(allUpdatedNodes)

      //update rdb data tables
      const nodeDefs = await NodeDefManager.fetchNodeDefsByUuid(surveyId, Node.getNodeDefUuids(allUpdatedNodes), false, false, t)
      await SurveyRdbManager.updateTableNodes(Survey.getSurveyInfo(this.survey), nodeDefs, allUpdatedNodes, t)
    })
  }

  async afterNodeValuesUpdated (user, nodes, t) {
    let updatedNodes = R.clone(nodes)

    //update applicability
    const nodesArray = R.values(nodes)
    const applicableUpdatedNodes = await ApplicableIfUpdater.updateNodesApplicability(user, this.survey, nodesArray, nodeUpdater, t)

    const dependentApplicableUpdatedNodes = R.mergeAll(
      await Promise.all(
        nodesArray.map(async node => {
          const dependents = await RecordDependencyManager.fetchDependentNodes(this.survey, node, dependencyTypes.applicable, t)
          return await ApplicableIfUpdater.updateNodesApplicability(user, this.survey, dependents, nodeUpdater, t)
        })
      )
    )

    const allApplicableUpdatedNodes = R.mergeRight(applicableUpdatedNodes, dependentApplicableUpdatedNodes)

    if (!R.isEmpty(allApplicableUpdatedNodes) && !isMainThread)
      this.postMessage(allApplicableUpdatedNodes)

    updatedNodes = R.mergeRight(updatedNodes, allApplicableUpdatedNodes)

    //apply default values
    const defaultValuesDependentNodes = R.mergeAll(
      await Promise.all(
        R.values(nodes).map(async node => {
          const dependents = await RecordDependencyManager.fetchDependentNodes(this.survey, node, dependencyTypes.defaultValues, t)
          return toUuidIndexedObj(dependents)
        })
      )
    )
    updatedNodes = R.mergeRight(updatedNodes, defaultValuesDependentNodes)

    const defaultValuesUpdatedNodes = await DefaultValuesUpdater.applyDefaultValues(user, this.survey, nodes, nodeUpdater, t)

    if (!R.isEmpty(defaultValuesUpdatedNodes) && !isMainThread)
      this.postMessage(defaultValuesUpdatedNodes)

    updatedNodes = R.mergeRight(updatedNodes, defaultValuesUpdatedNodes)

    return updatedNodes
  }
}

const nodeUpdater = {
  applyDefaultValue: async (user, surveyId, node, value, tx) =>
    await NodeRepository.updateNode(surveyId, node.uuid, value, {[Node.metaKeys.defaultValue]: true}, tx),

  updateApplicability: async (user, survey, node, applicable, tx) =>
    await NodeRepository.updateChildrenApplicability(Survey.getSurveyInfo(survey).id, Node.getParentUuid(node), Node.getNodeDefUuid(node), applicable, tx)
}

const newInstance = (params) => new RecordUpdateThread(params)

if (!isMainThread)
  newInstance()

module.exports = {
  newInstance
}