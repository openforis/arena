import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'

export const init = app => {
  // ==== READ

  app.get(`/survey/:surveyId/activity-log`, AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId, offset } = Request.getParams(req)
      const activityTypes = Request.getJsonParam(req, 'activityTypes', [])

      const activities = await ActivityLogService.fetch(surveyId, activityTypes, offset)

      res.json({ activities })
    } catch (err) {
      next(err)
    }
  })
}