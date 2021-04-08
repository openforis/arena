import * as R from 'ramda'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as ProcessUtils from '@core/processUtils'

import * as Response from '../../../utils/response'
import * as Request from '../../../utils/request'
import * as JobUtils from '../../../job/jobUtils'

import * as Survey from '../../../../core/survey/survey'
import * as Validation from '../../../../core/validation/validation'
import * as User from '../../../../core/user/user'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyService from '../service/surveyService'
import * as UserService from '../../user/service/userService'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey', AuthMiddleware.requireAdminPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyReq = Request.getBody(req)
      const validation = await SurveyService.validateNewSurvey(surveyReq)

      if (Validation.isValid(validation)) {
        const { name, label, lang, cloneFrom } = surveyReq

        const surveyInfo = Survey.newSurvey({
          ownerUuid: User.getUuid(user),
          name,
          label,
          languages: [lang],
        })

        if (cloneFrom) {
          const job = SurveyService.cloneSurvey({ surveyId: cloneFrom, surveyInfo, user, res })
          res.json({ job })
          return
        }
        const survey = await SurveyService.insertSurvey({ user, surveyInfo })

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (error) {
      next(error)
    }
  })

  // ==== READ
  app.get('/surveys', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { offset, limit } = Request.getParams(req)

      const list = await SurveyService.fetchUserSurveysInfo({ user, offset, limit })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/surveys/count', async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const count = await SurveyService.countUserSurveys(user)

      res.json(count)
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const user = R.pipe(Request.getUser, User.assocPrefSurveyCurrent(surveyId))(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyById(surveyId, draft, validate),
        UserService.updateUserPrefs(user),
      ])

      res.json({ survey })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/export', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const user = Request.getUser(req)

      await SurveyService.exportSurvey({ surveyId, user, res })
    } catch (error) {
      next(error)
    }
  })

  // export-csv-data
  // generate zip with CSV
  app.post('/survey/:surveyId/export-csv-data', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId } = Request.getParams(req)

      const user = Request.getUser(req)

      const job = SurveyService.startExportCsvDataJob({ surveyId, user })
      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  // get zip with csv
  app.get(
    '/survey/:surveyId/export-csv-data/:exportDataFolderName',
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { exportDataFolderName } = Request.getParams(req)
        const name = `${exportDataFolderName}.zip`
        const dir = FileUtils.join(ProcessUtils.ENV.tempFolder, exportDataFolderName)
        Response.sendZipFile(res, dir, name)
      } catch (error) {
        next(error)
      }
    }
  )

  // ==== UPDATE

  app.put('/survey/:surveyId/info', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const props = Request.getBody(req)

      const { surveyId } = Request.getParams(req)

      const survey = await SurveyService.updateSurveyProps(user, surveyId, props)

      res.json(survey)
    } catch (error) {
      next(error)
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
    } catch (error) {
      next(error)
    }
  })
}
