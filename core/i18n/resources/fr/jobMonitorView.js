export default {
  title: 'Moniteur des tâches',
  activeOnly: 'Tâches actives uniquement',
  noSurvey: '—',
  columns: {
    type: 'Type',
    status: 'Statut',
    survey: 'Formulaire',
    user: 'Utilisateur',
    progress: 'Progression',
    elapsed: 'Écoulé',
    remaining: 'Restant estimé',
    startedAt: 'Démarré le',
  },
  status: {
    pending: 'En attente',
    running: 'En cours',
    succeeded: 'Réussi',
    failed: 'Échoué',
    canceled: 'Annulé',
  },
  confirmCancelJob: 'Voulez-vous vraiment annuler cette tâche ?',
  jobCanceledByAdmin: 'Cette tâche a été annulée par un administrateur.',
}
