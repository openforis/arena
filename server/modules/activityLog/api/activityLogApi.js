import * as Request from '@server/utils/request'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as ActivityLogService from '../service/activityLogService'
import { parseActivityLogFetchParams } from './activityLogParams'

export const init = (app) => {
  // ==== READ
  /**
   * Fetches a list of activity logs (30 items by default, see the limit param) grouped by user, type, content uuid.
   * Params:
   * - idGreaterThan : specify it to fetch newest activities
   *                   (fetched activities will have an id greater than the specified value)
   * - limit         : max number of items (1-1000, default 30)
   * - idLessThan    : specify it to fetch older activities
   *                   (fetched activities will have an id less than the specified value)
   *
   * If neither idGreaterThan nor idLessThan are specified, the last 30 activities will be fetched.
   */
  app.get('/survey/:surveyId/activity-log', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const params = Request.getParams(req)
      const { idGreaterThan, idLessThan, limit } = parseActivityLogFetchParams(params)
      const user = Request.getUser(req)

      const activityLogs = await ActivityLogService.fetch({
        user,
        surveyId: params.surveyId,
        idGreaterThan,
        idLessThan,
        limit,
      })

      res.json({ activityLogs })
    } catch (error) {
      next(error)
    }
  })
}
