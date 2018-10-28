import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../appUtils/reduxUtils'
import { newTaxonomy, assocTaxonomyProp } from '../../../common/survey/taxonomy'

import { getSurvey } from '../surveyState'
import { getTaxonomyEditTaxonomy } from './taxonomyEditState'
import { showAppJobMonitor } from '../../app/components/job/actions'
import { toQueryString } from '../../../server/serverUtils/request'

import { dispatchMarkCurrentSurveyDraft } from '../actions'

export const taxonomiesUpdate = 'survey/taxonomy/update'
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'

const dispatchTaxonomiesUpdate = (dispatch, taxonomies) =>
  dispatch({type: taxonomiesUpdate, taxonomies})

const dispatchTaxonomyUpdate = (dispatch, taxonomy) =>
  dispatchTaxonomiesUpdate(dispatch, {[taxonomy.uuid]: taxonomy})

const dispatchTaxonomyEditUpdate = (dispatch, props) =>
  dispatch({type: taxonomyEditUpdate, ...props})

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  const taxonomy = newTaxonomy()

  dispatchTaxonomyUpdate(dispatch, taxonomy)

  dispatchTaxonomyEditUpdate(dispatch, {uuid: taxonomy.uuid})

  const survey = getSurvey(getState())
  const res = await axios.post(`/api/survey/${survey.id}/taxonomies`, taxonomy)

  const {taxonomy: addedTaxonomy} = res.data

  dispatchTaxonomyUpdate(dispatch, addedTaxonomy)
}

// ====== READ

const ROWS_PER_PAGE = 15

export const reloadTaxa = () => async (dispatch, getState) => {
  const survey = getSurvey(getState())
  const taxonomy = getTaxonomyEditTaxonomy(survey)

  const params = {
    draft: true
  }

  const {data} = await axios.get(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/taxa/count?${toQueryString(params)}`)

  dispatchTaxonomyEditUpdate(dispatch, {taxaTotalPages: Math.ceil(data.count / ROWS_PER_PAGE)})

  dispatch(loadTaxaPage(1))
}

export const loadTaxaPage = page => async (dispatch, getState) => {
  dispatchTaxonomyEditUpdate(dispatch, {taxaCurrentPage: page, taxa: []})

  const survey = getSurvey(getState())
  const taxonomy = getTaxonomyEditTaxonomy(survey)

  const params = {
    draft: true,
    limit: ROWS_PER_PAGE,
    offset: (page - 1) * ROWS_PER_PAGE
  }

  const {data} = await axios.get(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}/taxa?${toQueryString(params)}`)

  dispatchTaxonomyEditUpdate(dispatch, {taxa: data.taxa})
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
      const {data} = await axios.put(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}`, {key, value})
      const {taxonomies} = data
      dispatchTaxonomiesUpdate(dispatch, taxonomies)
    } catch (e) {}
  }
  dispatch(debounceAction(action, `${taxonomiesUpdate}_${taxonomy.uuid}`))
}

export const uploadTaxonomyFile = (surveyId, taxonomyId, file) => async dispatch => {
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

  const survey = getSurvey(getState())

  dispatchTaxonomiesUpdate(dispatch, {[taxonomy.uuid]: null})

  await axios.delete(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}`)
}

// ====== UTILS

export const setTaxonomyForEdit = taxonomy => async (dispatch) => {
  dispatchTaxonomyEditUpdate(dispatch, {uuid: taxonomy ? taxonomy.uuid : null})
}
