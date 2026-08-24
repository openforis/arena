import { useCallback, useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import useInterval from '@webapp/components/hooks/useInterval'

export type JobMonitorSummary = {
  uuid: string
  type: string
  status: string
  pending: boolean
  running: boolean
  succeeded: boolean
  canceled: boolean
  failed: boolean
  ended: boolean
  total: number
  processed: number
  progressPercent: number
  elapsedMillis: number
  userUuid: string
  userName: string | null
  userEmail: string | null
  surveyId: number | null
  surveyName: string | null
  dateCreated: string
}

type UseJobsMonitorResult = {
  jobs: JobMonitorSummary[]
  loading: boolean
  refresh: () => Promise<void>
}

const refreshIntervalMillis = 10000

export const useJobsMonitor = (): UseJobsMonitorResult => {
  const [jobs, setJobs] = useState<JobMonitorSummary[]>([])
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
