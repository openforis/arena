export default {
  title: 'Monitor de trabalhos',
  activeOnly: 'Somente trabalhos ativos',
  noSurvey: '—',
  columns: {
    type: 'Tipo',
    status: 'Status',
    survey: 'Inventário',
    user: 'Usuário',
    progress: 'Progresso',
    elapsed: 'Decorrido',
    remaining: 'Restante estimado',
    startedAt: 'Iniciado em',
  },
  status: {
    pending: 'Pendente',
    running: 'Em execução',
    succeeded: 'Concluído',
    failed: 'Falhou',
    canceled: 'Cancelado',
  },
}
