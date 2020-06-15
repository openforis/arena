import { exportReducer } from '@webapp/utils/reduxUtils'

import { SurveyActions } from '@webapp/store/survey'

import {
  homeCollectImportReportUpdate,
  homeCollectImportReportItemUpdate,
  homeCollectImportReportRowsScrollTopUpdate,
} from './actions'

import * as CollectImportReportState from './collectImportReportState'
import { SystemActions } from '@webapp/store/system'

const actionHandlers = {
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [homeCollectImportReportUpdate]: (state, { items }) => CollectImportReportState.assocItems(items)(state),
  [homeCollectImportReportItemUpdate]: (state, { item }) => CollectImportReportState.updateItem(item)(state),
  [homeCollectImportReportRowsScrollTopUpdate]: (state, { scrollTop }) =>
    CollectImportReportState.assocRowsScrollTop(scrollTop)(state),
}

export default exportReducer(actionHandlers)
