import axios from 'axios'

import { surveyCreate, surveyUpdate } from './actionTypes'

export const setActiveSurvey =
  (surveyId, canEdit = true, dispatchSurveyCreate = false) =>
  async (dispatch) => {
    // Load survey
    const params = { draft: canEdit, validate: canEdit }
    const {
      data: { survey },
    } = await axios.get(`/api/survey/${surveyId}`, { params })
    dispatch({ type: dispatchSurveyCreate ? surveyCreate : surveyUpdate, survey })
  }
