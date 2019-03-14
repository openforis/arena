const R = require('ramda')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const RecordManager = require('../../../../record/persistence/recordManager')
const NodeRepository = require('../../../../record/persistence/nodeRepository')

const Job = require('../../../../../job/job')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')
const CollectAttributeValueExtractor = require('../dataImportJobs/collectAttributeValueExtractor')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)
  }

  async execute (tx) {
    const user = this.getUser()
    const { collectSurveyFileZip, surveyId } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, false, false, false, tx)

    const entryNames = collectSurveyFileZip.getEntryNames('data/1/')

    this.total = entryNames.length

    for (const entryName of entryNames) {
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData

      const collectRecordJson = CollectIdmlParseUtils.parseXmlToJson(collectRecordXml)

      const recordToCreate = Record.newRecord(user)
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.reject(R.equals('_declaration')),
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertNode(survey, record, null, `/${collectRootEntityName}`, collectRootEntity, tx)

      this.incrementProcessedItems()
    }
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

  async insertNode (survey, record, parentUuid, collectNodeDefPath, collectNode, tx) {
    const { nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    let nodeToInsert = Node.newNode(nodeDefUuid, Record.getUuid(record), parentUuid)

    if (NodeDef.isNodeDefAttribute(nodeDef)) {
      const value = await CollectAttributeValueExtractor.extractAttributeValue(survey, nodeDef, nodeToInsert,
        collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, tx)
      nodeToInsert = Node.assocValue(value)(nodeToInsert)
    }

    const node = await NodeRepository.insertNode(Survey.getId(survey), nodeToInsert, tx)
    record = Record.assocNode(node)(record)

    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const collectNodeDefChildNames = R.pipe(
        R.keys,
        R.reject(R.equals('_attributes'))
      )(collectNode)

      for (const collectNodeDefChildName of collectNodeDefChildNames) {
        const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
        const nodeDefChildUuid = nodeDefUuidByCollectPath[collectNodeDefChildPath]

        if (nodeDefChildUuid) {
          const collectChildNodes = CollectIdmlParseUtils.getList([collectNodeDefChildName])(collectNode)
          for (const collectChildNode of collectChildNodes) {
            record = await this.insertNode(survey, record, Node.getUuid(node), collectNodeDefChildPath, collectChildNode, tx)
          }
        }
      }
    }
    return record
  }

}

module.exports = RecordsImportJob