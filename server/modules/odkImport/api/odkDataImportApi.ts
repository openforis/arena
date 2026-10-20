import * as JobUtils from '@server/job/jobUtils'
import { processChunkedFileForBackgroundMerge } from '@server/modules/file/service/requestChunkedFileProcessor'
import * as Request from '@server/utils/request'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as OdkDataImportService from '../service/odkDataImportService'

// No preview/summary endpoint yet (deferred - see the Phase 2 plan doc); this starts the real import
// directly, mirroring mobileApi.js's POST /mobile/survey/:surveyId shape minus the preview/reuse-file
// params it doesn't need yet.
export const init = (app: any) => {
  app.post(
    '/odk-import/survey/:surveyId',
    AuthMiddleware.requireRecordCreatePermission,
    async (req: any, res: any, next: any) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle } = Request.getParams(req)

        const tempFile = await processChunkedFileForBackgroundMerge({ req })
        if (tempFile) {
          const job = OdkDataImportService.startOdkDataImportJob({ user, surveyId, cycle, ...tempFile })
          res.json({ job: JobUtils.jobToJSON(job) })
        } else {
          res.json({ chunkProcessing: true })
        }
      } catch (error) {
        next(error)
      }
    }
  )
}
