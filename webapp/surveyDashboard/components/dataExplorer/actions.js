import axios from 'axios'

import {
  actionTypes,
  surveyDashboardApiUri
} from '../../surveyDashboard'

export const getDataExplorer = surveyId =>
  async dispatch => {
    try {
      const {data} = await axios.get(`${surveyDashboardApiUri(surveyId)}/dataExplorer`)

      dispatch({type: actionTypes.surveyDesignerLoaded, ...data})
    } catch (e) {

    }
  }