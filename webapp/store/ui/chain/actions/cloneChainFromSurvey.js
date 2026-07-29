import * as API from '@webapp/service/api'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { SurveyActions, SurveyState } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui/loader'
import { NotificationActions } from '@webapp/store/ui/notification'

export const cloneChainFromSurvey =
  ({ sourceSurveyId, sourceChainUuid, navigate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())
    try {
      const surveyId = SurveyState.getSurveyId(getState())
      const chain = await API.cloneChainFromSurvey({ targetSurveyId: surveyId, sourceSurveyId, sourceChainUuid })
      dispatch(SurveyActions.resetSurveyDefs())
      dispatch(NotificationActions.notifyInfo({ key: 'chainView.cloneFromAnotherSurveyDialog.cloneComplete' }))
      navigate(`${appModuleUri(analysisModules.chain)}${chain.uuid}/`)
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }
