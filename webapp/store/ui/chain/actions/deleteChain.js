import axios from 'axios'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActions } from '@webapp/store/ui/chain'
import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'

export const deleteChain =
  ({ chain, navigate }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const action = async () => {
      dispatch(LoaderActions.showLoader())

      await axios.delete(`/api/survey/${surveyId}/chain/${chain.uuid}`)

      dispatch(SurveyActions.metaUpdated())
      dispatch(NotificationActions.notifyInfo({ key: 'chainView.deleteComplete' }))
      dispatch(ChainActions.updateChain({ chain: { ...chain, isDeleted: true } }))
      dispatch(LoaderActions.hideLoader())

      navigate(appModuleUri(analysisModules.chains))
    }

    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'chainView.deleteConfirm',
        onOk: action,
      })
    )
  }
