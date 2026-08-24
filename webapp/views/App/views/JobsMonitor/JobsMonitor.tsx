import './JobsMonitor.scss'

import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { DataGrid } from '@webapp/components/DataGrid'
import LoadingBar from '@webapp/components/LoadingBar'
import { Button } from '@webapp/components/buttons'
import Checkbox from '@webapp/components/form/checkbox'

import { useJobsMonitor } from './useJobsMonitor'
import { useJobsMonitorColumns } from './useJobsMonitorColumns'

const JobsMonitor = (): React.ReactElement => {
  const i18n = useI18n()
  const { jobs, loading, refresh } = useJobsMonitor()
  const columns = useJobsMonitorColumns()
  const [activeOnly, setActiveOnly] = useState(true)

  if (loading) {
    return <LoadingBar />
  }

  const visibleJobs = activeOnly ? jobs.filter((job) => !job.ended) : jobs

  return (
    <div className="jobs-monitor">
      <div className="jobs-monitor__header">
        <h1>{i18n.t('jobMonitorView:title')}</h1>
        <div className="jobs-monitor__header-actions">
          <Checkbox checked={activeOnly} label="jobMonitorView:activeOnly" onChange={setActiveOnly} />
          <Button iconClassName="icon-loop2" label="common.refresh" onClick={refresh} />
        </div>
      </div>
      <DataGrid className="jobs-monitor__grid" columns={columns} rows={visibleJobs} getRowId={(row) => row.uuid} />
    </div>
  )
}

export default JobsMonitor
