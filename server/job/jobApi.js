import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'

import * as JobManager from './jobManager'

export const init = (app) => {
  app.get('/jobs/active', async (req, res) => {
    const jobSummary = JobManager.getActiveJobSummary(Request.getUserUuid(req))
    res.json(jobSummary)
  })

  app.get('/jobs/:jobUuid', async (req, res) => {
    const { jobUuid } = Request.getParams(req)
    const jobSummary = JobManager.getJobSummary(jobUuid)
    res.json(jobSummary)
  })

  app.delete('/jobs/active', async (req, res) => {
    await JobManager.cancelActiveJobByUserUuid(Request.getUserUuid(req))

    Response.sendOk(res)
  })
}
