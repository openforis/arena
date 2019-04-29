const R = require('ramda')

const log = require('../../../../log/log')

const BatchPersister = require('../../../../../db/batchPersister')

const FileXml = require('../../../../../../common/file/fileXml')

const Survey = require('../../../../../../common/survey/survey')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const Record = require('../../../../../../common/record/record')
const Node = require('../../../../../../common/record/node')

const SurveyManager = require('../../../../survey/persistence/surveyManager')
const RecordManager = require('../../../../record/persistence/recordManager')
const RecordUpdateManager = require('../../../../record/persistence/recordUpdateManager')

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
    const surveyId = this.getSurveyId()
    await RecordManager.disableTriggers(surveyId, this.tx)
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

      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData

      const collectRecordJson = FileXml.parseToJson(collectRecordXml)

      const recordToCreate = Record.newRecord(user)
      const record = await RecordManager.insertRecord(surveyId, recordToCreate, tx)
      const recordUuid = Record.getUuid(record)
      await RecordUpdateManager.updateRecordStep(surveyId, recordUuid, step, tx)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.reject(R.equals('_declaration')),
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertNode(survey, recordUuid, null, `/${collectRootEntityName}`, collectRootEntity, tx)

      this.incrementProcessedItems()
    }
  }

  async onEnd () {
    await super.onEnd()

    await this.batchPersister.flush(this.tx)

    const surveyId = this.getSurveyId()

    await RecordManager.enableTriggers(surveyId, this.tx)
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

  async insertNode (survey, recordUuid, parentNode, collectNodeDefPath, collectNode, tx) {
    const { nodeDefUuidByCollectPath, collectSurveyFileZip, collectSurvey } = this.context

    const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

    let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, parentNode)

    if (NodeDef.isAttribute(nodeDef)) {
      const value = await CollectAttributeValueExtractor.extractAttributeValue(survey, nodeDef, nodeToInsert,
        collectSurveyFileZip, collectSurvey, collectNodeDefPath, collectNode, tx)
      nodeToInsert = Node.assocValue(value)(nodeToInsert)
    }

    await this.batchPersister.addItem(nodeToInsert, tx)

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

            await this.insertNode(survey, recordUuid, nodeToInsert, collectNodeDefChildPath, collectChildNode, tx)
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