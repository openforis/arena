import axios from 'axios'
import * as R from 'ramda'

import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Validation from '@core/validation/validation'

import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Chain from '@common/analysis/processingChain'

import { AppSavingActions } from '@webapp/store/app'
import { useLang } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

const persistChain = async ({ surveyId, data }) => axios.post(`/api/survey/${surveyId}/processing-chain/`, data)

export const useOnSave = ({ chain, setChain }) => {
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
        await persistChain({ surveyId, data })

        dispatch(NotificationActions.notifyInfo({ key: 'common.saved' }))
        history.push(`${appModuleUri(analysisModules.processingChain)}${Chain.getUuid(chain)}/`)
      } else {
        setChain(Validation.assocValidation(chainValidation)(chain))
        dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
      }

      dispatch(AppSavingActions.hideAppSaving())
    })()
  }
}
