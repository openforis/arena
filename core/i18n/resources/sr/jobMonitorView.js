export default {
  title: 'Nadzor zadataka',
  activeOnly: 'Samo aktivni zadaci',
  noSurvey: '—',
  columns: {
    type: 'Vrsta',
    status: 'Status',
    survey: 'Istraživanje',
    user: 'Korisnik',
    progress: 'Napredak',
    startedAt: 'Pokrenuto',
  },
  status: {
    pending: 'Na čekanju',
    running: 'U toku',
    succeeded: 'Uspješno',
    failed: 'Neuspješno',
    canceled: 'Otkazano',
  },
  confirmCancelJob: 'Da li ste sigurni da želite da otkažete ovaj zadatak?',
  jobCanceledByAdmin: 'Ovaj zadatak je otkazao administrator.',
}
