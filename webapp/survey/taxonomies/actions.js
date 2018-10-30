import axios from 'axios'

import { getStateSurveyId } from '../surveyState'

export const taxonomiesUpdate = 'survey/taxonomies/update'

export const dispatchTaxonomiesUpdate = (dispatch, taxonomies) => dispatch({type: taxonomiesUpdate, taxonomies})

export const fetchTaxonomies = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/taxonomies?draft=${draft}`)

    dispatchTaxonomiesUpdate(dispatch, data.taxonomies)
  } catch (e) { }
}
