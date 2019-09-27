const R = require('ramda')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../utils/file/fileXml')
const Queue = require('../../../../../../common/queue')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../../../common/survey/nodeDefValidations')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')
const RecordValidator = require('../../../../../../common/record/recordValidator')
const Validation = require('../../../../../../common/validation/validation')

const SystemError = require('../../../../../utils/systemError')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')

const Job = require('../../../../../job/job')

const CollectRecord = require('../model/collectRecord')
const CollectAttributeValueExtractor = require('./collectAttributeValueExtractor')

const CollectSurvey = require('../model/collectSurvey')

class RecordsImportJob extends Job {

  constructor (params) {
    super(RecordsImportJob.type, params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.surveyId, this.tx)
  }

  async execute () {
    const { surveyId, user, tx } = this

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, false, tx)

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

    for (const entryName of entryNames) {
      if (this.isCanceled())
        break

      // this.logDebug(`-- start import record ${entryName}`)

      // this.logDebug(`${entryName} findCollectRecordData start`)
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData
      // this.logDebug(`${entryName} findCollectRecordData done`)

      // this.logDebug(`${entryName} parseToJson start`)
      const collectRecordJson = FileXml.parseToJson(collectRecordXml)
      // this.logDebug(`${entryName} parseToJson done`)

      // this.logDebug(`${entryName} recordToCreate start`)
      const recordToCreate = Record.newRecord(user, false, CollectRecord.getDateCreated(collectRecordJson))
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
      const recordUuid = Record.getUuid(record)
      await RecordManager.updateRecordStep(surveyId, recordUuid, step, tx)
      // this.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes start`)
      const recordValidation = await this.traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson)
      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes end`)

      //persist validation
      // this.logDebug(`${entryName} persistValidation start`)
      await RecordManager.persistValidation(survey, record, recordValidation, tx)
      // this.logDebug(`${entryName} persistValidation end`)

      // this.logDebug(`-- end import record ${entryName}`)

      this.incrementProcessedItems()
    }
  }

  async beforeSuccess () {
    await this.batchPersister.flush(this.tx)
  }

  async beforeEnd () {
    await super.beforeEnd()
    await RecordManager.enableTriggers(this.surveyId, this.tx)
  }

  getEntryNames () {
    const { collectSurveyFileZip } = this.context

    const steps = [1, 2, 3]

    for (const step of steps) {
      const entryNames = collectSurveyFileZip.getEntryNames(`data/${step}/`)
      if (!R.isEmpty(entryNames))
        return entryNames
    }
    return []
  }

  findCollectRecordData (entryName) {
    const { collectSurveyFileZip } = this.context

    const steps = [3, 2, 1]

    for (const step of steps) {
      const collectRecordXml = collectSurveyFileZip.getEntryAsText(`data/${step}/${entryName}`)
      if (collectRecordXml) {
        return { collectRecordXml, step }
      }
    }

    throw new SystemError('entryDataNotFound', { entryName })
  }

  async traverseCollectRecordAndInsertNodes (survey, record, collectRecordJson) {
    const { nodeDefsInfoByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const recordUuid = Record.getUuid(record)
    let recordValidation = Record.getValidation(record)

    const collectRootEntityName = CollectRecord.getRootEntityName(collectRecordJson)
    const collectRootEntityDefPath = `/${collectRootEntityName}`
    const collectRootEntityDef = CollectSurvey.getNodeDefByPath(collectRootEntityDefPath)(collectSurvey)
    const collectRootEntity = CollectRecord.getRootEntity(collectRecordJson, collectRootEntityName)

    const queue = new Queue([{
      nodeParent: null,
      collectNodeDef: collectRootEntityDef,
      collectNodeDefPath: collectRootEntityDefPath,
      collectNode: collectRootEntity
    }])

    while (!queue.isEmpty()) {

      const item = queue.dequeue()
      const { nodeParent, collectNodeDef, collectNodeDefPath, collectNode } = item

      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefPath]

      for (const { uuid: nodeDefUuid, field } of nodeDefsInfo) {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

        let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, nodeParent)

        const valueAndMeta = NodeDef.isAttribute(nodeDef)
          ? await CollectAttributeValueExtractor.extractAttributeValueAndMeta(
            survey, nodeDef, record, nodeToInsert,
            collectSurveyFileZip, collectSurvey, collectNodeDef, collectNode, field,
            this.tx
          )
          : {}
        const { value = null, meta = {} } = valueAndMeta || {}

        nodeToInsert = R.pipe(
          Node.assocValue(value),
          Node.assocMeta(meta),
        )(nodeToInsert)

        await this._insertNode(nodeDef, nodeToInsert)

        if (NodeDef.isEntity(nodeDef)) {

          // create child nodes to insert
          const { nodesToInsert, validation } = this._createNodeChildrenToInsert(survey, collectNodeDef, collectNodeDefPath, collectNode, nodeToInsert, recordValidation)
          recordValidation = validation
          queue.enqueueItems(nodesToInsert)

        } else {
          const validationAttribute = RecordValidator.validateAttribute(nodeToInsert)
          if (!Validation.isValid(validationAttribute)) {
            Validation.setValid(false)(recordValidation)
            Validation.setField(Node.getUuid(nodeToInsert), validationAttribute)(recordValidation)
          }
        }
      }
    }

    return recordValidation

  }

  _createNodeChildrenToInsert (survey, collectNodeDef, collectNodeDefPath, collectNode, node, recordValidation) {
    const { nodeDefsInfoByCollectPath } = this.context

    //output
    const nodesToInsert = []

    const nodeUuid = Node.getUuid(node)
    let nodeValidation = Validation.getFieldValidation(nodeUuid)(recordValidation)

    const collectNodeDefChildren = CollectSurvey.getNodeDefChildren(collectNodeDef)
    for (const collectNodeDefChild of collectNodeDefChildren) {
      if (this.isCanceled())
        break

      const collectNodeDefChildName = CollectSurvey.getAttributeName(collectNodeDefChild)
      const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefChildPath]

      if (nodeDefsInfo) {
        const collectChildNodes = CollectRecord.getNodeChildren([collectNodeDefChildName])(collectNode)

        const childrenCount = collectChildNodes.length

        // if children count > 0
        for (const collectChildNode of collectChildNodes) {
          if (this.isCanceled())
            break

          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: collectChildNode
          })
        }

        //get nodeDefUuid from first nodeDef field
        const { uuid: nodeDefChildUuid } = nodeDefsInfo[0]
        const nodeDefChild = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

        //validate min/max count
        if (NodeDefValidations.hasMinOrMaxCount(NodeDef.getValidations(nodeDefChild))) {
          const validationCount = RecordValidator.validateChildrenCount(survey, node, nodeDefChild, childrenCount)

          if (!Validation.isValid(validationCount)) {
            Validation.setValid(false)(recordValidation)
            nodeValidation = R.mergeDeepRight(nodeValidation, validationCount)
            Validation.setField(nodeUuid, nodeValidation)(recordValidation)
          }

        }

        if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: {}
          })
        }
      } else {
        this.logError(`==== NodeDef not found for ${collectNodeDefChildPath}`)
      }
    }

    return {
      nodesToInsert,
      recordValidation
    }
  }

  async _insertNode (nodeDef, node) {
    node.dateCreated = new Date()
    const value = Node.getValue(node, null)

    const nodeValueInsert = [
      Node.getUuid(node),
      node.dateCreated,
      node.dateCreated,
      Node.getRecordUuid(node),
      Node.getParentUuid(node),
      NodeDef.getUuid(nodeDef),
      value === null || (NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef) || NodeDef.isCoordinate(nodeDef) || NodeDef.isFile(nodeDef))
        ? value
        : JSON.stringify(value),
      {
        ...Node.getMeta(node),
        [Node.metaKeys.childApplicability]: {}
      }
    ]

    await this.batchPersister.addItem(nodeValueInsert, this.tx)
  }

  async nodesBatchInsertHandler (nodeValues, tx) {
    await RecordManager.insertNodesFromValues(this.surveyId, nodeValues, tx)
  }

}

RecordsImportJob.type = 'RecordsImportJob'

module.exports = RecordsImportJob