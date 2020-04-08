import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'

export const init = (app) => {
  // ==== READ

  app.get('/survey/:surveyId/activity-log', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, idGreaterThan, idLessThan } = Request.getParams(req)
      const user = Request.getUser(req)

      const activityLogs = await ActivityLogService.fetch(user, surveyId, idGreaterThan, idLessThan)

      res.json({ activityLogs })
    } catch (error) {
      next(error)
    }
  })
}
