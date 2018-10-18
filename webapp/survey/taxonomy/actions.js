import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../appUtils/reduxUtils'
import { newTaxonomy, assocTaxonomyProp } from '../../../common/survey/taxonomy'

import { assocValidation } from '../../../common/validation/validator'
import { getSurvey } from '../surveyState'
import { getTaxonomyEditTaxaCurrentPage, getTaxonomyEditTaxonomy } from './taxonomyEditState'
import { showAppJobMonitor } from '../../app/components/job/actions'
import { toQueryString } from '../../../server/serverUtils/request'

export const taxonomiesUpdate = 'survey/taxonomy/update'
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'

const dispatchTaxonomyUpdate = (dispatch, taxonomy) =>
  dispatch({type: taxonomiesUpdate, taxonomies: {[taxonomy.uuid]: taxonomy}})

const dispatchTaxonomyEditUpdate = (dispatch, props) =>
  dispatch({type: taxonomyEditUpdate, ...props})

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
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

export const uploadTaxonomyFile = (surveyId, taxonomyId, file) => async dispatch => {
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
  const survey = getSurvey(getState())

  dispatch({type: taxonomiesUpdate, taxonomies: {[taxonomy.uuid]: null}})

  await axios.delete(`/api/survey/${survey.id}/taxonomies/${taxonomy.id}`)
}

export const setTaxonomyForEdit = taxonomy => async (dispatch) => {
  dispatchTaxonomyEditUpdate(dispatch, {uuid: taxonomy ? taxonomy.uuid : null})
}
