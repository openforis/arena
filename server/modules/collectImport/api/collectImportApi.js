import * as Request from '@server/utils/request'

import * as JobUtils from '@server/job/jobUtils'
import * as CollectImportService from '../service/collectImportService'

import * as AuthMiddleware from '../../auth/authApiMiddleware'

export const init = app => {
  // CREATE

  app.post('/survey/collect-import', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const file = Request.getFile(req)

      const job = CollectImportService.startCollectImportJob(
        user,
        file.tempFilePath,
      )

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  // READ

  app.get(
    '/survey/:surveyId/collect-import/report',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)

        const items = await CollectImportService.fetchReportItems(surveyId)

        res.json({ items })
      } catch (error) {
        next(error)
      }
    },
  )

  app.get(
    '/survey/:surveyId/collect-import/report/count',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)

        const count = await CollectImportService.countReportItems(surveyId)

        res.json({ count })
      } catch (error) {
        next(error)
      }
    },
  )

  // UPDATE

  app.post(
    '/survey/:surveyId/collect-import/report/:itemId/resolve',
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        const { surveyId, itemId, resolved } = Request.getParams(req)
        const user = Request.getUser(req)

        const item = await CollectImportService.updateReportItem(
          user,
          surveyId,
          itemId,
          {},
          resolved,
        )

        return res.json({ item })
      } catch (error) {
        next(error)
      }
    },
  )
}
