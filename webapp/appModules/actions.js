import axios from 'axios/index'

import { appState } from '../app/app'

import {
  actionTypes,
  apiUri
} from './appModules'

export const fetchData = (module, dashboard) =>
  async (dispatch, getState) => {
    try {

      const surveyId = appState.surveyId(getState())

      const {data} = await axios.get(apiUri(surveyId, module, dashboard))

      const type = dashboard
        ? actionTypes.appModulesDashboardDataLoaded
        : actionTypes.appModulesDataLoaded

      dispatch({type, ...data})

    } catch (e) {

    }
  }