export default {
  title: 'Job Monitor',
  activeOnly: 'Active jobs only',
  noSurvey: '—',
  columns: {
    type: 'Type',
    status: 'Status',
    survey: 'Survey',
    user: 'User',
    progress: 'Progress',
    startedAt: 'Started At',
  },
  status: {
    pending: 'Pending',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    canceled: 'Canceled',
  },
  confirmCancelJob: 'Are you sure you want to cancel this job?',
  jobCanceledByAdmin: 'This job was canceled by an administrator.',
}
