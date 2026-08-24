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
    elapsed: 'Elapsed',
    remaining: 'Est. Remaining',
    startedAt: 'Started At',
  },
  status: {
    pending: 'Pending',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    canceled: 'Canceled',
  },
}
