import { useMemo } from 'react'
import { GridColDef } from '@mui/x-data-grid'

import * as DateUtils from '@core/dateUtils'
import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'
import { ButtonIconCancel } from '@webapp/components/buttons'
import formatDuration from '@webapp/views/App/JobMonitor/JobTiming/formatDuration'

import { JobMonitorSummary } from './useJobsMonitor'

type Props = {
  onCancelJob: (row: JobMonitorSummary) => void
}

export const useJobsMonitorColumns = ({ onCancelJob }: Props): GridColDef<JobMonitorSummary>[] => {
  const i18n = useI18n()

  return useMemo(
    () => [
      {
        field: 'type',
        headerName: i18n.t('jobMonitorView:columns.type'),
        flex: 1,
        valueGetter: (_value, row) => i18n.t(`jobs:${row.type}`),
      },
      {
        field: 'status',
        headerName: i18n.t('jobMonitorView:columns.status'),
        width: 130,
        valueGetter: (_value, row) => i18n.t(`jobMonitorView:status.${row.status}`),
      },
      {
        field: 'surveyName',
        headerName: i18n.t('jobMonitorView:columns.survey'),
        flex: 1,
        valueGetter: (_value, row) => row.surveyName || i18n.t('jobMonitorView:noSurvey'),
      },
      {
        field: 'user',
        headerName: i18n.t('jobMonitorView:columns.user'),
        flex: 1,
        valueGetter: (_value, row) => row.userName || row.userEmail || row.userUuid,
      },
      {
        field: 'progressPercent',
        headerName: i18n.t('jobMonitorView:columns.progress'),
        width: 110,
        valueGetter: (_value, row) => `${JobSerialized.getProgressPercent(row)}%`,
      },
      {
        field: 'elapsed',
        headerName: i18n.t('jobMonitorView:columns.elapsed'),
        width: 130,
        valueGetter: (_value, row) => formatDuration(JobSerialized.getElapsedMillis(row)) ?? '-',
      },
      {
        field: 'remaining',
        headerName: i18n.t('jobMonitorView:columns.remaining'),
        width: 130,
        valueGetter: (_value, row) => {
          const remainingMillis = JobSerialized.getRemainingMillis(row)
          return remainingMillis === null ? '-' : (formatDuration(remainingMillis) ?? '-')
        },
      },
      {
        field: 'dateCreated',
        headerName: i18n.t('jobMonitorView:columns.startedAt'),
        width: 180,
        valueGetter: (_value, row) => DateUtils.convertDateTimeFromISOToDisplay(row.dateCreated) as string,
      },
      {
        field: 'actions',
        headerName: '',
        width: 60,
        sortable: false,
        renderCell: ({ row }) => (row.pending || row.running) && <ButtonIconCancel onClick={() => onCancelJob(row)} />,
      },
    ],
    [i18n, onCancelJob]
  )
}
