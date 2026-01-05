import axios from 'axios'

export const fetchNotifiedMessages = async () => {
  const {
    data: { list },
  } = await axios.get(`/api/messages/notified-to-user`)
  return list
}
