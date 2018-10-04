import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../appUtils/reduxUtils'
import { newTaxonomy, assocTaxonomyProp } from '../../../common/survey/taxonomy'

import { assocValidation } from '../../../common/validation/validator'
import { getSurvey } from '../surveyState'
import { getTaxonomyEditTaxonomy } from './taxonomyEditState'

export const taxonomiesUpdate = 'survey/taxonomy/update'
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'

const dispatchTaxonomyUpdate = (dispatch, taxonomy) =>
  dispatch({type: taxonomiesUpdate, taxonomies: {[taxonomy.uuid]: taxonomy}})

const dispatchTaxonomyEditUpdate = (dispatch, taxonomyUUID) =>
  dispatch({type: taxonomyEditUpdate, taxonomyUUID})

// ==== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  const taxonomy = newTaxonomy()

  dispatchTaxonomyUpdate(dispatch, taxonomy)

  dispatchTaxonomyEditUpdate(dispatch, taxonomy.uuid)

  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/taxonomies`, taxonomy)

  const {taxonomy: addedTaxonomy} = res.data

  dispatchTaxonomyUpdate(dispatch, addedTaxonomy)
}

// ==== UPDATE

export const putTaxonomyProp = (taxonomyUUID, key, value) => async (dispatch, getState) => {
  const survey = getSurvey(getState())

  const taxonomy = R.pipe(
    getTaxonomyEditTaxonomy,
    assocTaxonomyProp(key, value),
    R.dissocPath(['validation', 'fields', key]),
  )(survey)

  dispatchTaxonomyUpdate(dispatch, taxonomy)

  const action = async () => {
    try {
      const {data} = await axios.put(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}`, {key, value})
      const {validation} = data

      const updatedTaxonomy = assocValidation(validation)(taxonomy)

      dispatchTaxonomyUpdate(dispatch, updatedTaxonomy)
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${taxonomiesUpdate}_${taxonomy.uuid}`))
}

export const setTaxonomyForEdit = taxonomy => async (dispatch) => {
  dispatchTaxonomyEditUpdate(dispatch, taxonomy ? taxonomy.uuid : null)
}
