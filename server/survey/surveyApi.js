const {sendErr, sendOk} = require('../serverUtils/response')
const {
  getRestParam,
  getBoolParam,
} = require('../serverUtils/request')

const SurveyManager = require('./surveyManager')
const {checkEditSurvey} = require('../authGroup/authGroupManager')

const {
  validateNewSurvey,
  validateSurvey,
} = require('./surveyValidator')

const JobManager = require('../job/jobManager')
const {jobToJSON} = require('../job/jobUtils')

const SurveyPublishJob = require('./publish/surveyPublishJob')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey', async (req, res) => {
    try {

      const {user, body} = req
      const validation = await validateNewSurvey(body)

      if (validation.valid) {
        const survey = await SurveyManager.createSurvey(user, body)

        res.json({survey})
      } else {
        res.json({validation})
      }

    } catch (err) {
      sendErr(res, err)
    }

  })

  // ==== READ
  app.get('/surveys', async (req, res) => {
    try {
      const {user} = req

      const surveys = await SurveyManager.fetchUserSurveysInfo(user)

      res.json({surveys})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:id', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const draft = getBoolParam(req, 'draft')

      const survey = await SurveyManager.fetchSurveyById(surveyId, draft)

      res.json({survey})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get(`/survey/:id/nodeDefs`, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const draft = getBoolParam(req, 'draft')
      const validate = getBoolParam(req, 'validate')

      const nodeDefs = await SurveyManager.fetchSurveyNodeDefs(surveyId, draft, validate)

      res.json({nodeDefs})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:id/prop', async (req, res) => {
    try {
      const {body, user} = req
      const {key, value} = body

      const surveyId = getRestParam(req, 'id')

      const survey = await SurveyManager.updateSurveyProp(surveyId, key, value, user)
      const validation = await validateSurvey(survey, key)

      res.json({validation})
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:id/publish', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const user = req.user

      await checkEditSurvey(user, surveyId)

      const job = new SurveyPublishJob({
        userId: user.id,
        surveyId
      })

      JobManager.executeJobThread(job)

      res.json({job: jobToJSON(job)})
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:id', async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'id')
      const user = req.user

      await checkEditSurvey(user, surveyId)

      await SurveyManager.deleteSurvey(surveyId, req.user)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
