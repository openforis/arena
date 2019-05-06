const Response = require('../../../utils/response')
const Request = require('../../../utils/request')

const CollectImportService = require('../service/collectImportService')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const JobUtils = require('../../../job/jobUtils')

module.exports.init = app => {

  // CREATE

  app.post('/survey/collect-import', async (req, res) => {
    try {
      const user = Request.getSessionUser(req)
      const file = Request.getFile(req)

      const job = CollectImportService.startCollectImportJob(user, file.tempFilePath)

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // READ

  app.get(`/survey/:surveyId/collect-import/report`, AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { surveyId } = Request.getParams(req)

      const items = await CollectImportService.fetchReportItems(surveyId)

      res.json({ items })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get(`/survey/:surveyId/collect-import/report/count`, AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { surveyId } = Request.getParams(req)

      const count = await CollectImportService.countReportItems(surveyId)

      res.json({ count })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // UPDATE

  app.post(`/survey/:surveyId/collect-import/report/:itemId/resolve`, AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { surveyId, itemId, resolved } = Request.getParams(req)
      const user = Request.getSessionUser(req)

      const item = await CollectImportService.updateReportItem(user, surveyId, itemId, {}, resolved)

      return res.json({ item })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}