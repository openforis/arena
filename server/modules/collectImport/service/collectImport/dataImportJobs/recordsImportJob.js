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

const CollectRecord = require('../model/collectRecord')
const CollectAttributeValueExtractor = require('./collectAttributeValueExtractor')

const CollectSurvey = require('../model/collectSurvey')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.getSurveyId(), this.tx)
  }

  async execute (tx) {
    const user = this.getUser()
    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, tx)

    /*
    //Survey node def children by parent cache

    this.nodeDefChildrenUuidByParentUuid = {}
    Survey.getNodeDefsArray(survey).forEach(nodeDef => {
      let childrenUuids = this.nodeDefChildrenUuidByParentUuid[NodeDef.getParentUuid(nodeDef)]
      if (!childrenUuids) {
        childrenUuids = []
        this.nodeDefChildrenUuidByParentUuid[NodeDef.getParentUuid(nodeDef)] = childrenUuids
      }
      childrenUuids.push(NodeDef.getUuid(nodeDef))
    })
    */
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
      const recordToCreate = Record.newRecord(user)
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
      const recordUuid = Record.getUuid(record)
      await RecordManager.updateRecordStep(surveyId, recordUuid, step, tx)
      // this.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes start`)
      const recordValidation = await this.traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson)
      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes end`)

      //persist validation
      // this.logDebug(`${entryName} persistValidation start`)
      await RecordManager.persistValidation(survey, record, recordValidation, this.tx)
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

  async traverseCollectRecordAndInsertNodes (survey, record, collectRecordJson) {
    const { nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const collectRootEntityName = R.pipe(
      R.keys,
      R.reject(R.equals('_declaration')),
      R.head,
    )(collectRecordJson)

    const collectRootEntity = collectRecordJson[collectRootEntityName]

    const recordUuid = Record.getUuid(record)
    let recordValidation = Record.getValidation(record)

    const collectRootEntityDefPath = `/${collectRootEntityName}`
    const collectRootEntityDef = CollectSurvey.getNodeDefByPath(collectRootEntityDefPath)(collectSurvey)

    const queue = new Queue([{
      nodeParent: null,
      collectNodeDef: collectRootEntityDef,
      collectNodeDefPath: collectRootEntityDefPath,
      collectNode: collectRootEntity
    }])

    while (!queue.isEmpty()) {

      const item = queue.dequeue()
      const { nodeParent, collectNodeDef, collectNodeDefPath, collectNode } = item

      const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, nodeParent)

      const valueAndMeta = NodeDef.isAttribute(nodeDef)
        ? await CollectAttributeValueExtractor.extractAttributeValueAndMeta(
          survey, nodeDef, record, nodeToInsert,
          collectSurveyFileZip, collectSurvey, collectNodeDef, collectNode,
          this.tx
        )
        : null

      const value = R.propOr(null, 'value', valueAndMeta)
      const meta = R.propOr({}, 'meta', valueAndMeta)

      nodeToInsert = Node.assocValue(value)(nodeToInsert)
      nodeToInsert = Node.assocMeta(meta)(nodeToInsert)

      await this._insertNode(nodeDef, nodeToInsert)

      if (NodeDef.isEntity(nodeDef)) {

        // create child nodes to insert
        const { nodesToInsert, childrenCountByNodeDefUuid } = this._createNodeChildrenToInsert(collectNode, collectNodeDef, collectNodeDefPath, nodeToInsert)

        queue.enqueueItems(nodesToInsert)

        recordValidation = await this._insertMissingNodesRecursivelyAndValidate(survey, nodeDef, nodeToInsert, childrenCountByNodeDefUuid, recordValidation, collectNodeDef, collectNodeDefPath)
      } else {
        const validationAttribute = RecordValidator.validateAttribute(nodeToInsert)
        recordValidation = Validator.assocFieldValidation(Node.getUuid(validationAttribute), validationAttribute)(recordValidation)
      }
    }

    return recordValidation

  }

  async _insertMissingNodesRecursivelyAndValidate (survey, nodeDefParent, nodeParent, childrenCountByNodeDefUuid, recordValidation, collectNodeDefParent, collectNodeDefParentPath) {
    const { nodeDefUuidByCollectPath } = this.context

    let nodeParentValidation = Validator.getFieldValidation(Node.getUuid(nodeParent))(recordValidation)

    /*
    const nodeDefChildren = this.nodeDefChildrenUuidByParentUuid[NodeDef.getUuid(nodeDefParent)].map(uuid => Survey.getNodeDefByUuid(uuid)(survey))
    //const nodeDefChildren = Survey.getNodeDefChildren(nodeDefParent)(survey)
    for (const nodeDefChild of nodeDefChildren) {
      const nodeDefChildUuid = NodeDef.getUuid(nodeDefChild)
    */
    const collectNodeDefChildren = CollectSurvey.getNodeDefChildren(collectNodeDefParent)

    for (const collectNodeDefChild of collectNodeDefChildren) {
      const collectNodeDefChildPath = collectNodeDefParentPath + '/' + CollectSurvey.getAttributeName(collectNodeDefChild)
      const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]
      const nodeDefChild = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

      const childrenCount = R.propOr(0, nodeDefChildUuid, childrenCountByNodeDefUuid)

      //validate min/max count
      if (NodeDefValidations.hasMinOrMaxCount(NodeDef.getValidations(nodeDefChild))) {
        const validationCount = RecordValidator.validateChildrenCount(survey, nodeParent, nodeDefChild, childrenCount)

        nodeParentValidation = R.mergeDeepLeft(validationCount)(nodeParentValidation)
        recordValidation = Validator.assocFieldValidation(Node.getUuid(nodeParent), nodeParentValidation)(recordValidation)
      }

      // consider only single node defs not inserted yet
      if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
        const nodeMissing = Node.newNode(nodeDefChildUuid, Node.getRecordUuid(nodeParent), nodeParent)

        await this._insertNode(nodeDefChild, nodeMissing)

        if (NodeDef.isEntity(nodeDefChild)) {
          recordValidation = await this._insertMissingNodesRecursivelyAndValidate(survey, nodeDefChild, nodeMissing, {}, recordValidation, collectNodeDefChild, collectNodeDefChildPath)
        }
      }
    }

    return recordValidation
  }

  _createNodeChildrenToInsert (collectNodeParent, collectNodeDef, collectNodeDefPathParent, nodeParent) {
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
        const collectChildNodes = CollectRecord.getNodeChildren([collectNodeDefChildName])(collectNodeParent)

        childrenCountByNodeDefUuid[nodeDefChildUuid] = collectChildNodes.length

        const collectNodeDefChild = CollectSurvey.getNodeDefChildByName(collectNodeDefChildName)(collectNodeDef)

        for (const collectChildNode of collectChildNodes) {
          if (this.isCanceled())
            break

          nodesToInsert.push({
            nodeParent,
            collectNodeDef: collectNodeDefChild,
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
    const surveyId = this.getSurveyId()
    await RecordManager.insertNodesFromValues(surveyId, nodeValues, tx)
  }

}

module.exports = RecordsImportJob