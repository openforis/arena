/* eslint-disable no-useless-escape */
import axios from 'axios'
import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/chain'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import { copyToClipboard } from '@webapp/utils/domUtils'
import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'
import { UserState } from '@webapp/store/user'
import * as API from '@webapp/service/api'

const _getRStudioParams = async ({ userUuid, isLocal }) => {
  if (isLocal) {
    return false
  }
  if (ProcessUtils.ENV.rStudioServerUrl) {
    return ProcessUtils.ENV.rStudioServerUrl
  }

  const { instanceId, rStudioProxyUrl } = await API.createInstance()
  let rStudioUrl = instanceId && rStudioProxyUrl ? `${rStudioProxyUrl}${instanceId}_${userUuid}` : false

  if (rStudioUrl && instanceId) {
    return { rStudioUrl, instanceId }
  }

  return { rStudioUrl: `${window.location.origin}/rstudio/`, instanceId: false }
}

/*
  ProcessUtils.ENV.rStudioDownloadServerUrl is needed because when you are into localhost you need to connect RStudio to the local server through a tunnel.
  The address of this tunnel should be set into the env vars. In production the serverURL comes from the server.
 */
const _getRStudioCode = ({ surveyId, chainUuid, token, serverUrl, isLocal = false, surveyInfo }) =>
  `
  url <- "${
    ProcessUtils.ENV.rStudioDownloadServerUrl || serverUrl
  }/api/survey/${surveyId}/chain/${chainUuid}/script/public?surveyCycleKey=0&token=${token}";\r\n
  ${isLocal ? `setwd(Sys.getenv("HOME"));` : ''}\r\n
  download.file(url,"./${token}.zip" ${isLocal ? `, mode="wb"` : ''});\r\n
  ${
    isLocal
      ? `dir.create("./arena/arena-${Survey.getName(
          surveyInfo
        )}-${DateUtils.nowFormatDefault()}", mode="0777", recursive=TRUE);\r\n`
      : ''
  }
  unzip("./${token}.zip",exdir=".${
    isLocal ? `/arena/arena-${Survey.getName(surveyInfo)}-${DateUtils.nowFormatDefault()}` : ''
  }");\r\n
  file.remove("./${token}.zip");\r\n
  ${isLocal ? `setwd('./arena/arena-${Survey.getName(surveyInfo)}-${DateUtils.nowFormatDefault()}');` : ''}\r\n
  ${isLocal ? `rstudioapi::filesPaneNavigate(getwd());` : ''}\r\n
  rstudioapi::navigateToFile("arena.R")\r\n
  `

const _copyRStudioCode = ({ rStudioCode }) => copyToClipboard(rStudioCode)

export const openRStudio =
  ({ chain, isLocal = false }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const surveyInfo = SurveyState.getSurveyInfo(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
    const user = UserState.getUser(state)
    const userUuid = User.getUuid(user)

    dispatch(LoaderActions.showLoader())

    const config = { params: { surveyCycleKey } }
    const chainUuid = Chain.getUuid(chain)

    let hadInstance = false

    const currentInstance = await API.getCurrentInstance()
    if (currentInstance?.instanceId) {
      hadInstance = true
    }

    const { data } = await axios.get(`/api/survey/${surveyId}/chain/${chainUuid}/script`, config)

    const { instanceId, rStudioUrl } = await _getRStudioParams({ userUuid, isLocal })

    const { token, serverUrl } = data

    const rStudioCode = _getRStudioCode({ surveyId, chainUuid, token, serverUrl, isLocal, surveyInfo })

    dispatch(LoaderActions.hideLoader())
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: isLocal ? 'chainView.copyRStudioCodeLocal' : 'chainView.copyRStudioCode',
        params: { rStudioCode },
        onOk: () => {
          _copyRStudioCode({ rStudioCode })
          if (!isLocal) {
            window.open(rStudioUrl, 'rstudio')
          }
        },
        onCancel: async () => {
          if (!hadInstance) {
            await API.terminateInstance({ instanceId })
          }
        },
      })
    )
  }
