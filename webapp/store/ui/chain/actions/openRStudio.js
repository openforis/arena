import axios from 'axios'
import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/chain'

import * as User from '@core/user/user'

import { copyToClipboard } from '@webapp/utils/domUtils'
import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'
import { UserState } from '@webapp/store/user'

const _getRStudioPoolUrl = async ({ userUuid }) => {
  try {
    const { data = {} } = await axios.post('/api/rstudio')
    const { instanceId = false, rStudioProxyUrl = false } = data

    if (instanceId && rStudioProxyUrl) {
      return `${rStudioProxyUrl}${instanceId}_${userUuid}`
    }
    return false
  } catch (err) {
    return false
  }
}
const _getRStudioUrl = async ({ userUuid }) => {
  if (ProcessUtils.ENV.rStudioServerUrl) {
    return ProcessUtils.ENV.rStudioServerUrl
  }

  const rStudioPoolUrl = await _getRStudioPoolUrl({ userUuid })

  if (rStudioPoolUrl) {
    return rStudioPoolUrl
  }

  return `${window.location.origin}/rstudio/`
}

/*
  ProcessUtils.ENV.rStudioDownloadServerUrl is needed because when you are into localhost you need to connect RStudio to the local server through a tunnel.
  The address of this tunnel should be set into the env vars. In production the serverURL comes from the server.
 */
const _getRStudioCode = ({ surveyId, chainUuid, token, serverUrl }) =>
  `
  url <- '${
    ProcessUtils.ENV.rStudioDownloadServerUrl || serverUrl
  }/api/survey/${surveyId}/processing-chain/${chainUuid}/script/public?surveyCycleKey=0&token=${token}';\n
  download.file(url,"./${token}.zip");\n
  unzip("./${token}.zip",exdir=".");\n
  file.remove("./${token}.zip");\n
  `

const _copyRStudioCode = ({ rStudioCode }) => copyToClipboard(rStudioCode)

export const openRStudio = ({ chain }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const user = UserState.getUser(state)
  const userUuid = User.getUuid(user)

  dispatch(LoaderActions.showLoader())

  const config = { params: { surveyCycleKey } }
  const chainUuid = Chain.getUuid(chain)
  const { data } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}/script`, config)

  const rStudioUrl = await _getRStudioUrl({ userUuid })

  const { token, serverUrl } = data

  const rStudioCode = _getRStudioCode({ surveyId, chainUuid, token, serverUrl })

  dispatch(LoaderActions.hideLoader())
  dispatch(
    DialogConfirmActions.showDialogConfirm({
      key: 'chainView.copyRStudioCode',
      params: { rStudioCode },
      onOk: () => {
        _copyRStudioCode({ rStudioCode })
        window.open(rStudioUrl, 'rstudio')
      },
    })
  )
}
