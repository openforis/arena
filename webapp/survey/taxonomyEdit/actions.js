import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../appUtils/reduxUtils'
import { getSurveyId } from '../../../common/survey/survey'
import { newTaxonomy, assocTaxonomyProp } from '../../../common/survey/taxonomy'

import { getSurvey, getStateSurveyId } from '../surveyState'
import { getTaxonomyEditTaxonomy } from './taxonomyEditState'
import { showAppJobMonitor } from '../../app/components/job/actions'

import { dispatchMarkCurrentSurveyDraft } from '../actions'
import { dispatchTaxonomiesUpdate } from '../taxonomies/actions'

export const taxonomyCreate = 'survey/taxonomy/create'
export const taxonomyUpdate = 'survey/taxonomy/update'
export const taxonomyDelete = 'survey/taxonomy/delete'

export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'
export const taxonomyEditPropsUpdate = 'survey/taxonomyEdit/props/update'

const dispatchTaxonomyUpdate = (dispatch, taxonomy) => dispatch({type: taxonomyUpdate, taxonomy})

const dispatchTaxonomyEditPropsUpdate = (dispatch, props) => dispatch({type: taxonomyEditPropsUpdate, ...props})

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = taxonomy => dispatch =>
  dispatch({type: taxonomyEditUpdate, taxonomyUUID: taxonomy ? taxonomy.uuid : null})

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const taxonomy = newTaxonomy()

  dispatch({type: taxonomyCreate, taxonomy})

  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.post(`/api/survey/${surveyId}/taxonomies`, taxonomy)

  dispatchTaxonomyUpdate(dispatch, data.taxonomy)
}

// ====== READ

const ROWS_PER_PAGE = 15

export const reloadTaxa = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const taxonomy = getTaxonomyEditTaxonomy(survey)

  const {data} = await axios.get(`/api/survey/${getSurveyId(survey)}/taxonomies/${taxonomy.id}/taxa/count?draft=true`)

  dispatchTaxonomyEditPropsUpdate(dispatch, {taxaTotalPages: Math.ceil(data.count / ROWS_PER_PAGE)})

  dispatch(loadTaxaPage(1))
}

export const loadTaxaPage = page => async (dispatch, getState) => {
  dispatchTaxonomyEditPropsUpdate(dispatch, {taxaCurrentPage: page, taxa: []})

  const survey = getSurvey(getState())
  const taxonomy = getTaxonomyEditTaxonomy(survey)

  const {data} = await axios.get(`/api/survey/${getSurveyId(survey)}/taxonomies/${taxonomy.id}/taxa`, {
    params: {
      draft: true,
      limit: ROWS_PER_PAGE,
      offset: (page - 1) * ROWS_PER_PAGE
    }
  })

  dispatchTaxonomyEditPropsUpdate(dispatch, {taxa: data.taxa})
}

// ====== UPDATE

export const putTaxonomyProp = (taxonomyUUID, key, value) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const survey = getSurvey(getState())

  const taxonomy = R.pipe(
    getTaxonomyEditTaxonomy,
    assocTaxonomyProp(key, value),
    R.dissocPath(['validation', 'fields', key]),
  )(survey)

  dispatchTaxonomyUpdate(dispatch, taxonomy)

  const action = async () => {
    try {
      const {data} = await axios.put(`/api/survey/${getSurveyId(survey)}/taxonomies/${taxonomy.id}`, {key, value})
      const {taxonomies} = data
      dispatchTaxonomiesUpdate(dispatch, taxonomies)
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${taxonomyUpdate}_${taxonomy.uuid}`))
}

export const uploadTaxonomyFile = (surveyId, taxonomyId, file) => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const formData = new FormData()
  formData.append('file', file)

  const config = {
    headers: {
      'content-type': 'multipart/form-data'
    }
  }

  const {data} = await axios.post(`/api/survey/${surveyId}/taxonomies/${taxonomyId}/upload`, formData, config)

  dispatch(showAppJobMonitor(data.job))
}

// ====== DELETE

export const deleteTaxonomy = taxonomy => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const surveyId = getStateSurveyId(getState())

  dispatch({type: taxonomyDelete, taxonomy})

  await axios.delete(`/api/survey/${surveyId}/taxonomies/${taxonomy.id}`)
}

