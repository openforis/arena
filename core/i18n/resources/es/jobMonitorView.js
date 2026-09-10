export default {
  title: 'Monitor de trabajos',
  activeOnly: 'Solo trabajos activos',
  noSurvey: '—',
  columns: {
    type: 'Tipo',
    status: 'Estado',
    survey: 'Encuesta',
    user: 'Usuario',
    progress: 'Progreso',
    startedAt: 'Iniciado el',
  },
  status: {
    pending: 'Pendiente',
    running: 'En curso',
    succeeded: 'Completado',
    failed: 'Fallido',
    canceled: 'Cancelado',
  },
  confirmCancelJob: '¿Está seguro de que desea cancelar este trabajo?',
  jobCanceledByAdmin: 'Este trabajo fue cancelado por un administrador.',
}
