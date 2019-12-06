import axios from 'axios'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'

import * as SurveyState from '@webapp/survey/surveyState'

import { showAppJobMonitor } from '@webapp/loggedin/appJob/actions'
import {
  taxonomyCreate,
  taxonomyDelete,
  taxonomyPropUpdate,
  taxonomyUpdate,
  taxonomiesUpdate,
} from '@webapp/survey/taxonomies/actions'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'
import { reloadListItems } from '../../tableViews/actions'
import * as TaxonomyEditState from './taxonomyEditState'

// Taxonomy editor actions
export const taxonomyEditUpdate = 'survey/taxonomyEdit/update'
export const taxonomyEditPropsUpdate = 'survey/taxonomyEdit/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = taxonomyUuid => dispatch => dispatch({ type: taxonomyEditUpdate, taxonomyUuid })

// ====== CREATE

export const createTaxonomy = history => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { taxonomy },
  } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  dispatch({ type: taxonomyCreate, taxonomy })
  history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomy)}/`)

  return taxonomy
}

// ====== READ

const fetchTaxonomy = taxonomyUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const {
    data: { taxonomy },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)

  dispatch({ type: taxonomyUpdate, taxonomy })
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

  dispatch(
    showAppJobMonitor(data.job, () => {
      // On import complete validate taxonomy and reload taxa
      dispatch(fetchTaxonomy(Taxonomy.getUuid(taxonomy)))
      dispatch(reloadListItems(TaxonomyEditState.keys.taxa, { draft: true }))
    }),
  )
}

// ====== DELETE
export const deleteTaxonomy = taxonomy => async (dispatch, getState) => {
  dispatch({ type: taxonomyDelete, taxonomy })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
  dispatch({ type: taxonomiesUpdate, taxonomies: data.taxonomies })
}
