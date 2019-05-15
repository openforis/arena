const R = require('ramda')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../../common/file/fileXml')
const Queue = require('../../../../../../common/queue')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const SurveyManager = require('../../../../survey/manager/surveyManager')
const RecordManager = require('../../../../record/manager/recordManager')

const Job = require('../../../../../job/job')

const CollectRecordParseUtils = require('./collectRecordParseUtils')
const CollectAttributeValueExtractor = require('./collectAttributeValueExtractor')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 1000)
  }

  async onStart () {
    await super.onStart()
    await RecordManager.disableTriggers(this.getSurveyId(), this.tx)
  }

  async execute (tx) {
    const user = this.getUser()
    const surveyId = this.getSurveyId()

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, false, false, false, tx)

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
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
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
      await this.insertNodes(survey, record, collectRootEntityName, collectRootEntity)
      // this.logDebug(`${entryName} insertNode end`)

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

    const {
      nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey,
      surveyIndex
    } = this.context

    // init record nodes
    record.nodes = {}
    const recordUuid = Record.getUuid(record)

    const queue = new Queue([{
      parentNode: null,
      collectNodeDefPath: `/${collectRootEntityName}`,
      collectNode: collectRootEntity
    }])

    while (!queue.isEmpty()) {

      const item = queue.dequeue()
      const { parentNode, collectNodeDefPath, collectNode } = item

      const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

      let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, parentNode)

      if (NodeDef.isAttribute(nodeDef)) {
        const value = await CollectAttributeValueExtractor.extractAttributeValue(
          survey, nodeDef, record, nodeToInsert, surveyIndex,
          collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode,
          this.tx
        )
        nodeToInsert = Node.assocValue(value)(nodeToInsert)
      }

      await this.batchPersister.addItem(nodeToInsert, this.tx)
      record.nodes[Node.getUuid(nodeToInsert)] = nodeToInsert

      if (NodeDef.isEntity(nodeDef)) {
        const collectNodeDefChildNames = R.pipe(
          R.keys,
          R.reject(R.equals('_attributes'))
        )(collectNode)

        for (const collectNodeDefChildName of collectNodeDefChildNames) {
          if (this.isCanceled())
            break

          const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
          const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

          if (nodeDefChildUuid) {
            const collectChildNodes = CollectRecordParseUtils.getList([collectNodeDefChildName])(collectNode)
            for (const collectChildNode of collectChildNodes) {
              if (this.isCanceled())
                break

              queue.enqueue({
                parentNode: nodeToInsert,
                collectNodeDefPath: collectNodeDefChildPath,
                collectNode: collectChildNode
              })

            }
          }
        }
      }

    }

  }

  async nodesBatchInsertHandler (nodes, tx) {
    const surveyId = this.getSurveyId()
    await RecordManager.insertNodes(surveyId, nodes, tx)
  }

}

module.exports = RecordsImportJob