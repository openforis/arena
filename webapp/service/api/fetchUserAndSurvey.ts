import axios from 'axios'

export const fetchLoggedInUserAndSurvey = async () => {
  const {
    data: { user, survey, error },
  } = await axios.get('/auth/user')
  return { user, survey, error }
}
