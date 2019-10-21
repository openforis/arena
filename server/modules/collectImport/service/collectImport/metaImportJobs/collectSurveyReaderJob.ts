import FileZip from '../../../../../utils/file/fileZip'
import FileXml from '../../../../../utils/file/fileXml'

import Job from '../../../../../job/job'

import CollectSurvey from '../model/collectSurvey'

const idmlXmlFileName = 'idml.xml'

/**
 * Reads the schema from a Collect backup file and saves it into the job context under idmlSource property
 */
export default class CollectSurveyReaderJob extends Job {
  static type: string = 'CollectSurveyReaderJob'

  constructor (params?) {
    super(CollectSurveyReaderJob.type, params)
  }

  async execute (tx) {
    const filePath = this.getContextProp('filePath')

    const collectSurveyFileZip = new FileZip(filePath)
    await collectSurveyFileZip.init()

    const idmlXml = await collectSurveyFileZip.getEntryAsText(idmlXmlFileName)
    const idmlJsonObj = FileXml.parseToJson(idmlXml, false)
    const collectSurvey = CollectSurvey.getElementByName('survey')(idmlJsonObj)

    this.setContext({ collectSurveyFileZip, collectSurvey })
  }
}
