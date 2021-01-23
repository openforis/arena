import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'

export const init = (app) => {
  // ==== READ
  /**
   * Fetches a list of activity logs (limited to 30 items) grouped by user, type, content uuid.
   * Params:
   * - idGreaterThan : specify it to fetch newest activities
   *                   (fetched activities will have an id greater than the specified value)
   * - idLessThan    : specify it to fetch older activities
   *                   (fetched activities will have an id less than the specified value)
   *
   * If neither idGreaterThan nor idLessThan are specified, the last 30 activities will be fetched.
   */
  app.get('/survey/:surveyId/activity-log', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, idGreaterThan, idLessThan } = Request.getParams(req)
      const user = Request.getUser(req)

      const activityLogs = await ActivityLogService.fetch({ user, surveyId, idGreaterThan, idLessThan })

      res.json({ activityLogs })
    } catch (error) {
      next(error)
    }
  })
}
