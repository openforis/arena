const Response = require('../../../utils/response')
const Request = require('../../../utils/request')

const SurveyService = require('../service/surveyService')

const AuthMiddleware = require('../../auth/authApiMiddleware')

const JobUtils = require('../../../job/jobUtils')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey', async (req, res) => {
    try {
      const user = Request.getSessionUser(req)
      const { body } = req
      const validation = await SurveyService.validateNewSurvey(body)

      if (validation.valid) {
        const survey = await SurveyService.createSurvey(user, body)

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (err) {
      Response.sendErr(res, err)
    }

  })

  app.post('/survey/collect-import', async (req, res) => {
    try {
      const user = Request.getSessionUser(req)
      const file = Request.getFile(req)

      const job = SurveyService.startCollectImportJob(user, file.tempFilePath)

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== READ
  app.get('/surveys', async (req, res) => {
    try {
      const user = Request.getSessionUser(req)

      const surveys = await SurveyService.fetchUserSurveysInfo(user)

      res.json({ surveys })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const draft = Request.getBoolParam(req, 'draft')

      const survey = await SurveyService.fetchSurveyById(surveyId, draft)

      res.json({ survey })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/prop', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const user = Request.getSessionUser(req)
      const { body } = req
      const { key, value } = body

      const surveyId = Request.getRestParam(req, 'surveyId')

      const validation = await SurveyService.updateSurveyProp(user, surveyId, key, value)

      res.json({ validation })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/publish', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const user = Request.getSessionUser(req)

      const job = SurveyService.startPublishJob(user, surveyId)

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = Request.getRestParam(req, 'surveyId')
      const user = Request.getSessionUser(req)

      await SurveyService.deleteSurvey(surveyId, user)

      Response.sendOk(res)
    } catch (err) {
      Response.sendErr(res, err)
    }
  })

}
