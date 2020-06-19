import * as DataQueryState from '@webapp/views/App/views/Data/Explorer/DataQuery/state'

export const dataQueryNodeDefSelectorsShowUpdate = 'dataQuery/nodeDefSelectors/show/update'

export const toggleNodeDefsSelector = () => (dispatch, getState) =>
  dispatch({
    type: dataQueryNodeDefSelectorsShowUpdate,
    show: !DataQueryState.isNodeDefSelectorsVisible(getState()),
  })
