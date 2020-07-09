import axios from 'axios'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'

import { SurveyState, TaxonomiesActions } from '@webapp/store/survey'

// Taxonomy editor actions
export const taxonomyViewTaxonomyUpdate = 'taxonomyView/taxonomy/update'
export const taxonomyViewTaxonomyPropsUpdate = 'taxonomyView/taxonomy/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = (taxonomyUuid) => (dispatch) =>
  dispatch({ type: taxonomyViewTaxonomyUpdate, taxonomyUuid })

// ====== UPDATE
export const putTaxonomyProp = (taxonomy, key, value) => async (dispatch, getState) => {
  dispatch({ type: TaxonomiesActions.taxonomyPropUpdate, taxonomy, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`, { key, value })
    dispatch({ type: TaxonomiesActions.taxonomiesUpdate, taxonomies: data.taxonomies })
  }

  dispatch(debounceAction(action, `${TaxonomiesActions.taxonomyPropUpdate}_${Taxonomy.getUuid(taxonomy)}`))
}
