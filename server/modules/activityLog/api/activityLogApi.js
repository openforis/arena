import * as R from 'ramda'

import * as Request from '@server/utils/request'
import * as ActivityLogService from '../service/activityLogService'

export const init = app => {
  // ==== READ

  app.get(`/survey/:surveyId/activity-log`, async (req, res, next) => {
    try {
      const { surveyId, offset, limit } = Request.getParams(req)
      const user = Request.getUser(req)

      const activities = await ActivityLogService.fetch(user, surveyId, R.clamp(0, NaN, offset), R.clamp(30, 100, limit))

      res.json({ activities })
    } catch (err) {
      next(err)
    }
  })
}