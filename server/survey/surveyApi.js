const R = require('ramda')
const fs = require('fs')

const { sendErr, sendOk } = require('../serverUtils/response')
const { getRestParam, getBoolParam } = require('../serverUtils/request')

const Survey = require('../../common/survey/survey')
const SurveyManager = require('./surveyManager')
const SurveyValidator = require('./surveyValidator')
const Validator = require('../../common/validation/validator')

const AuthMiddleware = require('../authGroup/authMiddleware')

const JobManager = require('../job/jobManager')
const FileManager = require('../file/fileManager')
const JobUtils = require('../job/jobUtils')
const SurveyPublishJob = require('./publish/surveyPublishJob')
const SurveyImportJob = require('./import/surveyImportJob')

module.exports.init = app => {

  // ==== CREATE
  app.post('/survey', async (req, res) => {
    try {
      const { user, body } = req
      const validation = await SurveyValidator.validateNewSurvey(body)

      if (validation.valid) {
        const survey = await SurveyManager.createSurvey(user, body)

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (err) {
      sendErr(res, err)
    }

  })

  app.post('/survey/import-from-collect', async (req, res) => {
    try {
      const { user } = req

      const file = req.files.file

      const surveyImportJob = new SurveyImportJob({ user, filePath: file.tempFilePath })

      JobManager.executeJobThread(surveyImportJob)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== READ
  app.get('/surveys', async (req, res) => {
    try {
      const { user } = req

      const surveys = await SurveyManager.fetchUserSurveysInfo(user)

      res.json({ surveys })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const draft = getBoolParam(req, 'draft')

      const survey = await SurveyManager.fetchSurveyById(surveyId, draft)

      res.json({ survey })
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== UPDATE

  app.put('/survey/:surveyId/prop', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const { body, user } = req
      const { key, value } = body

      const surveyId = getRestParam(req, 'surveyId')

      const validation = R.pipe(
        Survey.getSurveyInfo,
        Validator.getValidation
      )(await SurveyManager.updateSurveyProp(surveyId, key, value, user))

      res.json({ validation })
    } catch (err) {
      sendErr(res, err)
    }
  })

  app.put('/survey/:surveyId/publish', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const user = req.user

      const surveyPublishJob = new SurveyPublishJob({ user, surveyId })

      JobManager.executeJobThread(surveyPublishJob)

      const job = JobUtils.jobToJSON(surveyPublishJob)

      res.json({ job })
    } catch (err) {
      sendErr(res, err)
    }
  })

  // ==== DELETE

  app.delete('/survey/:surveyId', AuthMiddleware.requireSurveyEditPermission, async (req, res) => {
    try {
      const surveyId = getRestParam(req, 'surveyId')
      const { user } = req

      await SurveyManager.deleteSurvey(surveyId, user)

      sendOk(res)
    } catch (err) {
      sendErr(res, err)
    }
  })

}
