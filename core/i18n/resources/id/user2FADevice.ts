export default {
  authenticatorCodeOne: 'Kode autentikator 1',
  authenticatorCodeTwo: 'Kode autentikator 2',
  authenticatorCodeTwoInfo: 'Tunggu 30 detik dan masukkan kode kedua',
  backupCodesRegenerated: {
    title: 'Kode cadangan berhasil dibuat ulang',
    message: `Simpan 8 kode cadangan berikut di tempat yang aman:
{{backupCodes}}

Gunakan kode tersebut untuk mengakses akun Anda jika Anda kehilangan akses ke perangkat autentikator.
**Setiap kode cadangan hanya dapat digunakan satu kali**.
Kode hanya dapat dilihat sekarang, jadi pastikan untuk **menyimpannya sekarang**.`,
  },
  create: {
    label: 'Buat',
  },
  creationSuccessful: {
    title: 'Perangkat 2FA berhasil dibuat',
    message: `Perangkat 2FA "{{deviceName}}" telah dibuat.
$t(user2FADevice:backupCodesRegenerated.message)`,
  },
  deletion: {
    confirm: 'Apakah Anda yakin ingin menghapus perangkat "{{deviceName}}"?',
    error: 'Kesalahan saat menghapus perangkat: {{message}}',
    successful: 'Perangkat berhasil dihapus',
  },
  deviceName: 'Nama perangkat',
  deviceNameFinal: 'Nama perangkat yang ditampilkan di aplikasi autentikator',
  enabled: 'Aktif',
  error: {
    fetchDevice: 'Kesalahan saat mengambil detail perangkat: {{message}}',
    createDevice: 'Kesalahan saat membuat perangkat: {{message}}',
    updateDevice: 'Kesalahan saat memperbarui perangkat: {{message}}',
    regenerateBackupCodes: 'Kesalahan saat membuat ulang kode cadangan: {{message}}',
  },
  regenerateBackupCodes: {
    label: 'Buat ulang kode cadangan',
    confirm: `Apakah Anda yakin ingin membuat ulang kode cadangan untuk perangkat "{{deviceName}}"?
Kode cadangan sebelumnya tidak akan berfungsi lagi.`,
  },
  showSecretKey: 'Tampilkan kunci rahasia',
  validation: {
    label: 'Validasi',
    successful: 'Perangkat berhasil divalidasi',
    error: 'Kode autentikator tidak valid',
  },
  validationSteps: {
    installAuthenticatorApp: {
      title: 'Pasang Aplikasi Autentikator',
      description: 'Pasang aplikasi autentikator di perangkat seluler Anda (mis. Google Authenticator, Authy, dll.).',
    },
    scanCode: {
      title: 'Pindai Kode QR',
      description: 'Gunakan aplikasi autentikator untuk memindai kode QR yang ditampilkan di bawah.',
      descriptionAlternative: 'Sebagai alternatif, Anda dapat memasukkan kunci rahasia di aplikasi autentikator.',
    },
    typeAuthenticatorCodes: {
      title: 'Masukkan Kode Autentikator',
      description:
        'Masukkan dua kode berturut-turut yang dibuat oleh aplikasi autentikator untuk memvalidasi perangkat.',
    },
  },
}
