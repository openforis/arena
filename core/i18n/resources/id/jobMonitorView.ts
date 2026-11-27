export default {
  title: 'Pemantau Tugas',
  activeOnly: 'Hanya tugas aktif',
  noSurvey: '—',
  columns: {
    type: 'Jenis',
    status: 'Status',
    survey: 'Survei',
    user: 'Pengguna',
    progress: 'Kemajuan',
    startedAt: 'Dimulai Pada',
  },
  status: {
    pending: 'Menunggu',
    running: 'Berjalan',
    succeeded: 'Berhasil',
    failed: 'Gagal',
    canceled: 'Dibatalkan',
  },
  confirmCancelJob: 'Apakah Anda yakin ingin membatalkan tugas ini?',
  jobCanceledByAdmin: 'Tugas ini dibatalkan oleh administrator.',
}
