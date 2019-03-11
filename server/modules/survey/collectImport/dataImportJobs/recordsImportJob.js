const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const Record = require('../../../../../common/record/record')

const RecordManager = require('../../../record/persistence/recordManager')
const RecordUpdateManager = require('../../../record/persistence/recordUpdateManager')

const Job = require('../../../../job/job')

const CollectIdmlParseUtils = require('../metaImportJobs/collectIdmlParseUtils')

class RecordsImportJob extends Job {

  constructor (params) {
    super('RecordsImportJob', params)
  }

  async execute (tx) {
    const { user, surveyId } = this.params
    const { collectSurveyFileZip, nodeDefUuidByCollectPath } = this.context

    const entryNames = collectSurveyFileZip.getEntryNames('data/1/')

    console.log(entryNames)

    for (const entryName of entryNames) {
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData

      const collectRecordJson = CollectIdmlParseUtils.parseXmlToJson(collectRecordXml)

      const recordToCreate = Record.newRecord(user)
      const record = await RecordUpdateManager.createRecord(user, surveyId, recordToCreate)

      const collectRootEntityName = R.pipe(
        R.keys,
        R.head,
      )(collectRecordJson)

      const collectRootEntity = collectRecordJson[collectRootEntityName]

      await this.insertEntityNodes(collectRootEntityName, collectRootEntity)
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

  insertEntityNodes (collectParentNodeDefPath, collectEntity) {
    const { nodeDefUuidByCollectPath } = this.context

    for (const collectNodeName of R.keys(collectEntity)) {
      const collectNodeDefPath = collectParentNodeDefPath + '/' + collectNodeName
      const nodeDefUuid = nodeDefUuidByCollectPath[collectNodeDefPath]
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      if (NodeDef.isNodeDefEntity(nodeDef)) {

      } else {

      }
    }
  }
}

module.exports = RecordsImportJob