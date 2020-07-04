import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

export const useDelete = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const { chainUuid } = useParams()

  const resetChain = async () => {
    if (chainUuid) {
      await axios.delete(`/api/survey/${surveyId}/processing-chain/${chainUuid}`)
      dispatch(SurveyActions.chainItemDelete())
    }
    dispatch(NotificationActions.notifyInfo({ key: 'processingChainView.deleteComplete' }))
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'processingChainView.deleteConfirm',
        onOk: resetChain,
      })
    )
  }, [])
}
