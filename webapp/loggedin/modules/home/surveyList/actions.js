import axios from 'axios'

export const homeSurveyListSurveysUpdate = 'home/surveyList/surveys/update'
export const homeSurveyListResetState = 'home/surveyList/reset/state'

export const fetchSurveys = () => async dispatch => {
  dispatch({ type: homeSurveyListResetState })
  const { data: { surveys } } = await axios.get('/api/surveys')
  dispatch({ type: homeSurveyListSurveysUpdate, surveys })
}