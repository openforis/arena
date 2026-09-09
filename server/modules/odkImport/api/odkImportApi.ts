import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as Request from '@server/utils/request'

import * as OdkImportService from '../service/odkImportService'

export const init = (app: any) => {
  // CREATE

  app.post('/survey/odk-import', async (req: any, res: any, next: any) => {
    try {
      const tempFile = await processChunkedFileForBackgroundMerge({ req })
      if (tempFile) {
        const user = Request.getUser(req)
        const newSurvey = Request.getJsonParam(req, 'survey', {})

        const job = OdkImportService.startOdkImportJob({ user, ...tempFile, newSurvey })
        res.json({ job: JobUtils.jobToJSON(job) })
      } else {
        res.json({ chunkProcessing: true })
      }
    } catch (error) {
      next(error)
    }
  })
}
