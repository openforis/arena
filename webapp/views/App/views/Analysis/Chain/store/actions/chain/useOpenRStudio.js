import axios from 'axios'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import * as User from '@core/user/user'

import { LoaderActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { State } from '../../state'

const _getRStudioPoolUrl = async ({ userUuid }) => {
  const { data = {} } = await axios.post('/api/rstudio')
  const { instanceId = false } = data

  if (instanceId && ProcessUtils.ENV.rStudioProxyServerURL) {
    return `${ProcessUtils.ENV.rStudioProxyServerURL}${instanceId}_${userUuid}`
  }
  return false
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
      await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}/script`, config)

      dispatch(LoaderActions.hideLoader())

      const rStudioUrl = await _getRStudioUrl({ userUuid })
      window.open(rStudioUrl, 'rstudio')
    },
    [dispatch, surveyId, surveyCycleKey, userUuid]
  )
}
