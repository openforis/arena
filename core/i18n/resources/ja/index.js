// 翻訳未着手の名前空間は英語(en)からそのまま再エクスポートしている。
// 翻訳が完了し次第、対応するインポート元を './<name>' に切り替えること。
import activityLog from './activityLog'
import appErrors from './appErrors'
import auth from './auth'
import common from '../en/common'
import dataExportView from './dataExportView'
import dataImportView from '../en/dataImportView'
import dataView from '../en/dataView'
import emails from '../en/emails'
import homeView from '../en/homeView'
import jobs from './jobs'
import jobMonitorView from './jobMonitorView'
import messageView from './messageView'
import surveyCreate from './surveyCreate'
import surveyForm from '../en/surveyForm'
import userAiSettings from './userAiSettings'
import user2FADevice from './user2FADevice'
import usersView from './usersView'
import validationErrors from '../en/validationErrors'

export default {
  activityLog,
  appErrors,
  auth,
  common,
  dataExportView,
  dataImportView,
  dataView,
  emails,
  homeView,
  jobs,
  jobMonitorView,
  messageView,
  surveyCreate,
  surveyForm,
  userAiSettings,
  user2FADevice,
  usersView,
  validationErrors,
}
