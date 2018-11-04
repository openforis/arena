import { exportReducer } from '../../../appUtils/reduxUtils'

import { surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { taxonomyCreate, taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import { initTaxonomyEdit, mergeTaxonomyEditProps } from './taxonomyEditState'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [taxonomyEditUpdate]: (state, {taxonomyUUID}) => initTaxonomyEdit(taxonomyUUID),

  [taxonomyEditPropsUpdate]: (state, {type, ...props}) => mergeTaxonomyEditProps(props)(state),

  // create
  [taxonomyCreate]: (state, {taxonomy}) => initTaxonomyEdit(taxonomy.uuid),
}

export default exportReducer(actionHandlers)