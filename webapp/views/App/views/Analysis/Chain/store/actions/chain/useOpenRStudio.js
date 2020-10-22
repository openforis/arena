import axios from 'axios'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import * as User from '@core/user/user'

import { DialogConfirmActions, LoaderActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { State } from '../../state'

const _getRStudioPoolUrl = async ({ userUuid }) => {
  try {
    const { data = {} } = await axios.post('/api/rstudio')
    const { instanceId = false } = data

    if (instanceId && ProcessUtils.ENV.rStudioProxyServerURL) {
      return `${ProcessUtils.ENV.rStudioProxyServerURL}${instanceId}_${userUuid}`
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

  if (ProcessUtils.isEnvDevelopment) {
    return 'http://localhost:8787'
  }
  return `${window.location.origin}/rstudio/`
}

const _getTStudioCode = ({ surveyId, chainUuid, folderToken, serverUrl }) =>
  `url <- '${
    ProcessUtils.ENV.rStudioDownloadServerUrl || serverUrl
  }/api/download/survey/${surveyId}/processing-chain/${chainUuid}/script?surveyCycleKey=0&folderToken=${folderToken}';download.file(url,"./${folderToken}.zip");unzip("./${folderToken}.zip",exdir=".");file.remove("./${folderToken}.zip")`

const _copyRStudioCode = ({ rStudioCode }) => {
  const input = document.body.appendChild(document.createElement('input'))
  input.value = rStudioCode
  input.focus()
  input.select()
  document.execCommand('copy')
  input.remove()
}

export const useOpenRStudio = () => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()
  const user = useUser()
  const userUuid = User.getUuid(user)

  return useCallback(
    async ({ state }) => {
      dispatch(LoaderActions.showLoader())

      const config = { params: { surveyCycleKey } }
      const chainUuid = Chain.getUuid(State.getChain(state))
      const { data } = await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}/script`, config)

      const rStudioUrl = await _getRStudioUrl({ userUuid })

      const { folderToken, serverUrl } = data

      const rStudioCode = _getTStudioCode({ surveyId, chainUuid, folderToken, serverUrl })

      dispatch(LoaderActions.hideLoader())
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingChainView.copyRStudioCode',
          params: { rStudioCode },
          onOk: () => {
            _copyRStudioCode({ rStudioCode })
            window.open(rStudioUrl, 'rstudio')
          },
        })
      )
    },
    [dispatch, surveyId, surveyCycleKey, userUuid]
  )
}
