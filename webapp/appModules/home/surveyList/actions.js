import axios from 'axios'

export const homeSurveyListUpdate = 'home/surveyList/update'

export const fetchSurveys = () => async dispatch => {
  try {
    const { data } = await axios.get('/api/surveys')

    dispatch({ type: homeSurveyListUpdate, surveys: data.surveys })
  } catch (e) {
  }
}