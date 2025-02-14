import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as JobManager from './jobManager'

export const init = (app) => {
  app.get('/jobs/active', async (req, res, next) => {
    try {
      const jobSummary = JobManager.getActiveJobSummary(Request.getUserUuid(req))
      res.json(jobSummary)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/jobs/active', async (req, res, next) => {
    try {
      await JobManager.cancelActiveJobByUserUuid(Request.getUserUuid(req))
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })

  app.delete('/jobs/all/:uuid', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { uuid: jobUuid } = Request.getParams(req)
      await JobManager.cancelJob({ user, jobUuid })
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
  })
}
