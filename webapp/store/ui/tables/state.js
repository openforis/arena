import * as A from '@core/arena'

import * as UiState from '../state'
import { Objects } from '@openforis/arena-core'

export const stateKey = 'tables'

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

const keys = {
  visibleColumnKeysByModule: 'visibleColumnKeysByModule',
  maxRowsByModule: 'maxRowsByModule',
  sortByModule: 'sortByModule',
}

export const getVisibleColumns = (module) => A.pipe(getState, Objects.path([keys.visibleColumnKeysByModule, module]))

export const getMaxRows = (module) => A.pipe(getState, Objects.path([keys.maxRowsByModule, module]))

export const getSort = (module) => A.pipe(getState, Objects.path([keys.sortByModule, module]))

export const assocVisibleColumns =
  ({ module, visibleColumns }) =>
  (state) =>
    Objects.assocPath({ obj: state, path: [keys.visibleColumnKeysByModule, module], value: visibleColumns })

export const assocMaxRows =
  ({ module, maxRows }) =>
  (state) =>
    Objects.assocPath({ obj: state, path: [keys.maxRowsByModule, module], value: maxRows })

export const assocSort =
  ({ module, sort }) =>
  (state) =>
    Objects.assocPath({ obj: state, path: [keys.sortByModule, module], value: sort })
