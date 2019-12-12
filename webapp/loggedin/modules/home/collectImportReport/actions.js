import axios from 'axios'

import * as SurveyState from '@webapp/survey/surveyState'

export const homeCollectImportReportUpdate = 'home/collectImportReport/update'
export const homeCollectImportReportItemUpdate = 'home/collectImportReport/item/update'
export const homeCollectImportReportRowsScrollTopUpdate = 'home/collectImportReport/rowsScrollTop/update'

export const fetchCollectImportReportItems = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const {
    data: { items },
  } = await axios.get(`/api/survey/${surveyId}/collect-import/report`)

  dispatch({ type: homeCollectImportReportUpdate, items })
}

export const updateCollectImportReportItem = (itemId, resolved) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const {
    data: { item },
  } = await axios.post(`/api/survey/${surveyId}/collect-import/report/${itemId}/resolve`, { resolved })

  dispatch({ type: homeCollectImportReportItemUpdate, item })
}

export const updateCollectImportReportRowsScrollTop = scrollTop => dispatch =>
  dispatch({ type: homeCollectImportReportRowsScrollTopUpdate, scrollTop })
