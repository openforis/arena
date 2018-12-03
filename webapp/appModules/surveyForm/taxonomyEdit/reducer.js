import { exportReducer } from '../../../appUtils/reduxUtils'

import { surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import { taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import { initTaxonomyEdit, mergeTaxonomyEditProps } from './taxonomyEditState'
import { taxonomyCreate } from '../../../survey/taxonomies/actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyEditUpdate]: (state, {taxonomyUuid}) => initTaxonomyEdit(taxonomyUuid),

  [taxonomyEditPropsUpdate]: (state, {type, ...props}) => mergeTaxonomyEditProps(props)(state),

  // create
  [taxonomyCreate]: (state, {taxonomy}) => initTaxonomyEdit(taxonomy.uuid),
}

export default exportReducer(actionHandlers)