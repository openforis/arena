export const nodeDefUuidEditUpdate = 'surveyViews/nodeDefUuidEdit/update'

// Set current nodeDef edit
export const setNodeDefUuidForEdit = nodeDefUuid => dispatch => dispatch({ type: nodeDefUuidEditUpdate, nodeDefUuid })
