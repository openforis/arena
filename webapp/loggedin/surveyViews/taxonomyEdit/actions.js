import axios from 'axios'

import { debounceAction } from '../../../utils/reduxUtils'
import Taxonomy from '../../../../common/survey/taxonomy'

import * as SurveyState from '../../../survey/surveyState'
import * as TaxonomyEditState from './taxonomyEditState'

import { showAppJobMonitor } from '../../appJob/actions'
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

const dispatchTaxonomyEditPropsUpdate = (dispatch, props) => dispatch({ type: taxonomyEditPropsUpdate, ...props })

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

const countTaxa = async (surveyId, taxonomyUuid) => {
  const { data } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa/count?draft=true`)
  return data.count
}

const fetchTaxa = async (surveyId, taxonomyUuid, offset, limit) => {
  const { data } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`, {
    params: {
      draft: true,
      limit,
      offset
    }
  })
  return data.taxa
}

const fetchTaxonomy = (surveyId, taxonomyUuid) => async dispatch => {
  const { data } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)
  dispatch({ type: taxonomyUpdate, taxonomy: data.taxonomy })
}

const ROWS_PER_PAGE = 15

export const initTaxaList = taxonomy => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const taxonomyUuid = Taxonomy.getUuid(taxonomy)

  const [count, taxa] = await Promise.all([
    await countTaxa(surveyId, taxonomyUuid),
    await fetchTaxa(surveyId, taxonomyUuid, 0, ROWS_PER_PAGE)
  ])

  dispatchTaxonomyEditPropsUpdate(dispatch, {
    taxaTotalPages: Math.ceil(count / ROWS_PER_PAGE),
    taxaTotal: count,
    taxa,
  })
}

export const loadTaxa = (taxonomy, offset) => async (dispatch, getState) => {

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const rowsPerPage = TaxonomyEditState.getTaxaPerPage(state)

  dispatchTaxonomyEditPropsUpdate(dispatch, { taxaCurrentPage: Math.floor(offset / rowsPerPage), taxa: [] })

  const taxa = await fetchTaxa(surveyId, Taxonomy.getUuid(taxonomy), offset, rowsPerPage)

  dispatchTaxonomyEditPropsUpdate(dispatch, { taxa })
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

  const config = {
    headers: {
      'content-type': 'multipart/form-data'
    }
  }

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/upload`, formData, config)

  dispatch(showAppJobMonitor(data.job, () => {
    //on import complete validate taxonomy and reload taxa
    dispatch(fetchTaxonomy(surveyId, Taxonomy.getUuid(taxonomy)))
    dispatch(initTaxaList(taxonomy))
  }))
}

// ====== DELETE
export const deleteTaxonomy = taxonomy => async (dispatch, getState) => {
  dispatch({ type: taxonomyDelete, taxonomy })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
  dispatch({ type: taxonomiesUpdate, taxonomies: data.taxonomies })
}

