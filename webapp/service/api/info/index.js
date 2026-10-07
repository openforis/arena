import axios from 'axios'

export const fetchInfo = async () => {
  const { data } = await axios.get('/api/info')
  return data
}
