export default {
  title: 'Auftragsüberwachung',
  activeOnly: 'Nur aktive Aufträge',
  noSurvey: '—',
  columns: {
    type: 'Typ',
    status: 'Status',
    survey: 'Erhebung',
    user: 'Benutzer',
    progress: 'Fortschritt',
    startedAt: 'Gestartet am',
  },
  status: {
    pending: 'Ausstehend',
    running: 'Wird ausgeführt',
    succeeded: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
    canceled: 'Abgebrochen',
  },
  confirmCancelJob: 'Möchten Sie diesen Auftrag wirklich abbrechen?',
  jobCanceledByAdmin: 'Dieser Auftrag wurde von einem Administrator abgebrochen.',
}
