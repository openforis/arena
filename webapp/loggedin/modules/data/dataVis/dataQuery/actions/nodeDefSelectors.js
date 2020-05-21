import * as DataQueryState from '@webapp/loggedin/modules/data/dataVis/dataQuery/state'

export const dataQueryNodeDefSelectorsShowUpdate = 'dataQuery/nodeDefSelectors/show/update'

export const toggleNodeDefsSelector = () => (dispatch, getState) =>
  dispatch({
    type: dataQueryNodeDefSelectorsShowUpdate,
    show: !DataQueryState.isNodeDefSelectorsVisible(getState()),
  })
