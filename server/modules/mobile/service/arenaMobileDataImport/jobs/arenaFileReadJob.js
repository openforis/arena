import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'

export default class ArenaFileReadJob extends Job {
  constructor(params) {
    super(ArenaFileReadJob.type, params)
  }

  async execute() {
    const { context } = this
    const { filePath } = context

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    this.setContext({ arenaSurveyFileZip })
  }
}

ArenaFileReadJob.type = 'ArenaFileReadJob'
