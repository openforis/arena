import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { SurveyActions } from '@webapp/store/survey'

import {
  homeCollectImportReportUpdate,
  homeCollectImportReportItemUpdate,
  homeCollectImportReportRowsScrollTopUpdate,
} from './actions'

import * as CollectImportReportState from './collectImportReportState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [homeCollectImportReportUpdate]: (state, { items }) => CollectImportReportState.assocItems(items)(state),
  [homeCollectImportReportItemUpdate]: (state, { item }) => CollectImportReportState.updateItem(item)(state),
  [homeCollectImportReportRowsScrollTopUpdate]: (state, { scrollTop }) =>
    CollectImportReportState.assocRowsScrollTop(scrollTop)(state),
}

export default exportReducer(actionHandlers)
