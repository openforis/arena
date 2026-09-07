import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'

import { checkArenaMobileVersionSupported } from '../arenaMobileVersionCompatibility'

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

    const info = await ArenaSurveyFileZip.getInfo(arenaSurveyFileZip)
    checkArenaMobileVersionSupported({ info })
  }
}

ArenaFileReadJob.type = 'ArenaFileReadJob'
