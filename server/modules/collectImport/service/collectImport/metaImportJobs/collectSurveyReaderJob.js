import FileZip from '@server/utils/file/fileZip'
import * as FileXml from '@server/utils/file/fileXml'

import Job from '@server/job/job'

import * as CollectSurvey from '../model/collectSurvey'

const idmlXmlFileName = 'idml.xml'

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
export default class CollectSurveyReaderJob extends Job {
  constructor(params) {
    super('CollectSurveyReaderJob', params)
  }

  async execute() {
    const filePath = this.getContextProp('filePath')

    const collectSurveyFileZip = new FileZip(filePath)
    await collectSurveyFileZip.init()

    const idmlXml = collectSurveyFileZip.getEntryAsText(idmlXmlFileName)
    const idmlJsonObj = FileXml.parseToJson(idmlXml, false)
    const collectSurvey = CollectSurvey.getElementByName('survey')(idmlJsonObj)

    this.setContext({ collectSurveyFileZip, collectSurvey })
  }
}
