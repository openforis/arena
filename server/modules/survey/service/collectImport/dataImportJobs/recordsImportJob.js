const R = require('ramda')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../../common/file/fileXml')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const RecordManager = require('../../../../record/persistence/recordManager')
const RecordUpdateManager = require('../../../../record/persistence/recordUpdateManager')
const NodeRepository = require('../../../../record/persistence/nodeRepository')

const Job = require('../../../../../job/job')

const CollectRecordParseUtils = require('../dataImportJobs/collectRecordParseUtils')
const CollectAttributeValueExtractor = require('../dataImportJobs/collectAttributeValueExtractor')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this))
  }

  async execute (tx) {
    const user = this.getUser()
    const surveyId = this.getSurveyId()

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, false, false, false, tx)

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

    for (const entryName of entryNames) {
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData

      const collectRecordJson = FileXml.parseToJson(collectRecordXml)

      const recordToCreate = Record.newRecord(user)
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
      await RecordUpdateManager.updateRecordStep(surveyId, Record.getUuid(record), step, tx)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.reject(R.equals('_declaration')),
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertNode(survey, record, null, `/${collectRootEntityName}`, collectRootEntity, tx)

      this.incrementProcessedItems()
    }

    await this.batchPersister.flush(tx)
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

  async insertNode (survey, record, parentNode, collectNodeDefPath, collectNode, tx) {
    const { nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const parentNodeUuid = Node.getUuid(parentNode)

    let nodeToInsert = Node.newNode(nodeDefUuid, Record.getUuid(record), parentNodeUuid)

    if (NodeDef.isNodeDefAttribute(nodeDef)) {
      const value = await CollectAttributeValueExtractor.extractAttributeValue(survey, nodeDef, nodeToInsert,
        collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, tx)
      nodeToInsert = Node.assocValue(value)(nodeToInsert)
    }

    const hierarchy = parentNode
      ? R.append(parentNodeUuid, Node.getHierarchy(parentNode))
      : []
    await this.batchPersister.addItem({hierarchy, node: nodeToInsert}, tx)

    record = Record.assocNode(nodeToInsert)(record)

    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const collectNodeDefChildNames = R.pipe(
        R.keys,
        //R.reject(R.equals('_attributes'))
      )(collectNode)

      for (const collectNodeDefChildName of collectNodeDefChildNames) {
        const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
        const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

        if (nodeDefChildUuid) {
          const collectChildNodes = CollectRecordParseUtils.getList([collectNodeDefChildName])(collectNode)
          for (const collectChildNode of collectChildNodes) {
            record = await this.insertNode(survey, record, Node.getUuid(nodeToInsert), collectNodeDefChildPath, collectChildNode, tx)
          }
        }
      }
    }

    return record
  }

  async nodesBatchInsertHandler (nodesAndHierarchy, tx) {
    const surveyId = this.getSurveyId()

    await NodeRepository.insertNodes(surveyId, nodesAndHierarchy, tx)
  }

}

module.exports = RecordsImportJob