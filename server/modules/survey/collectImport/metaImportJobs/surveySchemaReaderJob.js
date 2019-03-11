const FileZip = require('../../../../../common/file/fileZip')

const Job = require('../../../../job/job')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

const idmlXmlFileName = 'idml.xml'

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
class SurveySchemaReaderJob extends Job {

  constructor (params) {
    super('SurveySchemaReaderJob', params)
  }

  async execute (tx) {
    const collectSurveyFileZip = new FileZip(this.params.filePath)
    await collectSurveyFileZip.init()

    const idmlXml = await collectSurveyFileZip.getEntryAsText(idmlXmlFileName)
    const idmlJsonObj = CollectIdmlParseUtils.parseXmlToJson(idmlXml)

    this.setContext({ collectSurveyFileZip, collectSurvey: idmlJsonObj.survey })
  }
}

module.exports = SurveySchemaReaderJob