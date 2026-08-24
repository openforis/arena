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
    elapsed: 'Transcurrido',
    remaining: 'Restante estimado',
    startedAt: 'Iniciado el',
  },
  status: {
    pending: 'Pendiente',
    running: 'En curso',
    succeeded: 'Completado',
    failed: 'Fallido',
    canceled: 'Cancelado',
  },
}
