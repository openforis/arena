export const nodeDefEditUpdate = 'surveyViews/nodeDefEdit/update'

// Set current nodeDef edit
export const setNodeDefForEdit = nodeDefUuid => dispatch => dispatch({ type: nodeDefEditUpdate, nodeDefUuid })

// Reset current nodeDef edit
export const closeNodeDefEdit = () => dispatch => dispatch({ type: nodeDefEditUpdate, nodeDefUuid: null })
