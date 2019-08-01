import { exportReducer } from '../../../utils/reduxUtils'

import Taxonomy from '../../../../common/survey/taxonomy'
import * as TaxonomyEditState from './taxonomyEditState'

import { appUserLogout } from '../../../app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '../../../survey/actions'
import { formReset } from '../surveyForm/actions'

import { taxonomyEditPropsUpdate, taxonomyEditUpdate } from './actions'
import { taxonomyCreate } from '../../../survey/taxonomies/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),
  [formReset]: () => ({}),

  [taxonomyEditUpdate]: (state, { taxonomyUuid }) => TaxonomyEditState.initTaxonomyEdit(taxonomyUuid),

  [taxonomyEditPropsUpdate]: (state, { type, ...props }) => TaxonomyEditState.mergeTaxonomyEditProps(props)(state),

  // create
  [taxonomyCreate]: (state, { taxonomy }) => TaxonomyEditState.initTaxonomyEdit(Taxonomy.getUuid(taxonomy)),
}

export default exportReducer(actionHandlers)