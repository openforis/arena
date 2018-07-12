import axios from 'axios'

import {
  actionTypes,
  surveyDashboardApiUri
} from '../../surveyDashboard'

export const getSurvey = surveyId =>
  async dispatch => {
    try {
      const {data} = await axios.get(`${surveyDashboardApiUri(surveyId)}/survey`)

      dispatch({type: actionTypes.surveyLoaded, ...data})
    } catch (e) {

    }
  }