import axios from 'axios'

import { debounceAction } from '../../../utils/reduxUtils'
import Taxonomy from '../../../../common/survey/taxonomy'

import * as SurveyState from '../../../survey/surveyState'

import { showAppJobMonitor } from '../../../app/actions'
import {
  taxonomyCreate,
  taxonomyDelete,
  taxonomyPropUpdate,
  taxonomyUpdate,
  taxonomiesUpdate
} from '../../../survey/taxonomies/actions'

// taxonomy editor actions
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'
export const taxonomyEditPropsUpdate = 'survey/taxonomyEdit/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = taxonomy => dispatch =>
  dispatch({ type: taxonomyEditUpdate, taxonomyUuid: Taxonomy.getUuid(taxonomy) })

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  const taxonomy = data.taxonomy

  dispatch({ type: taxonomyCreate, taxonomy })

  return taxonomy
}

// ====== READ

const fetchTaxonomy = (surveyId, taxonomyUuid) => async dispatch => {
  const { data } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)
  dispatch({ type: taxonomyUpdate, taxonomy: data.taxonomy })
}

// ====== UPDATE
export const putTaxonomyProp = (taxonomy, key, value) => async (dispatch, getState) => {
  dispatch({ type: taxonomyPropUpdate, taxonomy, key, value })

  const action = async () => {
    const surveyId = SurveyState.getSurveyId(getState())
    const { data } = await axios.put(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`, { key, value })
    dispatch({ type: taxonomiesUpdate, taxonomies: data.taxonomies })
  }
  dispatch(debounceAction(action, `${taxonomyPropUpdate}_${Taxonomy.getUuid(taxonomy)}`))
}

export const uploadTaxonomyFile = (taxonomy, file) => async (dispatch, getState) => {
  const formData = new FormData()
  formData.append('file', file)

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/upload`, formData)

  dispatch(showAppJobMonitor(data.job, () => {
    //on import complete validate taxonomy and reload taxa
    dispatch(fetchTaxonomy(surveyId, Taxonomy.getUuid(taxonomy)))
  }))
}

// ====== DELETE
export const deleteTaxonomy = taxonomy => async (dispatch, getState) => {
  dispatch({ type: taxonomyDelete, taxonomy })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
  dispatch({ type: taxonomiesUpdate, taxonomies: data.taxonomies })
}

