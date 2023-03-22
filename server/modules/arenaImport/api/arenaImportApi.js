import * as Survey from '@core/survey/survey'

import * as Request from '@server/utils/request'

import * as JobUtils from '@server/job/jobUtils'

import * as ArenaImportService from '../service/arenaImportService'

export const init = (app) => {
  // CREATE

  app.post('/survey/arena-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const filePath = Request.getFilePath(req)
      const newSurveyParams = Request.getJsonParam(req, 'survey')

      const { name, options } = newSurveyParams

      const surveyInfoTarget = Survey.newSurvey({ ownerUuid: user.uuid, name })

      const job = ArenaImportService.startArenaImportJob({ user, filePath, surveyInfoTarget, options })

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })
}
