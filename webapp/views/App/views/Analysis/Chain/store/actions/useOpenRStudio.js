import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as ProcessUtils from '@core/processUtils'
import * as Chain from '@common/analysis/processingChain'

import { LoaderActions } from '@webapp/store/ui'
import { useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'

const _getRStudioUrl = () => {
  if (ProcessUtils.ENV.rStudioServerURL) {
    return ProcessUtils.ENV.rStudioServerURL
  }
  if (ProcessUtils.isEnvDevelopment) {
    return 'http://localhost:8787'
  }
  return `${window.location.origin}/rstudio/`
}

export const useOpenRStudio = ({ chainState, ChainState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()

  return () => {
    ;(async () => {
      dispatch(LoaderActions.showLoader())

      const config = { params: { surveyCycleKey } }
      await axios.get(
        `/api/survey/${surveyId}/processing-chain/${Chain.getUuid(ChainState.getChain(chainState))}/script`,
        config
      )

      dispatch(LoaderActions.hideLoader())

      window.open(_getRStudioUrl(), 'rstudio')
    })()
  }
}
