import axios from 'axios'

import {newTaxonomy} from '../../../common/survey/taxonomy'

import { getSurvey } from '../surveyState'

export const taxonomyUpdate = 'survey/taxonomy/update'
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'

const dispatchTaxonomyUpdate = (dispatch, taxonomy) =>
  dispatch({type: taxonomyUpdate, taxonomies: {[taxonomy.uuid]: taxonomy}})

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

export const setTaxonomyForEdit = taxonomy => async (dispatch) => {
  dispatchTaxonomyEditUpdate(dispatch, taxonomy ? taxonomy.uuid : null)
}
