const parser = require('fast-xml-parser')
const ZipFileUtils = require('../../../../common/zipFileUtils')

const Job = require('../../../job/job')

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
class SurveySchemaReaderJob extends Job {

  constructor (params) {
    super('SurveySchemaReaderJob', params)
  }

  async execute (tx) {

    const zipFile = await ZipFileUtils.openFile(this.params.filePath)

    this.context.zipFile = zipFile

    const idmlXml = await ZipFileUtils.getEntryAsText(zipFile, 'idml.xml')

    const options = {
      attrNodeName: '_attr',
      attributeNamePrefix: '',
      textNodeName: '_text',
      ignoreAttributes: false,
      format: false,
      indentBy: '  ',
    }
    const tObj = parser.getTraversalObj(idmlXml, options)
    const jsonObj = parser.convertToJson(tObj, options)

    this.context.surveySource = jsonObj.survey
  }
}

module.exports = SurveySchemaReaderJob