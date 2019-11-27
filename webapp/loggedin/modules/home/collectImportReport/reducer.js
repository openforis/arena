import {exportReducer} from '@webapp/utils/reduxUtils'

import {appUserLogout} from '@webapp/app/actions'
import {surveyCreate, surveyDelete, surveyUpdate} from '@webapp/survey/actions'

import {
  homeCollectImportReportUpdate,
  homeCollectImportReportItemUpdate,
} from './actions'

import * as CollectImportReportState from './collectImportReportState'

const actionHandlers = {
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [homeCollectImportReportUpdate]: (state, {items}) => items,
  [homeCollectImportReportItemUpdate]: (state, {item}) =>
    CollectImportReportState.updateItem(item)(state),
}

export default exportReducer(actionHandlers)
