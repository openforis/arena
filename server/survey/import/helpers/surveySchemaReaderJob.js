const { xml2js } = require('xml-js')
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

    const zip = await ZipFileUtils.openFile(this.params.filePath)

    const idmlXml = await ZipFileUtils.readEntry(zip, 'idml.xml')
    const idmlSource = xml2js(idmlXml, { compact: true, spaces: 4 })

    this.context.surveySource = idmlSource.survey
  }
}

module.exports = SurveySchemaReaderJob