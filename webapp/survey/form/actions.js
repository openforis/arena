/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS EDIT
 */

export const formReset = 'survey/form/reset'

export const resetForm = () => dispatch =>
  dispatch({type: formReset})

// ====== nodeDef edit
export const formNodeDefEditUpdate = 'survey/form/nodeDefEdit/update'
export const formNodeDefUnlockedUpdate = 'survey/form/nodeDefUnlocked/update'

// set current nodeDef edit
export const setFormNodeDefEdit = nodeDef => dispatch =>
  dispatch({type: formNodeDefEditUpdate, nodeDef})

// reset current nodeDef edit
export const closeFormNodeDefEdit = () => async dispatch =>
  dispatch({type: formNodeDefEditUpdate, nodeDef: null})

// set current nodeDef unlocked
export const setFormNodeDefUnlocked = nodeDef => dispatch =>
  dispatch({type: formNodeDefUnlockedUpdate, nodeDef})


// current nodeDef of active form page
export const formActivePageNodeDefUpdate = 'survey/form/activePageNodeDef/update'

export const setFormActivePage = (nodeDef) => dispatch =>
  dispatch({type: formActivePageNodeDefUpdate, nodeDef})


// current node of active form page
export const formPageNodeUpdate = 'survey/form/pageNode/update'

export const setFormPageNode = (nodeDef, node) => dispatch =>
  dispatch({type: formPageNodeUpdate, nodeDef, node})