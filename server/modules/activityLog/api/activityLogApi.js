import * as R from 'ramda'

import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'

export const init = app => {
  // ==== READ

  app.get(`/survey/:surveyId/activity-log`, AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, offset, limit } = Request.getParams(req)
      const activityTypes = Request.getJsonParam(req, 'activityTypes', [])

      const activities = await ActivityLogService.fetch(surveyId, activityTypes, R.clamp(0, NaN, offset), R.clamp(30, 100, limit))

      res.json({ activities })
    } catch (err) {
      next(err)
    }
  })
}