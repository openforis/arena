import { getLogger } from '../../../log/log'
import Request from '../../../utils/request';
import Response from '../../../utils/response';
import Jwt from '../../../utils/jwt';
import Survey from '../../../../core/survey/survey';
import User from '../../../../core/user/user';
import Authorizer from '../../../../core/auth/authorizer';
import SurveyService from '../../survey/service/surveyService';
import UserService from '../../user/service/userService';
import RecordService from '../../record/service/recordService';
import AuthService from '../service/authService';

const Logger = getLogger('AuthAPI')

const sendResponse = (res, user, survey = null) => res.json({ user, survey })

const sendUserSurvey = async (res, user, surveyId) => {
  try {
    let survey = await SurveyService.fetchSurveyById(surveyId, false, false)
    if (Authorizer.canEditSurvey(user, Survey.getSurveyInfo(survey))) {
      survey = await SurveyService.fetchSurveyById(surveyId, true, true)
    }
    sendResponse(res, user, survey)
  } catch (e) {
    Logger.error(`error loading survey with id ${surveyId}: ${e.toString()}`)
    // survey not found with user pref
    // removing user pref
    user = User.deletePrefSurvey(surveyId)(user)
    sendResponse(res, await UserService.updateUserPrefs(user))
  }
}

export const init = app => {

  app.get('/auth/user', async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      const surveyId = User.getPrefSurveyCurrent(user)

      surveyId
        ? await sendUserSurvey(res, user, surveyId)
        : sendResponse(res, user)
    } catch (err) {
      next(err)
    }
  })

  app.post('/auth/logout', async (req, res, next) => {
    try {
      // before logout checkOut record if there's an opened thread
      const socketId = Request.getSocketId(req)
      RecordService.dissocSocketFromRecordThread(socketId)

      const token = req.headers.authorization.substring(Jwt.bearerPrefix.length)

      await AuthService.blacklistToken(token)

      Response.sendOk(res)
    } catch (err) {
      next(err)
    }
  })

};
