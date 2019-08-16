import axios from 'axios'

import DateUtils from '../../../../../../common/dateUtils'

import * as SurveyState from '../../../../../survey/surveyState'

const recordsAddedSummaryUpdate = 'home/dashboard/recordsAdded/summary/update'

export const fetchRecordsAddedSummary = () => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const now = Date.now()
  const format = date => DateUtils.format(date, 'YYYY-MM-DD')
  const from = format(DateUtils.subDays(now, 14))
  const to = format(now)

  const { data } = await axios.get(
    `/api/survey/${surveyId}/records/created/count`,
    { params: { from, to } }
  )

  dispatch({ type: recordsAddedSummaryUpdate, data })

}