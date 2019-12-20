import { exportReducer } from '@webapp/utils/reduxUtils'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'

import {
  homeCollectImportReportUpdate,
  homeCollectImportReportItemUpdate,
  homeCollectImportReportRowsScrollTopUpdate,
} from './actions'

import * as CollectImportReportState from './collectImportReportState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeCollectImportReportUpdate]: (state, { items }) => CollectImportReportState.assocItems(items)(state),
  [homeCollectImportReportItemUpdate]: (state, { item }) => CollectImportReportState.updateItem(item)(state),
  [homeCollectImportReportRowsScrollTopUpdate]: (state, { scrollTop }) =>
    CollectImportReportState.assocRowsScrollTop(scrollTop)(state),
}

export default exportReducer(actionHandlers)
