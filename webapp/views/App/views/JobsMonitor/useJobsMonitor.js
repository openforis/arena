import { useCallback, useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import useInterval from '@webapp/components/hooks/useInterval'

const refreshIntervalMillis = 10000

export const useJobsMonitor = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchJobs = useCallback(async () => {
    const data = await API.fetchAllJobs()
    setJobs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const loadJobs = async () => {
      await fetchJobs()
    }
    loadJobs()
  }, [fetchJobs])

  useInterval(fetchJobs, refreshIntervalMillis)

  return { jobs, loading, refresh: fetchJobs }
}
