import axios from 'axios'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import { LoaderActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

const _getRStudioUrl = () => {
  if (ProcessUtils.ENV.rStudioServerURL) {
    return ProcessUtils.ENV.rStudioServerURL
  }
  if (ProcessUtils.isEnvDevelopment) {
    return 'http://localhost:8787'
  }
  return `${window.location.origin}/rstudio/`
}

export const useOpenRStudio = () => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return useCallback(async ({ state }) => {
    dispatch(LoaderActions.showLoader())

    const config = { params: { surveyCycleKey } }
    const chainUuid = Chain.getUuid(State.getChain(state))
    await axios.get(`/api/survey/${surveyId}/processing-chain/${chainUuid}/script`, config)

    dispatch(LoaderActions.hideLoader())

    window.open(_getRStudioUrl(), 'rstudio')
  }, [])
}
