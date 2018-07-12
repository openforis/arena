import axios from 'axios/index'

import {
  actionTypes,
  surveyDashboardApiUri
} from '../surveyDashboard'

export const getDashboardComponentData = (surveyId, path) =>
  async dispatch => {
    try {
      const {data} = await axios.get(`${surveyDashboardApiUri(surveyId)}/${path}`)

      dispatch({type: actionTypes.surveyDashboardDataComponentLoaded, ...data})
    } catch (e) {

    }
  }