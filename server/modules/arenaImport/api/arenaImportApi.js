import * as Request from '@server/utils/request'

import * as JobUtils from '@server/job/jobUtils'

import * as ArenaImportService from '../service/arenaImportService'

export const init = (app) => {
  // CREATE

  app.post('/survey/arena-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)

      const job = ArenaImportService.startArenaImportJob(user, file.tempFilePath)

      res.json({
        job: JobUtils.jobToJSON(job),
      })
    } catch (error) {
      next(error)
    }
  })
}
