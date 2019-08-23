import axios from 'axios'

import DateUtils from '../../../../../../common/dateUtils'

import * as SurveyState from '../../../../../survey/surveyState'
import * as RecordsSummaryState from './recordsSummaryState'

export const recordsSummaryUpdate = 'home/recordsSummary/update'

export const fetchRecordsSummary = timeRange => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())

  const now = Date.now()
  const format = date => DateUtils.format(date, 'yyyy-MM-dd')
  const from = format(DateUtils.subDays(now, 14))
  const to = format(now)

  const { data: counts } = await axios.get(
    `/api/survey/${surveyId}/records/summary/count`,
    { params: { from, to } }
  )

  dispatch({ type: recordsSummaryUpdate, timeRange, from, to, counts })
}