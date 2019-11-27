export const nodeDefEditUpdate = 'surveyViews/nodeDefEdit/update'

// Set current nodeDef edit
export const setNodeDefForEdit = nodeDef => dispatch =>
  dispatch({type: nodeDefEditUpdate, nodeDef})

// Reset current nodeDef edit
export const closeNodeDefEdit = () => dispatch =>
  dispatch({type: nodeDefEditUpdate, nodeDef: null})
