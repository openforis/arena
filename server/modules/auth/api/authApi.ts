import type { Router } from 'express'

import { Authorizer } from '@openforis/arena-core'
import { ApiEndpoint } from '@openforis/arena-server'

import { minMobileAppVersionRecordsDownload, minMobileAppVersionRecordsUpload } from '@common/mobile'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import * as User from '@core/user/user'
import * as Log from '@server/log/log'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import { omitServerOnlyPrefsFromUser } from '@server/modules/user/serverOnlyPrefs'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as RecordService from '../../record/service/recordService'
import * as SurveyService from '../../survey/service/surveyService'
import * as UserService from '../../user/service/userService'

const Logger = Log.getLogger('AuthAPI')

const sendResponse = (res, user, survey = null, error = null) => res.json({ user, survey, error })

/**
 * Removes the survey from the user prefs and sends the user without survey.
 * @param {!number} surveyId - ID of the survey to remove from the user prefs.
 * @returns {Promise<void>} - Resolves when the response has been sent.
 */
const deletePrefSurveyAndSendUser = async (res, user, surveyId) => {
  const _user = User.deletePrefSurvey(surveyId)(user)
  sendResponse(res, await UserService.updateUserPrefsAndFetchGroups(_user))
}

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById({ surveyId, draft: false, validate: false })
    const surveyInfo = Survey.getSurveyInfo(survey)
    if (!Authorizer.canViewSurvey(user, surveyInfo)) {
      // the current survey pref can be set to any survey id: treat a survey the user cannot view as not found
      await deletePrefSurveyAndSendUser(res, user, surveyId)
      return
    }
    if (Authorizer.canEditSurvey(user, surveyInfo)) {
      survey = await SurveyService.fetchSurveyById({ surveyId, draft: true, validate: true })
      survey = await SurveyService.fetchAndAssocStorageInfo({ survey })
    }
    sendResponse(res, user, survey)
  } catch (error) {
    Logger.error(`error loading survey with id ${surveyId}: ${error.toString()}`)

    if (error instanceof SystemError && error.key === 'survey.dataMigrationInProgress') {
      // Survey data migration still in progress: keep the user's current survey preference untouched,
      // it's not a case of the survey being missing or inaccessible, just temporarily unavailable.
      sendResponse(res, user, null, { key: error.key, params: error.params })
      return
    }

    // Survey not found (or otherwise inaccessible) with user pref: removing user pref
    await deletePrefSurveyAndSendUser(res, user, surveyId)
  }
}

export const init = (app: Router): void => {
  app.get('/api/version', async (_req, res) => {
    const packageJson = JSON.parse(await FileUtils.readFile('package.json'))
    const { version } = packageJson
    res.json({ version, minMobileAppVersionRecordsDownload, minMobileAppVersionRecordsUpload })
  })

  app.get('/api/changelog', AuthMiddleware.requireChangelogViewPermission, async (_req, res) => {
    const content = await FileUtils.readFile('CHANGELOG.md')
    res.json({ content })
  })

  app.get('/auth/user', async (req, res) => {
    // the request user is loaded with every pref: the server-only ones never go back to the browser
    const user = omitServerOnlyPrefsFromUser(Request.getUser(req))
    const surveysCount = await UserService.fetchUserSurveysCount(User.getUuid(user))
    const userWithCounts = { ...user, ...surveysCount }
    const surveyId = User.getPrefSurveyCurrent(user)

    if (surveyId) {
      await sendUserSurvey(res, userWithCounts, surveyId)
    } else {
      sendResponse(res, userWithCounts)
    }
  })

  app.post('/auth/logout', async (req, res) => {
    // Before logout checkOut record if there's an opened thread
    const socketId = Request.getSocketId(req)
    await RecordService.dissocSocketFromUpdateThread(socketId)

    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: ApiEndpoint.auth.tokenRefresh(),
      sameSite: 'strict',
      secure: ProcessUtils.isEnvProduction,
    })
    Response.sendOk(res)
  })

  // ===== RESET PASSWORD
  app.post('/auth/reset-password', async (req, res) => {
    const { email } = Request.getParams(req)
    const serverUrl = Request.getPublicServerUrl(req)
    // never return the reset token: it is only sent by email
    const { error } = await UserService.generateResetPasswordUuid(email, serverUrl)
    res.json({ error })
  })

  app.get('/auth/reset-password/:uuid', async (req, res) => {
    const { uuid } = Request.getParams(req)
    const { user, registrationInfo } = await UserService.fetchResetPasswordUserAndRegistrationInfo(uuid)
    res.json({ user, registrationInfo })
  })

  app.put('/auth/reset-password/:uuid', async (req, res) => {
    const { uuid, name, password, title, institution, country } = Request.getParams(req)
    await UserService.resetPassword({ uuid, name, password, title, institution, country })
    res.json({ result: true })
  })
}
