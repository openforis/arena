import axios from 'axios'

export const fetchUserAndSurvey = async () => {
  const {
    data: { user, survey },
  } = await axios.get('/auth/user')
  return { user, survey }
}
