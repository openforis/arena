
export const formNodeDefEditUpdate = 'survey/nodeDef/edit/update'

// set current nodeDef edit
export const setFormNodeDefEdit = nodeDef => dispatch =>
  dispatch({ type: formNodeDefEditUpdate, nodeDef })

// reset current nodeDef edit
export const closeFormNodeDefEdit = () => async dispatch =>
  dispatch({ type: formNodeDefEditUpdate, nodeDef: null })