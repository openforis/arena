export const nodeDefEditUpdate = 'surveyViews/nodeDefEdit/update'

// Set current nodeDef edit
export const setNodeDefForEdit = nodeDefUuid => dispatch => dispatch({ type: nodeDefEditUpdate, nodeDefUuid })
