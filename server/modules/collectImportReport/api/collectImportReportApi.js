const Response = require('../../../utils/response')
const Request = require('../../../utils/request')

const CollectImportReportService = require('../../collectImportReport/service/collectImportReportService')

const AuthMiddleware = require('../../auth/authApiMiddleware')

module.exports.init = app => {

  // READ

  app.get(`/survey/:surveyId/collect-import-report`, AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const { surveyId } = Request.getParams(req)

      const items = await CollectImportReportService.fetchItems(surveyId)

      res.json({ items })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // UPDATE

  app.post(`/survey/:surveyId/collect-import-report/resolve-item/:itemId`, AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { surveyId, itemId, resolved } = Request.getParams(req)

      const item = await CollectImportReportService.updateItem(surveyId, itemId, {}, resolved)

      return res.json({ item })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}