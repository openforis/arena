import * as R from 'ramda'

import * as DateUtils from '@core/dateUtils'
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
import { ExportFileNameGenerator } from '@server/utils/exportFileNameGenerator'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey', AuthMiddleware.requireSurveyCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyReq = Request.getBody(req)
      const { name, label, lang, cloneFrom = null, cloneFromCycle = null, template = false } = surveyReq

      const validation = cloneFrom
        ? await SurveyService.validateNewSurvey({ newSurvey: surveyReq })
        : await SurveyService.validateSurveyClone({ newSurvey: surveyReq })

      if (Validation.isValid(validation)) {
        const surveyInfoTarget = Survey.newSurvey({
          ownerUuid: User.getUuid(user),
          name,
          label,
          languages: [lang],
          template,
        })

        if (cloneFrom) {
          const job = SurveyService.cloneSurvey({
            surveyId: cloneFrom,
            cycle: cloneFromCycle,
            surveyInfoTarget,
            user,
            res,
          })
          res.json({ job })
          return
        }
        const survey = await SurveyService.insertSurvey({ user, surveyInfo: surveyInfoTarget })

        res.json({ survey })
      } else {
        res.json({ validation })
      }
    } catch (error) {
      next(error)
    }
  })

  // ==== READ
  app.get('/surveys', AuthMiddleware.requireLoggedInUser, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const {
        draft = true,
        template = false,
        offset,
        limit,
        lang,
        search,
        sortBy,
        sortOrder,
        includeCounts = false,
      } = Request.getParams(req)

      const list = await SurveyService.fetchUserSurveysInfo({
        user,
        draft,
        template,
        offset,
        limit,
        lang,
        search,
        sortBy,
        sortOrder,
        includeCounts,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/surveys/count', AuthMiddleware.requireLoggedInUser, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { template = false, search = null, lang = null } = Request.getParams(req)

      const count = await SurveyService.countUserSurveys({ user, template, search, lang })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  app.get('/surveyTemplates', async (req, res, next) => {
    try {
      const user = Request.getUser(req)

      const list = await SurveyService.fetchUserSurveysInfo({
        user,
        draft: false,
        template: true,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const user = R.pipe(Request.getUser, User.assocPrefSurveyCurrent(surveyId))(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyById({ surveyId, draft, validate }),
        UserService.updateUserPrefs(user),
      ])

      res.json({ survey })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/export', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, includeData, includeActivityLog } = Request.getParams(req)

      const user = Request.getUser(req)

      const { job, outputFileName } = SurveyService.exportSurvey({ surveyId, user, includeData, includeActivityLog })
      res.json({ job, outputFileName })
    } catch (error) {
      next(error)
    }
  })

  // download generated survey export file
  app.get('/survey/:surveyId/export/download', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyName, fileName, includeData, includeActivityLog } = Request.getParams(req)

      const path = FileUtils.join(ProcessUtils.ENV.tempFolder, fileName)
      const prefix = includeData ? 'arena_backup' + (!includeActivityLog ? '_no_log' : '') : 'arena_survey'
      const date = DateUtils.nowFormatDefault()
      Response.sendFile({ res, path, name: `${prefix}_${surveyName}_${date}.zip` })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/schema-summary', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle } = Request.getParams(req)

      const survey = await SurveyService.fetchSurveyById({ surveyId, draft: true })
      const fileName = ExportFileNameGenerator.generate({ survey, cycle, fileType: 'SchemaSummary' })
      Response.setContentTypeFile({ res, fileName, contentType: Response.contentTypes.csv })

      await SurveyService.exportSchemaSummary({ surveyId, cycle, outputStream: res })
    } catch (error) {
      next(error)
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
