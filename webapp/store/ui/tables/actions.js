export const tableVisibleColumnsUpdate = 'tables/visibleColumnsUpdate'
export const tableMaxRowsUpdate = 'tables/maxRowsUpdate'
export const tableSortUpdate = 'tables/sortUpdate'

export const updateVisibleColumns =
  ({ module, visibleColumns }) =>
  (dispatch) =>
    dispatch({ type: tableVisibleColumnsUpdate, module, visibleColumns })

export const updateMaxRows =
  ({ module, maxRows }) =>
  (dispatch) =>
    dispatch({ type: tableMaxRowsUpdate, module, maxRows })

export const updateSort =
  ({ module, sort }) =>
  (dispatch) =>
    dispatch({ type: tableSortUpdate, module, sort })
