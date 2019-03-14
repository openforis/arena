const FileZip = require('../../../../../../common/file/fileZip')
const FileXml = require('../../../../../../common/file/fileXml')

const Job = require('../../../../../job/job')

const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

const idmlXmlFileName = 'idml.xml'

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
class CollectSurveyReaderJob extends Job {

  constructor (params) {
    super('CollectSurveyReaderJob', params)
  }

  async execute (tx) {
    const filePath = this.getContextProp('filePath')

    const collectSurveyFileZip = new FileZip(filePath)
    await collectSurveyFileZip.init()

    const idmlXml = await collectSurveyFileZip.getEntryAsText(idmlXmlFileName)
    const idmlJsonObj = FileXml.parseToJson(idmlXml, false)
    const collectSurvey = CollectIdmlParseUtils.getElementByName('survey')(idmlJsonObj)

    this.setContext({ collectSurveyFileZip, collectSurvey })
  }
}

module.exports = CollectSurveyReaderJob