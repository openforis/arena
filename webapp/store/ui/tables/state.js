import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as UiState from '../state'

export const stateKey = 'tables'

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

const keys = {
  visibleColumnKeysByModule: 'visibleColumnKeysByModule',
  maxRowsByModule: 'maxRowsByModule',
}

export const getVisibleColumns = (module) => A.pipe(getState, Objects.path([keys.visibleColumnKeysByModule, module]))

export const getMaxRows = (module) => A.pipe(getState, Objects.path([keys.maxRowsByModule, module]))

export const assocVisibleColumns =
  ({ module, visibleColumns }) =>
  (state) =>
    Objects.assocPath({ obj: state, path: [keys.visibleColumnKeysByModule, module], value: visibleColumns })

export const assocMaxRows =
  ({ module, maxRows }) =>
  (state) =>
    Objects.assocPath({ obj: state, path: [keys.maxRowsByModule, module], value: maxRows })
