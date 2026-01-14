import axios from 'axios'

export const fetchLoggedInUserAndSurvey = async () => {
  const {
    data: { user, survey },
  } = await axios.get('/auth/user')
  return { user, survey }
}
