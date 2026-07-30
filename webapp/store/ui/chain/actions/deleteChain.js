import * as API from '@webapp/service/api'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { ChainActions } from '@webapp/store/ui/chain'

/**
 * Deletes a chain.
 * By default asks for confirmation, shows a loader and a notification, and navigates to the chains list.
 * In "silent" mode (used e.g. to clean up a chain just created and never labeled, when the user navigates
 * away from the chain details page), it skips the confirm dialog, loader, notification and navigation.
 * @param {object} params - The parameters.
 * @param {object} params.chain - The chain to delete.
 * @param {Function} [params.navigate] - Navigate function, used to redirect to the chains list (ignored in silent mode).
 * @param {boolean} [params.silent] - True to delete without confirm dialog, loader, notification or navigation.
 * @returns {Function} - Redux thunk.
 */
export const deleteChain =
  ({ chain, navigate, silent = false }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const action = async () => {
      if (!silent) dispatch(LoaderActions.showLoader())

      await API.deleteChain({ surveyId, chainUuid: chain.uuid })

      dispatch(SurveyActions.metaUpdated())
      dispatch(ChainActions.updateChain({ chain: { ...chain, isDeleted: true } }))

      if (!silent) {
        dispatch(NotificationActions.notifyInfo({ key: 'chainView.deleteComplete' }))
        dispatch(LoaderActions.hideLoader())
        navigate(appModuleUri(analysisModules.chains))
      }
    }

    if (silent) {
      await action()
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'chainView.deleteConfirm',
          onOk: action,
        })
      )
    }
  }
