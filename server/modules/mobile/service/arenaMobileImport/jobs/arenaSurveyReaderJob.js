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
    const { filePath } = this.context

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    this.setContext({ arenaSurveyFileZip })
  }
}
