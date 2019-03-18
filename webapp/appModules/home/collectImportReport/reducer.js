import { exportReducer } from '../../../appUtils/reduxUtils'

import { appUserLogout } from '../../../app/actions'

import { homeCollectImportReportUpdate, homeCollectImportReportItemUpdate } from './actions'
import * as CollectImportReportState from './collectImportReportState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [homeCollectImportReportUpdate]: (state, { items }) => items,
  [homeCollectImportReportItemUpdate]: (state, { item }) => CollectImportReportState.updateItem(item)(state)
}

export default exportReducer(actionHandlers)