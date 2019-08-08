export const nodeDefEditUpdate = 'surveyViews/nodeDefEdit/update'

// set current nodeDef edit
export const setNodeDefForEdit = nodeDef => dispatch =>
  dispatch({ type: nodeDefEditUpdate, nodeDef })

// reset current nodeDef edit
export const closeNodeDefEdit = () => dispatch =>
  dispatch({ type: nodeDefEditUpdate, nodeDef: null })