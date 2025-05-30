import axios from 'axios'

export const fetchVersion = async () => {
  const {
    data: { version },
  } = await axios.get(`/api/version`)
  return version
}
