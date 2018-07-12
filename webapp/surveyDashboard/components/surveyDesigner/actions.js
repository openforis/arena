import axios from 'axios'

import {
  actionTypes,
  surveyDashboardApiUri
} from '../../surveyDashboard'

export const getSurveyDesigner = surveyId =>
  async dispatch => {
    try {
      const {data} = await axios.get(`${surveyDashboardApiUri(surveyId)}/surveyDesigner`)

      dispatch({type: actionTypes.surveyDesignerLoaded, ...data})
    } catch (e) {

    }
  }