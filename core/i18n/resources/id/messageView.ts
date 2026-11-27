export default {
  body: {
    label: 'Isi',
    info: `Anda dapat menggunakan sintaks **Markdown** untuk memformat isi pesan (kunjungi https://www.markdownguide.org untuk informasi lebih lanjut).  
Beberapa variabel placeholder juga tersedia:
- \`{{userTitleAndName}}\`: diganti dengan sapaan dan nama pengguna (mis. "Bpk. John")
- \`{{userName}}\`: diganti dengan nama pengguna (mis. "John")`,
  },
  dateSent: 'Tanggal Dikirim',
  dateValidUntil: 'Berlaku Hingga Tanggal',
  deleteMessage: {
    confirmTitle: 'Apakah Anda yakin ingin menghapus pesan ini?',
  },
  messageDeleted: 'Pesan berhasil dihapus.',
  notificationType: {
    label: 'Jenis Notifikasi',
    email: 'Email',
    push_notification: 'Notifikasi Dalam Aplikasi',
  },
  preview: 'Pratinjau',
  sendMessage: {
    label: 'Kirim Pesan',
    confirmTitle: 'Apakah Anda yakin ingin mengirim pesan ini?',
  },
  status: {
    label: 'Status',
    draft: 'Draf',
    sent: 'Terkirim',
  },
  subject: 'Subjek',
  target: {
    emailsExcluded: {
      label: 'Email yang Dikecualikan',
      placeholder: 'Ketik alamat email yang akan dikecualikan, lalu tekan tombol Tambah',
    },
    emailsIncluded: {
      label: 'Email yang Disertakan',
      placeholder: 'Ketik alamat email yang akan disertakan, lalu tekan tombol Tambah',
    },
    userType: {
      label: 'Jenis Pengguna Target',
      all: 'Semua Pengguna',
      system_admins: 'Administrator Sistem',
      survey_admins: 'Administrator Survei',
      survey_managers: 'Manajer Survei',
      data_analysts: 'Analis Data',
      data_cleaners: 'Pembersih Data',
      data_editors: 'Penyunting Data',
      individual: 'Pengguna Individual',
    },
  },
}
