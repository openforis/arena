import * as Request from '@server/utils/request'

/*import * as JobUtils from '@server/job/jobUtils'

import { db } from '@server/db/db'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyService from '@server/modules/survey/service/surveyService'
import * as Response from '@server/utils/response'

import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as CollectImportService from '../service/collectImportService'
import * as AuthMiddleware from '../../auth/authApiMiddleware'*/

export const init = (app) => {
  // CREATE

  app.post('/survey/arena-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)

      //const job = CollectImportService.startCollectImportJob(user, file.tempFilePath)

      res.json({
        job: file.tempFilePath,
        //JobUtils.jobToJSON(job)
      })
    } catch (error) {
      next(error)
    }
  })
}
