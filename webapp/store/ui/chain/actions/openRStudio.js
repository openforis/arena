import axios from 'axios'
import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/chain'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import { copyToClipboard } from '@webapp/utils/domUtils'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'
import { UserState } from '@webapp/store/user'
import * as API from '@webapp/service/api'

import { ChainState } from '../state'

const _getRStudioParams = async ({ userUuid }) => {
  if (ProcessUtils.ENV.rStudioServerUrl) {
    return { rStudioUrl: ProcessUtils.ENV.rStudioServerUrl }
  }

  const { instanceId, rStudioProxyUrl } = await API.createInstance()
  const rStudioUrl = instanceId && rStudioProxyUrl ? `${rStudioProxyUrl}${instanceId}_${userUuid}` : false

  if (rStudioUrl && instanceId) {
    return { rStudioUrl, instanceId }
  }

  return { rStudioUrl: `${window.location.origin}/rstudio/`, instanceId: false }
}

/*
  ProcessUtils.ENV.rStudioDownloadServerUrl is needed because when you are into localhost you need to connect RStudio to the local server through a tunnel.
  The address of this tunnel should be set into the env vars. In production the serverURL comes from the server.
 */
const _getRStudioCode = ({
  surveyId,
  chainUuid,
  token,
  serverUrl: serverUrlParam,
  isLocal = false,
  surveyInfo,
  surveyCycleKey,
}) => {
  const serverUrl = ProcessUtils.ENV.rStudioDownloadServerUrl || serverUrlParam
  const scriptUrl = `${serverUrl}/api/public/survey/${surveyId}/chain/${chainUuid}/script?surveyCycleKey=${surveyCycleKey}&token=${token}`
  const localDir = `./arena/arena-${Survey.getName(surveyInfo)}-${DateUtils.nowFormatDefault()}`
  const zipFile = `./${token}.zip`

  const lines = []

  // Cleanup workspace (only remote instance)
  if (!isLocal) {
    lines.push(
      'rm(list = ls(all.names = TRUE));',
      'unlink("./*", recursive = TRUE, force = TRUE);',
      'unlink(".Rprofile", force = TRUE);'
    )
  }

  // Set working directory for local instance
  if (isLocal) {
    lines.push('setwd(Sys.getenv("HOME"));')
  }

  // Download and extract the script
  lines.push(`url <- "${scriptUrl}";`, `download.file(url,"${zipFile}"${isLocal ? ', mode="wb"' : ''});`)

  if (isLocal) {
    lines.push(`dir.create("${localDir}", mode="0777", recursive=TRUE);`)
  }

  lines.push(`unzip("${zipFile}", exdir="${isLocal ? localDir : '.'}");`, `file.remove("${zipFile}");`)

  // Open the project or navigate to files
  if (isLocal) {
    lines.push(`rstudioapi::openProject('${localDir}');`)
  } else {
    lines.push('rstudioapi::navigateToFile("arena.R");', 'rstudioapi::filesPaneNavigate(getwd());')
  }

  return lines.join('\r\n')
}

const _copyRStudioCode = async ({ rStudioCode }) => copyToClipboard(rStudioCode)

const isInstanceRunning = async () => {
  const currentInstance = await API.getCurrentInstance()
  return Boolean(currentInstance?.instanceId)
}

const checkCanOpenRStudio = ({ dispatch, state }) => {
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const chain = ChainState.getChain(state)

  if (Survey.isDraft(surveyInfo)) {
    dispatch(NotificationActions.notifyWarning({ key: 'chainView.cannotStartRStudio.surveyNotPublished' }))
    return false
  }

  if (!Chain.isIncludeEntitiesWithoutData(chain) && !ChainState.hasRecordsToProcess(state)) {
    dispatch(NotificationActions.notifyWarning({ key: 'chainView.cannotStartRStudio.noRecords' }))
    return false
  }

  return true
}

export const openRStudio =
  ({ isLocal = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()

    if (!checkCanOpenRStudio({ dispatch, state })) return

    const surveyInfo = SurveyState.getSurveyInfo(state)
    const surveyId = SurveyState.getSurveyId(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
    const user = UserState.getUser(state)
    const userUuid = User.getUuid(user)
    const chain = ChainState.getChain(state)

    dispatch(LoaderActions.showLoader())

    const config = { params: { surveyCycleKey } }
    const chainUuid = Chain.getUuid(chain)

    const hadInstance = !isLocal && (await isInstanceRunning())

    const { data } = await axios.post(`/api/survey/${surveyId}/chain/${chainUuid}/script`, config)

    const { token, serverUrl } = data

    const { instanceId, rStudioUrl } = isLocal ? {} : await _getRStudioParams({ userUuid })

    const rStudioCode = _getRStudioCode({ surveyId, chainUuid, token, serverUrl, isLocal, surveyInfo, surveyCycleKey })

    dispatch(LoaderActions.hideLoader())
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: isLocal ? 'chainView.copyRStudioCodeLocal' : 'chainView.copyRStudioCode',
        params: { rStudioCode },
        onOk: async () => {
          await _copyRStudioCode({ rStudioCode })
          if (!isLocal) {
            window.open(rStudioUrl, 'rstudio')
          }
        },
        onCancel: async () => {
          if (!hadInstance && !isLocal) {
            await API.terminateInstance({ instanceId })
          }
        },
      })
    )
  }
