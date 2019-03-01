const parser = require('fast-xml-parser')
const FileZipUtils = require('../../../../common/file/fileZipUtils')

const Job = require('../../../job/job')

const idmlXmlFileName = 'idml.xml'

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
class SurveySchemaReaderJob extends Job {

  constructor (params) {
    super('SurveySchemaReaderJob', params)
  }

  async execute (tx) {

    const zipFile = await FileZipUtils.openFile(this.params.filePath)

    const idmlXml = await FileZipUtils.getEntryAsText(zipFile, idmlXmlFileName)

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

    this.setContext({zipFile, surveySource: idmlJsonObj.survey})

    console.log(this.context)
  }
}

module.exports = SurveySchemaReaderJob