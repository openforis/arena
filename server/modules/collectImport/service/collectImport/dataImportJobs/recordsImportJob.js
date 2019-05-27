const R = require('ramda')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../../common/file/fileXml')
const Queue = require('../../../../../../common/queue')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../../../common/survey/nodeDefValidations')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')
const RecordValidator = require('../../../../../../common/record/recordValidator')
const Validator = require('../../../../../../common/validation/validator')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')

const Job = require('../../../../../job/job')

const CollectRecordParseUtils = require('./collectRecordParseUtils')
const CollectAttributeValueExtractor = require('./collectAttributeValueExtractor')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)

    // this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 1)
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.getSurveyId(), this.tx)
  }

  async execute (tx) {
    const user = this.getUser()
    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, tx)

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

    for (const entryName of entryNames) {
      if (this.isCanceled())
        break

      this.logDebug(`-- start import record ${entryName}`)

      // this.logDebug(`${entryName} findCollectRecordData start`)
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData
      // this.logDebug(`${entryName} findCollectRecordData done`)

      // this.logDebug(`${entryName} parseToJson start`)
      const collectRecordJson = FileXml.parseToJson(collectRecordXml)
      // this.logDebug(`${entryName} parseToJson done`)

      // this.logDebug(`${entryName} recordToCreate start`)
      const recordToCreate = Record.newRecord(user)
      let record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
      const recordUuid = Record.getUuid(record)
      await RecordManager.updateRecordStep(surveyId, recordUuid, step, tx)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.reject(R.equals('_declaration')),
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]
      // this.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} insertNode start`)
      record = await this.insertNodes(survey, record, collectRootEntityName, collectRootEntity)
      // this.logDebug(`${entryName} insertNode end`)

      /*
      const validationRecordKeys = RecordManager.validateRecordKeysUniqueness(survey, record, this.tx)
      const validation = Record.mergeNodeValidations(validationRecordKeys)(record)
      */
      //persist validation
      await RecordManager.persistValidation(survey, record, Record.getValidation(record), this.tx)

      this.logDebug(`-- end import record ${entryName}`)

      this.incrementProcessedItems()
    }
  }

  async beforeSuccess () {
    await this.batchPersister.flush(this.tx)
  }

  async beforeEnd () {
    await super.beforeEnd()
    await RecordManager.enableTriggers(this.getSurveyId(), this.tx)
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

    throw new Error(`Entry data not found: ${entryName}`)
  }

  async insertNodes (survey, record, collectRootEntityName, collectRootEntity) {

    const { nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    let recordValidation = {}

    // init record nodes
    record.nodes = {}
    const recordUuid = Record.getUuid(record)

    const queue = new Queue([{
      nodeParent: null,
      collectNodeDefPath: `/${collectRootEntityName}`,
      collectNode: collectRootEntity
    }])

    while (!queue.isEmpty()) {

      const item = queue.dequeue()
      const { nodeParent, collectNodeDefPath, collectNode } = item

      const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      const nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, nodeParent)

      const valueAndMeta = NodeDef.isAttribute(nodeDef)
        ? await CollectAttributeValueExtractor.extractAttributeValueAndMeta(
          survey, nodeDef, record, nodeToInsert,
          collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode,
          this.tx
        )
        : null

      const value = R.prop('value', valueAndMeta)
      const meta = R.prop('meta', valueAndMeta)

      // create insert values and add them to batch persister
      const nodeValueInsert = _createNodeValueInsert(nodeDef, nodeToInsert, value, meta)
      await this.batchPersister.addItem(nodeValueInsert, this.tx)

      // assoc node to record
      record.nodes[Node.getUuid(nodeToInsert)] = nodeToInsert

      if (NodeDef.isEntity(nodeDef)) {

        // create child nodes to insert
        const { nodesToInsert, childrenCountByNodeDefUuid } = this._createNodeChildrenToInsert(collectNode, collectNodeDefPath, nodeToInsert)

        queue.enqueueItems(nodesToInsert)

        record = await this._insertMissingNodesRecursivelyAndValidate(survey, nodeDef, childrenCountByNodeDefUuid, record, nodeToInsert)
      }
    }

    return record

  }

  async _insertMissingNodesRecursivelyAndValidate (survey, nodeDefParent, childrenCountByNodeDefUuid, record, nodeParent) {
    let nodeParentValidation = {}

    const nodeDefChildren = Survey.getNodeDefChildren(nodeDefParent)(survey)
    for (const nodeDefChild of nodeDefChildren) {
      const nodeDefChildUuid = NodeDef.getUuid(nodeDefChild)

      const childrenCount = R.propOr(0, nodeDefChildUuid, childrenCountByNodeDefUuid)

      if (NodeDefValidations.hasMinOrMaxCount(NodeDef.getValidations(nodeDefChild))) {
        const validationCount = RecordValidator.validateChildrenCount(survey, nodeParent, nodeDefChild, childrenCount)

        nodeParentValidation = R.mergeDeepLeft(validationCount)(nodeParentValidation)
      }

      // consider only single node defs not inserted yet
      if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
        const nodeMissing = Node.newNode(nodeDefChildUuid, Record.getUuid(record), nodeParent)

        record.nodes[Node.getUuid(nodeMissing)] = nodeMissing
        // create insert values and add them to batch persister
        await this.batchPersister.addItem(_createNodeValueInsert(nodeDefChild, nodeMissing), this.tx)

        if (NodeDef.isEntity(nodeDefChild)) {
          record = await this._insertMissingNodesRecursivelyAndValidate(survey, nodeDefChild, {}, record, nodeMissing)
        }
      }
    }

    record = Record.mergeNodeValidations({
      [Node.getUuid(nodeParent)]: nodeParentValidation
    })(record)

    return record
  }

  _createNodeChildrenToInsert (collectNodeParent, collectNodeDefPathParent, nodeParent) {
    const { nodeDefUuidByCollectPath } = this.context

    //output
    const nodesToInsert = []
    const childrenCountByNodeDefUuid = {}

    const collectNodeDefChildNames = R.pipe(
      R.keys,
      R.reject(R.equals('_attributes'))
    )(collectNodeParent)

    for (const collectNodeDefChildName of collectNodeDefChildNames) {
      if (this.isCanceled())
        break

      const collectNodeDefChildPath = collectNodeDefPathParent + '/' + collectNodeDefChildName
      const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

      if (nodeDefChildUuid) {
        const collectChildNodes = CollectRecordParseUtils.getList([collectNodeDefChildName])(collectNodeParent)

        childrenCountByNodeDefUuid[nodeDefChildUuid] = collectChildNodes.length

        for (const collectChildNode of collectChildNodes) {
          if (this.isCanceled())
            break

          nodesToInsert.push({
            nodeParent,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: collectChildNode
          })
        }
      }
    }

    return {
      nodesToInsert,
      childrenCountByNodeDefUuid
    }
  }

  async nodesBatchInsertHandler (nodeValues, tx) {
    const surveyId = this.getSurveyId()
    await RecordManager.insertNodesFromValues(surveyId, nodeValues, tx)
  }

}

const _createNodeValueInsert = (nodeDef, node, value = null, meta = null) => {
  node.dateCreated = new Date()

  return [
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
      ...meta,
      [Node.metaKeys.childApplicability]: {}
    }
  ]
}

module.exports = RecordsImportJob