import { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'
import * as JobSerialized from '@common/job/jobSerialized'

import { useI18n } from '@webapp/store/system'
import formatDuration from '@webapp/views/App/JobMonitor/JobTiming/formatDuration'

export const useJobsMonitorColumns = () => {
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
        valueGetter: (_value, row) => DateUtils.convertDateTimeFromISOToDisplay(row.dateCreated),
      },
    ],
    [i18n]
  )
}
