import axios from 'axios'
import * as R from 'ramda'

import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Validation from '@core/validation/validation'

import { AppSavingActions } from '@webapp/store/app'
import { useLang } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as Chain from '@common/analysis/processingChain'

export const useOnSave = ({ chain }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const lang = useLang()
  const surveyId = useSurveyId()

  return () => {
    ;(async () => {
      dispatch(AppSavingActions.showAppSaving())

      const chainValidation = await ChainValidator.validateChain(chain, lang)

      if (R.all(Validation.isValid, [chainValidation])) {
        const data = { chain: Chain.dissocProcessingSteps(chain) }
        await axios.post(`/api/survey/${surveyId}/processing-chain/`, data)

        dispatch(NotificationActions.notifyInfo({ key: 'common.saved' }))
        history.push(`${appModuleUri(analysisModules.processingChain)}${Chain.getUuid(chain)}/`)
      } else {
        // dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chain) })
        dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
      }

      dispatch(AppSavingActions.hideAppSaving())
    })()
  }
}
