// Taxonomy editor actions
export const taxonomyViewTaxonomyUpdate = 'taxonomyView/taxonomy/update'
export const taxonomyViewTaxonomyPropsUpdate = 'taxonomyView/taxonomy/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = (taxonomyUuid) => (dispatch) =>
  dispatch({ type: taxonomyViewTaxonomyUpdate, taxonomyUuid })
