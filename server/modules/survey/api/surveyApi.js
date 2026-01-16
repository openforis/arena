import * as R from 'ramda'

import { Authorizer } from '@openforis/arena-core'
import * as DateUtils from '@core/dateUtils'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as ProcessUtils from '@core/processUtils'
import { FileFormats } from '@core/fileFormats'

import * as Response from '../../../utils/response'
import * as Request from '../../../utils/request'
import * as JobUtils from '../../../job/jobUtils'

import * as Survey from '../../../../core/survey/survey'
import * as Validation from '../../../../core/validation/validation'
import * as User from '../../../../core/user/user'

import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as SurveyService from '../service/surveyService'
import * as UserService from '../../user/service/userService'
import { ExportFileNameGenerator } from '@common/dataExport/exportFileNameGenerator'

export const init = (app) => {
  // ==== CREATE
  app.post('/survey', AuthMiddleware.requireSurveyCreatePermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyReq = Request.getBody(req)
      const { name, label, lang, cloneFrom = null, cloneFromCycle = null, template = false } = surveyReq

      const validation = cloneFrom
        ? await SurveyService.validateSurveyClone({ newSurvey: surveyReq })
        : await SurveyService.validateNewSurvey({ newSurvey: surveyReq })

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
        onlyOwn = false,
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
        onlyOwn,
      })

      res.json({ list })
    } catch (error) {
      next(error)
    }
  })

  app.get('/surveys/count', AuthMiddleware.requireLoggedInUser, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { draft = true, template = false, search = null, lang = null, onlyOwn = false } = Request.getParams(req)

      const count = await SurveyService.countUserSurveys({ user, draft, template, search, lang, onlyOwn })

      res.json({ count })
    } catch (error) {
      next(error)
    }
  })

  // surveys list export
  app.post('/surveys/export', AuthMiddleware.requireCanExportSurveysList, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { draft = true, template = false } = Request.getParams(req)
      const job = SurveyService.startSurveysListExport({ user, draft, template })
      res.json({ job })
    } catch (error) {
      next(error)
    }
  })

  // surveys list export (download generated zip file)
  app.get('/surveys/export/download', AuthMiddleware.requireCanExportSurveysList, async (req, res, next) => {
    try {
      const { tempFileName, fileFormat } = Request.getParams(req)
      const exportedFilePath = FileUtils.tempFilePath(tempFileName)
      const date = DateUtils.nowFormatDefault()
      const name = `arena_surveys_${date}.xlsx`

      Response.sendFile({
        res,
        path: exportedFilePath,
        name,
        fileFormat,
      })
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

  const _sendSurvey = async ({ survey, user, res }) => {
    let surveyUpdated = survey
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      surveyUpdated = await SurveyService.fetchAndAssocStorageInfo({ survey })
    }
    res.json({ survey: surveyUpdated })
  }

  app.get('/survey/:surveyId', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, draft, validate } = Request.getParams(req)
      const user = R.pipe(Request.getUser, User.assocPrefSurveyCurrent(surveyId))(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyById({ surveyId, draft, validate }),
        UserService.updateUserPrefs(user),
      ])

      await _sendSurvey({ survey, user, res })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/full', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, draft, advanced, includeAnalysis, validate } = Request.getParams(req)
      const user = R.pipe(Request.getUser, User.assocPrefSurveyCurrent(surveyId))(req)

      const [survey] = await Promise.all([
        SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
          surveyId,
          cycle,
          draft,
          advanced,
          includeAnalysis,
          validate,
        }),
        UserService.updateUserPrefs(user),
      ])
      await _sendSurvey({ survey, user, res })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/export', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const {
        surveyId,
        includeData = true,
        includeResultAttributes = true,
        includeActivityLog = true,
      } = Request.getParams(req)

      const user = Request.getUser(req)

      const { job, outputFileName } = SurveyService.exportSurvey({
        surveyId,
        user,
        includeData,
        includeResultAttributes,
        includeActivityLog,
      })
      res.json({ job, outputFileName })
    } catch (error) {
      next(error)
    }
  })

  // download generated survey export file
  app.get('/survey/:surveyId/export/download', AuthMiddleware.requireDownloadToken, async (req, res, next) => {
    const downloadFileName = Request.getDownloadFileName(req)
    try {
      const {
        surveyName,
        includeData = true,
        includeResultAttributes = true,
        includeActivityLog = true,
      } = Request.getParams(req)

      const path = FileUtils.join(ProcessUtils.ENV.tempFolder, downloadFileName)

      const outputFileNameParts = [includeData ? 'arena_backup' : 'arena_survey']
      if (includeData) {
        if (!includeActivityLog) {
          outputFileNameParts.push('no_log')
        }
        if (!includeResultAttributes) {
          outputFileNameParts.push('no_result_attributes')
        }
      }
      const date = DateUtils.nowFormatDefault()
      outputFileNameParts.push(surveyName, date)
      const outputFileName = `${outputFileNameParts.join('_')}.zip`

      Response.sendFile({ res, path, name: outputFileName })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/schema-summary', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, cycle, fileFormat = FileFormats.xlsx } = Request.getParams(req)

      const survey = await SurveyService.fetchSurveyById({ surveyId, draft: true })
      const fileName = ExportFileNameGenerator.generate({
        survey,
        cycle,
        fileType: 'SchemaSummary',
        fileFormat,
      })
      Response.setContentTypeFile({ res, fileName, fileFormat })

      await SurveyService.exportSchemaSummary({ surveyId, cycle, outputStream: res, fileFormat })
    } catch (error) {
      next(error)
    }
  })

  app.get('/survey/:surveyId/labels', AuthMiddleware.requireSurveyViewPermission, async (req, res, next) => {
    try {
      const { surveyId, fileFormat } = Request.getParams(req)
      const survey = await SurveyService.fetchSurveyById({ surveyId, draft: true })
      const fileName = ExportFileNameGenerator.generate({ survey, fileType: 'Labels', fileFormat })
      Response.setContentTypeFile({ res, fileName, fileFormat })
      await SurveyService.exportLabels({ surveyId, outputStream: res, fileFormat })
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

  app.put('/survey/:surveyId/unpublish', AuthMiddleware.requireSurveyEditPermission, (req, res) => {
    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)

    const job = SurveyService.startUnpublishJob(user, surveyId)

    res.json({ job: JobUtils.jobToJSON(job) })
  })

  app.put('/survey/:surveyId/delete-activity-log', AuthMiddleware.requireSurveyEditPermission, (req, res) => {
    const { surveyId } = Request.getParams(req)
    const user = Request.getUser(req)

    const job = SurveyService.startDeleteActivityLogJob(user, surveyId)

    res.json({ job: JobUtils.jobToJSON(job) })
  })

  app.put('/survey/:surveyId/labels', AuthMiddleware.requireSurveyEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const filePath = Request.getFilePath(req)
      const { surveyId, fileFormat } = Request.getParams(req)

      const job = SurveyService.startLabelsImportJob({ user, surveyId, filePath, fileFormat })

      res.json({ job: JobUtils.jobToJSON(job) })
    } catch (error) {
      next(error)
    }
  })

  app.put('/survey/:surveyId/config', AuthMiddleware.requireSurveyConfigEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { key, value } = Request.getBody(req)
      const { surveyId } = Request.getParams(req)
      const survey = await SurveyService.updateSurveyConfigurationProp({ surveyId, key, value })
      await _sendSurvey({ survey, user, res })
    } catch (error) {
      next(error)
    }
  })

  app.put('/survey/:surveyId/owner', AuthMiddleware.requireSurveyOwnerEditPermission, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const { surveyId, ownerUuid } = Request.getParams(req)
      await SurveyService.updateSurveyOwner({ user, surveyId, ownerUuid })
      Response.sendOk(res)
    } catch (error) {
      next(error)
    }
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
