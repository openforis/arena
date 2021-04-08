import { exportReducer } from '@webapp/utils/reduxUtils'

import * as ExportCsvDataActions from './actions'
import * as ExportCsvDataState from './state'

const actionHandlers = {
  [ExportCsvDataActions.exportCsvDataUrlUpdate]: (state, { exportCsvDataUrl }) =>
    ExportCsvDataState.assocExportCsvDataUrl(exportCsvDataUrl)(state),
}

export default exportReducer(actionHandlers)
