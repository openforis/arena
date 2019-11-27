import axios from 'axios'

import * as SurveyState from '@webapp/survey/surveyState'

export const homeCollectImportReportUpdate = 'home/collectImportReport/update'
export const homeCollectImportReportItemUpdate =
  'home/collectImportReport/item/update'

export const fetchCollectImportReportItems = () => async (
  dispatch,
  getState,
) => {
  try {
    const surveyId = SurveyState.getSurveyId(getState())

    const {data} = await axios.get(
      `/api/survey/${surveyId}/collect-import/report`,
    )

    dispatch({type: homeCollectImportReportUpdate, items: data.items})
  } catch (error) {}
}

export const updateCollectImportReportItem = (itemId, resolved) => async (
  dispatch,
  getState,
) => {
  try {
    const surveyId = SurveyState.getSurveyId(getState())

    const {
      data,
    } = await axios.post(
      `/api/survey/${surveyId}/collect-import/report/${itemId}/resolve`,
      {resolved},
    )

    dispatch({type: homeCollectImportReportItemUpdate, item: data.item})
  } catch (error) {}
}
