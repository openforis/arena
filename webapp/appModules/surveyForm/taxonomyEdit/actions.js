import axios from 'axios'
import Promise from 'bluebird'

import { debounceAction } from '../../../appUtils/reduxUtils'
import Taxonomy from '../../../../common/survey/taxonomy'

import { getStateSurveyId } from '../../../survey/surveyState'
import { showAppJobMonitor } from '../../appView/components/job/actions'
import { getTaxonomyEditTaxaPerPage } from './taxonomyEditState'
import {
  taxonomyCreate,
  taxonomyDelete,
  taxonomyPropUpdate,
  taxonomyUpdate,
  taxonomiesUpdate
} from '../../../survey/taxonomies/actions'
import { getSurveyForm } from '../surveyFormState'

// taxonomy editor actions
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'
export const taxonomyEditPropsUpdate = 'survey/taxonomyEdit/props/update'

const dispatchTaxonomyEditPropsUpdate = (dispatch, props) => dispatch({type: taxonomyEditPropsUpdate, ...props})

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = taxonomy => dispatch =>
  dispatch({type: taxonomyEditUpdate, taxonomyUuid: taxonomy ? taxonomy.uuid : null})

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  const taxonomy = data.taxonomy

  dispatch({type: taxonomyCreate, taxonomy})

  return taxonomy
}

// ====== READ

const countTaxa = async (surveyId, taxonomyUuid) => {
  const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa/count?draft=true`)
  return data.count
}

const fetchTaxa = async (surveyId, taxonomyUuid, offset, limit) => {
  const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`, {
    params: {
      draft: true,
      limit,
      offset
    }
  })
  return data.taxa
}

const fetchTaxonomy = (surveyId, taxonomyUuid) => async dispatch => {
  const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)
  dispatch({type: taxonomyUpdate, taxonomy: data.taxonomy})
}

const ROWS_PER_PAGE = 15

export const initTaxaList = taxonomy => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())

  const [count, taxa] = await Promise.all([
    await countTaxa(surveyId, taxonomy.uuid),
    await fetchTaxa(surveyId, taxonomy.uuid, 0, ROWS_PER_PAGE)
  ])

  dispatchTaxonomyEditPropsUpdate(dispatch, {
    taxaCurrentPage: 1,
    taxaTotalPages: Math.ceil(count / ROWS_PER_PAGE),
    taxa,
  })
}

export const loadTaxa = (taxonomy, page = 1) => async (dispatch, getState) => {
  dispatchTaxonomyEditPropsUpdate(dispatch, {taxaCurrentPage: page, taxa: []})

  const state = getState()
  const surveyForm = getSurveyForm(state)
  const surveyId = getStateSurveyId(state)
  const rowsPerPage = getTaxonomyEditTaxaPerPage(surveyForm)
  const taxa = await fetchTaxa(surveyId, taxonomy.uuid, (page - 1) * rowsPerPage, rowsPerPage)

  dispatchTaxonomyEditPropsUpdate(dispatch, {taxa})
}

// ====== UPDATE
export const putTaxonomyProp = (taxonomy, key, value) => async (dispatch, getState) => {
  dispatch({type: taxonomyPropUpdate, taxonomy, key, value})

  const action = async () => {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.put(`/api/survey/${surveyId}/taxonomies/${taxonomy.uuid}`, {key, value})
    dispatch({type: taxonomiesUpdate, taxonomies: data.taxonomies})
  }
  dispatch(debounceAction(action, `${taxonomyPropUpdate}_${taxonomy.uuid}`))
}

export const uploadTaxonomyFile = (taxonomy, file) => async (dispatch, getState) => {
  const formData = new FormData()
  formData.append('file', file)

  const config = {
    headers: {
      'content-type': 'multipart/form-data'
    }
  }

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/taxonomies/${taxonomy.uuid}/upload`, formData, config)

  dispatch(showAppJobMonitor(data.job, () => {
    //on import complete validate taxonomy and reload taxa
    dispatch(fetchTaxonomy(surveyId, taxonomy.uuid))
    dispatch(initTaxaList(taxonomy))
  }))
}

// ====== DELETE
export const deleteTaxonomy = taxonomy => async (dispatch, getState) => {
  dispatch({type: taxonomyDelete, taxonomy})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.delete(`/api/survey/${surveyId}/taxonomies/${taxonomy.uuid}`)
  dispatch({type: taxonomiesUpdate, taxonomies: data.taxonomies})
}

