import axios from 'axios'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'

import { SurveyState, TaxonomiesActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'

// Taxonomy editor actions
export const taxonomyViewTaxonomyUpdate = 'taxonomyView/taxonomy/update'
export const taxonomyViewTaxonomyPropsUpdate = 'taxonomyView/taxonomy/props/update'

// ====== SET TAXONOMY FOR EDIT

export const setTaxonomyForEdit = (taxonomyUuid) => (dispatch) =>
  dispatch({ type: taxonomyViewTaxonomyUpdate, taxonomyUuid })

// ====== CREATE

export const createTaxonomy = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { taxonomy },
  } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  await dispatch({ type: TaxonomiesActions.taxonomyCreate, taxonomy })

  await dispatch(setTaxonomyForEdit(Taxonomy.getUuid(taxonomy)))

  return taxonomy
}

// ====== READ

const fetchTaxonomy = (taxonomyUuid) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const {
    data: { taxonomy },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}?draft=true&validate=true`)

  dispatch({ type: TaxonomiesActions.taxonomyUpdate, taxonomy })
}

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

export const uploadTaxonomyFile = (taxonomy, file) => async (dispatch, getState) => {
  const formData = new FormData()
  formData.append('file', file)

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/upload`, formData)

  dispatch(
    JobActions.showJobMonitor({
      job: data.job,
      onComplete: () => {
        // On import complete validate taxonomy and reload taxa
        dispatch(fetchTaxonomy(Taxonomy.getUuid(taxonomy)))
      },
    })
  )
}

// ====== DELETE
export const deleteTaxonomy = (taxonomy, callback) => async (dispatch, getState) => {
  dispatch({ type: TaxonomiesActions.taxonomyDelete, taxonomy })

  const surveyId = SurveyState.getSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
  dispatch({ type: TaxonomiesActions.taxonomiesUpdate, taxonomies: data.taxonomies })
  if (callback) callback()
}
