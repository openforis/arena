import { exportReducer } from '../../../../utils/reduxUtils'

import { appUserLogout } from '../../../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../../survey/actions'

import { homeCollectImportReportUpdate, homeCollectImportReportItemUpdate } from './actions'

import * as CollectImportReportState from './collectImportReportState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeCollectImportReportUpdate]: (state, { items }) => items,
  [homeCollectImportReportItemUpdate]: (state, { item }) => CollectImportReportState.updateItem(item)(state)
}

export default exportReducer(actionHandlers)