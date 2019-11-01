import * as R from 'ramda'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'

export const init = app => {
  // ==== READ

  app.get(`/survey/:surveyId/activity-log`, AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, offset, limit } = Request.getParams(req)
      const user = Request.getUser(req)

      const activityLogs = await ActivityLogService.fetch(user, surveyId, draft, R.clamp(0, NaN, offset), R.clamp(30, 100, limit))

      res.json({ activityLogs })
    } catch (err) {
      next(err)
    }
  })
}