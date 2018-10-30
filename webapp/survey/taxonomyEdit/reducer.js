import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import { taxonomyCreate, taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import { setTaxonomyEdit, mergeTaxonomyEditProps } from './taxonomyEditState'

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [taxonomyEditUpdate]: (state, {taxonomyUUID}) => setTaxonomyEdit(taxonomyUUID),

  [taxonomyEditPropsUpdate]: (state, {type, ...props}) => mergeTaxonomyEditProps(props)(state),

  // create
  [taxonomyCreate]: (state, {taxonomy}) => setTaxonomyEdit(taxonomy.uuid)(state),

}

export default exportReducer(actionHandlers)