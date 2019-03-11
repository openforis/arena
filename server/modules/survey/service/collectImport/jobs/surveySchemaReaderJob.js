const parser = require('fast-xml-parser')
const FileZip = require('../../../../../../common/file/fileZip')

const Job = require('../../../../../job/job')

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

    const options = {
      attrNodeName: '_attr',
      attributeNamePrefix: '',
      textNodeName: '_text',
      ignoreAttributes: false,
      format: false,
      indentBy: '  ',
    }
    const idmlTraversalObj = parser.getTraversalObj(idmlXml, options)
    const idmlJsonObj = parser.convertToJson(idmlTraversalObj, options)

    this.setContext({ collectSurveyFileZip, collectSurvey: idmlJsonObj.survey })
  }
}

module.exports = SurveySchemaReaderJob