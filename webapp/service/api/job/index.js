import axios from 'axios'

export const fetchActiveJob = async () => {
  const { data } = await axios.get('/api/jobs/active')
  return data
}

export const fetchAllJobs = async () => {
  const { data } = await axios.get('/api/jobs')
  return data
}
