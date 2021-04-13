import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'exportCsvData'

const keys = {
  exportCsvDataUrl: 'exportCsvDataUrl',
}

export const assocExportCsvDataUrl = (url) => R.assoc(keys.exportCsvDataUrl, url)

// ====== READ

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))
const getStateProp = (prop, defaultTo = null) => R.pipe(getState, R.propOr(defaultTo, prop))

export const geExportCsvDataUrl = getStateProp(keys.exportCsvDataUrl, false)
