export const tableVisibleColumnsUpdate = 'tables/visibleColumnsUpdate'
export const tableMaxRowsUpdate = 'tables/maxRowsUpdate'

export const updateVisibleColumns =
  ({ module, visibleColumns }) =>
  (dispatch) =>
    dispatch({ type: tableVisibleColumnsUpdate, module, visibleColumns })

export const updateMaxRows =
  ({ module, maxRows }) =>
  (dispatch) =>
    dispatch({ type: tableMaxRowsUpdate, module, maxRows })
