import FileZip from '@server/utils/file/fileZip'

import Job from '@server/job/job'

/**
 * Reads the schema from a Arena backup file and saves it into the job context under idmlSource property.
 */
export default class ArenaSurveyReaderJob extends Job {
  constructor(params) {
    super('ArenaSurveyReaderJob', params)
  }

  async execute() {
    const filePath = this.getContextProp('filePath')

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    const arenaSurvey = await arenaSurveyFileZip.getEntryAsText('survey.json')

    this.setContext({ arenaSurveyFileZip, arenaSurvey })
  }
}
