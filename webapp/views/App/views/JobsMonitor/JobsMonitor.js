import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { DataGrid } from '@webapp/components/DataGrid'
import LoadingBar from '@webapp/components/LoadingBar'
import { Button } from '@webapp/components/buttons'

import { useJobsMonitor } from './useJobsMonitor'
import { useJobsMonitorColumns } from './useJobsMonitorColumns'

const JobsMonitor = () => {
  const i18n = useI18n()
  const { jobs, loading, refresh } = useJobsMonitor()
  const columns = useJobsMonitorColumns()

  if (loading) {
    return <LoadingBar />
  }

  return (
    <div className="jobs-monitor">
      <div className="jobs-monitor__header">
        <h1>{i18n.t('jobMonitorView:title')}</h1>
        <Button iconClassName="icon-loop2" label="common.refresh" onClick={refresh} />
      </div>
      <DataGrid className="jobs-monitor__grid" columns={columns} rows={jobs} getRowId={(row) => row.uuid} />
    </div>
  )
}

JobsMonitor.propTypes = {}

export default JobsMonitor
