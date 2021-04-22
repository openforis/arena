import axios from 'axios'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'
import { SurveyActions, SurveyState } from '@webapp/store/survey'

export const deleteChain = ({ chain, history }) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)

  const action = async () => {
    dispatch(LoaderActions.showLoader())

    await axios.delete(`/api/survey/${surveyId}/chain/${chain.uuid}`)

    dispatch(SurveyActions.metaUpdated())
    dispatch(NotificationActions.notifyInfo({ key: 'processingChainView.deleteComplete' }))
    dispatch(LoaderActions.hideLoader())

    history.push(appModuleUri(analysisModules.processingChains))
  }

  dispatch(
    DialogConfirmActions.showDialogConfirm({
      key: 'processingChainView.deleteConfirm',
      onOk: action,
    })
  )
}
