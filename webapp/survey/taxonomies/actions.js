import axios from 'axios'

import { getStateSurveyId } from '../surveyState'

export const taxonomiesLoad = 'survey/taxonomies/load'

// taxonomy actions
export const taxonomyCreate = 'survey/taxonomy/create'
export const taxonomyUpdate = 'survey/taxonomy/update'
export const taxonomyPropUpdate = 'survey/taxonomy/prop/update'
export const taxonomyDelete = 'survey/taxonomy/delete'

export const fetchTaxonomies = (draft = false, validate = false) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies?draft=${draft}&validate=${validate}`)

  dispatch({type: taxonomiesLoad, taxonomies: data.taxonomies})
}
