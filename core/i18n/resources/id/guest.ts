export default {
  loginView: {
    title: 'Masuk',
    subtitle: 'Selamat datang! Masukkan kredensial Anda untuk melanjutkan ke $t(common.appNameFull).',
    backToLogin: 'Kembali ke halaman masuk',
    newToArena: 'Baru di $t(common.appNameFull)?',
    registerBeforeLoggingIn: 'Ajukan permintaan akses terlebih dahulu: hanya pengguna terdaftar yang dapat masuk.',
    or: 'atau',
    twoFactorTitle: 'Verifikasi dua langkah',
    verify: 'Verifikasi',
    lostYourDevice: 'Tidak dapat menggunakan aplikasi autentikator Anda?',
    yourName: 'Nama Anda',
    yourEmail: 'Email Anda',
    yourPassword: 'Kata sandi Anda',
    yourNewPassword: 'Kata sandi baru Anda',
    repeatYourPassword: 'Ulangi kata sandi Anda',
    repeatYourNewPassword: 'Ulangi kata sandi baru Anda',
    requestAccess: 'Minta akses',
    resetPassword: 'Atur ulang kata sandi',
    login: 'Masuk',
    loginUsingBackupCode: 'Gunakan kode cadangan',
    forgotPassword: 'Lupa kata sandi?',
    sendPasswordResetEmail: 'Kirim email pengaturan ulang kata sandi',
    twoFactorBackupCode: 'Kode cadangan 2FA',
    twoFactorToken: 'Kode verifikasi',
    twoFactorTokenDescription: `Untuk menjaga keamanan akun Anda, kami memverifikasi identitas Anda.

Masukkan kode yang dibuat oleh aplikasi autentikator Anda.`,
  },
  externalLogin: {
    signInWith: 'Masuk dengan {{provider}}',
    continueWith: 'Lanjutkan dengan {{provider}}',
    registeredUsersOnly: 'Hanya pengguna terdaftar',
    errors: {
      providerNotAvailable:
        'Opsi masuk ini tidak tersedia. Silakan coba lagi nanti atau masuk dengan email dan kata sandi Anda.',
      flowInvalid: 'Proses masuk telah kedaluwarsa atau dimulai di peramban lain. Silakan coba lagi.',
      providerError: 'Masuk dengan penyedia eksternal gagal. Silakan coba lagi.',
      emailNotVerified:
        'Penyedia tidak mengonfirmasi alamat email Anda, sehingga tidak dapat dicocokkan dengan akun. Masuk dengan kata sandi Anda dan tautkan penyedia dari profil Anda.',
      emailDomainNotAllowed: 'Akun dengan domain email ini tidak dapat menggunakan opsi masuk ini.',
      userNotFound:
        'Tidak ada akun dengan alamat email ini. Minta undangan kepada administrator survei atau ajukan permintaan akses.',
      ambiguousEmail:
        'Lebih dari satu akun cocok dengan alamat email ini. Masuk dengan kata sandi Anda dan tautkan penyedia dari profil Anda.',
      identityAlreadyLinked: 'Akun penyedia ini sudah ditautkan ke pengguna lain.',
      providerAlreadyLinked:
        'Akun lain dari penyedia ini sudah ditautkan ke pengguna Anda: lepaskan tautannya terlebih dahulu dari profil Anda.',
      invitationInvalid:
        'Undangan tidak valid atau telah kedaluwarsa. Minta undangan baru kepada administrator survei.',
      invalidTwoFactorCode: 'Kode verifikasi tidak valid.',
    },
  },
  accessRequestView: {
    whatHappensNext: 'Apa langkah selanjutnya?',
    alreadyHaveAnAccount: 'Sudah memiliki akun?',
    steps: {
      sendRequest: {
        title: 'Kirim permintaan',
        description: 'Usulkan nama untuk survei pertama Anda: mulai dari survei kosong atau dari templat.',
      },
      review: {
        title: 'Kami meninjaunya',
        description: 'Mohon beri kami waktu beberapa hari untuk memproses permintaan Anda.',
      },
      invitation: {
        title: 'Dapatkan undangan Anda',
        description:
          'Anda akan menerima email dari **{{senderEmail}}** berisi tautan untuk mengakses $t(common.appName). Tidak ada di kotak masuk? Periksa folder Spam/Junk, lalu tambahkan pengirim ke kontak Anda atau tandai email tersebut sebagai bukan spam.',
        descriptionWithoutSender:
          'Anda akan menerima email berisi tautan untuk mengakses $t(common.appName). Tidak ada di kotak masuk? Periksa folder Spam/Junk, lalu tambahkan pengirim ke kontak Anda atau tandai email tersebut sebagai bukan spam.',
      },
      startWorking: {
        title: 'Mulai bekerja',
        description:
          'Anda akan menjadi Administrator Survei dari survei baru tersebut dan dapat membuat hingga 5 survei.',
      },
    },
    error: 'Kesalahan saat meminta akses: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'Nama Depan',
        lastName: 'Nama Belakang',
        institution: 'Institusi',
        country: 'Negara',
        purpose: 'Untuk apa Anda membutuhkannya?',
        surveyName: 'Usulkan Nama Survei',
        templateUuid: 'Mulai dari templat?',
      },
    },
    introduction:
      'Sumber daya $t(common.appName) terbatas, sehingga akses diberikan berdasarkan permintaan. Ceritakan kepada kami apa yang ingin Anda lakukan dengannya!',
    reCaptchaNotAnswered: 'ReCaptcha belum dijawab',
    requestSent: 'Permintaan Akses berhasil dikirim',
    requestSentMessage: `$t(common.emailSentToSelfConfirmation)
$t(guest:accessRequestView.whitelistSenderSuggestion)

Mohon beri kami waktu beberapa hari untuk memproses permintaan Anda.
Setelah diterima, kami akan mengirimkan email lain ke **{{email}}** berisi petunjuk cara mengakses $t(common.appName).
Terima kasih dan selamat menggunakan **$t(common.appNameFull)**!`,
    sendRequest: 'Kirim Permintaan',
    sendRequestConfirm: 'Minta akses ke $t(common.appNameFull)?',
    templateNotSelected: 'Tidak dipilih (mulai dari awal)',
    title: 'Minta akses',
    whitelistSenderSuggestion: `Jika Anda menemukannya di folder Spam/Junk, tambahkan **{{senderEmail}}** ke kontak Anda (buku alamat) atau tandai sebagai aman/bukan spam, agar email kami berikutnya langsung masuk ke kotak masuk Anda.`,
  },
  resetPasswordView: {
    description: {
      completeRegistration: 'Siapkan akun Anda untuk memulai.',
      setYourNewPassword: 'Pilih kata sandi baru untuk akun Anda.',
    },
    title: {
      completeRegistration: 'Selesaikan pendaftaran Anda di Arena',
      setYourNewPassword: 'Tetapkan kata sandi baru Anda',
    },
    setNewPassword: 'Tetapkan kata sandi baru',
    forgotPasswordLinkInvalid: 'Halaman yang Anda coba akses tidak ada atau sudah tidak berlaku',
    passwordSuccessfullyReset: 'Kata sandi Anda berhasil diatur ulang',
    passwordStrengthChecksTitle: 'Pemeriksaan kekuatan kata sandi',
    passwordStrengthChecks: {
      noWhiteSpaces: 'Tanpa spasi',
      atLeast8CharactersLong: 'Minimal 8 karakter',
      containsLowerCaseLetters: 'Mengandung huruf kecil',
      containsUpperCaseLetters: 'Mengandung huruf besar',
      containsNumbers: 'Mengandung angka',
    },
    completeRegistration: 'Selesaikan pendaftaran',
  },
  forgotPasswordView: {
    title: 'Atur ulang kata sandi Anda',
    description: 'Masukkan alamat email akun Anda dan kami akan mengirimkan tautan untuk memilih kata sandi baru.',
  },
  pitch: {
    default: {
      title: 'Data lapangan, dari pengumpulan hingga analisis.',
      description:
        'Rancang formulir multibahasa, kelola inventarisasi multisiklus, validasi kualitas data, dan analisis hasilnya dengan RStudio terintegrasi.',
    },
    accessRequest: {
      title: 'Mulai survei pertama Anda di $t(common.appName).',
    },
    tags: {
      forestInventories: 'Inventarisasi hutan',
      questionnaires: 'Kuesioner',
      multiCycle: 'Multisiklus',
      statisticalAnalysis: 'Analisis statistik',
    },
  },
  footer: {
    website: 'Tentang $t(common.appName)',
    userManual: 'Panduan pengguna',
    supportForum: 'Forum dukungan',
    version: 'Versi {{version}}',
  },
}
