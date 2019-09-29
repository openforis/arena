const R = require('ramda')

const Response = require('../../../utils/response')
const Request = require('../../../utils/request')
const JobUtils = require('../../../job/jobUtils')

const Validation = require('../../../../common/validation/validation')
const User = require('../../../../common/user/user')

const AuthMiddleware = require('../../auth/authApiMiddleware')
const SurveyService = require('../service/surveyService')
const UserService = require('../../user/service/userService')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyReq = Request.getBody(req)
      const validation = await SurveyService.validateNewSurvey(surveyReq)

      if (Validation.isValid(validation)) {
        const survey = await SurveyService.createSurvey(user, surveyReq)

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (err) {
      next(err)
    }

  })

  // ==== READ
  app.get('/surveys', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { offset, limit } = Request.getParams(req)

      const list = await SurveyService.fetchUserSurveysInfo(user, offset, limit)

      res.json({ list })
    } catch (err) {
      next(err)
    }
  })

  app.get('/surveys/count', async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const count = await SurveyService.countUserSurveys(user)

      res.json(count)
    } catch (err) {
      next(err)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const user = R.pipe(
        Request.getUser,
        User.setPrefSurveyCurrent(surveyId)
      )(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyById(surveyId, draft, validate),
        UserService.updateUserPrefs(user)
      ])

      res.json({ survey })
    } catch (err) {
      next(err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/info', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const props = Request.getBody(req)

      const { surveyId } = Request.getParams(req)

      const survey = await SurveyService.updateSurveyProps(user, surveyId, props)

      res.json(survey)
    } catch (err) {
      next(err)
    }
  })

  app.put('/survey/:surveyId/publish', AuthMiddleware.requireSurveyEditPermission, (req, res) => {
    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)

    const job = SurveyService.startPublishJob(user, surveyId)

    res.json({ job: JobUtils.jobToJSON(job) })
  })

  // ==== DELETE

  app.delete('/survey/:surveyId', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      await SurveyService.deleteSurvey(surveyId)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

}
