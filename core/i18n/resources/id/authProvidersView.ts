export default {
  title: 'Penyedia login',
  subtitle:
    'Opsi masuk eksternal yang ditampilkan di halaman masuk, dalam urutan ini. Pengguna juga dapat masuk dengan email dan kata sandi.',
  addProvider: 'Tambah penyedia',
  continue: 'Lanjutkan',
  encryptionKeyMissing:
    'Kunci enkripsi rahasia klien belum dikonfigurasi: tetapkan AUTH_PROVIDER_SECRET_ENCRYPTION_KEY (64 karakter heksadesimal) di server dan mulai ulang Arena untuk menambahkan penyedia.',
  empty: {
    title: 'Belum ada penyedia login',
    description:
      'Izinkan pengguna masuk dengan Google, Microsoft, atau sistem masuk tunggal (SSO) organisasi Anda, selain dengan email dan kata sandi.',
  },
  columns: {
    provider: 'Penyedia',
    type: 'Jenis',
    status: 'Status',
    loginPage: 'Halaman masuk',
    linkedUsers: 'Pengguna tertaut',
    actions: 'Tindakan',
  },
  passwordAlwaysAvailable:
    'Masuk dengan email dan kata sandi selalu tersedia. Perubahan mencapai setiap instans server dalam satu menit.',
  status: {
    enabled: 'Aktif',
    disabled: 'Nonaktif',
  },
  source: {
    env: 'konfigurasi server',
  },
  types: {
    google: 'Google',
    microsoft: 'Microsoft',
    oidc: 'OpenID Connect',
  },
  loginPage: {
    shown: 'Ditampilkan',
    directLinkOnly: 'Hanya tautan langsung',
  },
  moveUp: 'Pindah ke atas',
  moveDown: 'Pindah ke bawah',
  enable: 'Aktifkan',
  disable: 'Nonaktifkan',
  deleteConfirm:
    'Hapus penyedia login "{{provider}}"? Tautan dari {{linkedUsersCount}} penggunanya akan dihapus (untuk menghentikan proses masuk tetapi mempertahankan tautan, nonaktifkan penyedia ini).\n\nPengguna yang tidak memiliki metode masuk lain (mereka akan menerima email yang menjelaskan cara menetapkan kata sandi): {{usersWithoutOtherMethod}}',
  addDialog: {
    description: 'Pilih jenis penyedia. Anda dapat mengubah label dan ikon setelahnya.',
    typeDescription: {
      google: 'Akun Google, termasuk Gmail dan Google Workspace.',
      microsoft: 'Akun Microsoft kantor, sekolah, atau pribadi (Entra ID).',
      oidc: 'Penyedia lainnya: Keycloak, Okta, Auth0, SSO organisasi Anda...',
    },
    notSupportedYet: 'Facebook, GitHub, dan Apple belum didukung.',
  },
  form: {
    errors: 'Tidak dapat menyimpan penyedia: {{errors}}',
    newTitle: 'Penyedia {{type}} baru',
    general: 'Umum',
    label: 'Label tombol',
    id: 'Pengenal',
    idInfo:
      'Digunakan dalam URL dan untuk menautkan akun pengguna: huruf kecil, angka, dan tanda hubung. Tidak dapat diubah setelah dibuat.',
    icon: 'Ikon',
    useUploadedIcon: 'Gunakan ikon yang diunggah',
    iconInvalid: 'Ikon tidak valid: gunakan file PNG atau SVG berukuran hingga 100 KB.',
    enabled: 'Aktif',
    enabledInfo:
      'Jika nonaktif, tombol disembunyikan dan proses masuk dengan penyedia ini ditolak. Akun yang tertaut tetap disimpan.',
    showOnLoginPage: 'Tampilkan di halaman masuk',
    showOnLoginPageInfo:
      'Jika tidak aktif, penyedia tidak memiliki tombol di halaman masuk: pengguna masuk dengannya menggunakan tautan langsung {{path}}',
    connection: 'Koneksi',
    issuer: 'URL penerbit',
    issuerInfo: 'Arena membaca endpoint lainnya dari <issuer>/.well-known/openid-configuration.',
    tenant: 'Tenant',
    tenantInfo:
      'ID tenant organisasi Anda, atau "organizations" (akun kantor atau sekolah apa pun), "consumers" (akun pribadi), atau "common" (akun Microsoft apa pun).',
    clientId: 'ID klien',
    clientSecret: 'Rahasia klien',
    clientSecretInfo:
      'Disimpan terenkripsi dan tidak pernah ditampilkan lagi: biarkan kosong untuk mempertahankan yang sekarang.',
    clientSecretSet: '(sudah ditetapkan)',
    scopes: 'Cakupan (scopes)',
    scopesInfo: 'Dipisahkan dengan spasi; "openid" wajib.',
    access: 'Akses',
    accessDescription: 'Hanya pengguna yang sudah memiliki akun atau undangan Arena yang dapat masuk.',
    allowedEmailDomains: 'Domain email yang diizinkan',
    allowedEmailDomainsInfo: 'Pengguna hanya dapat masuk dengan email dari domain ini (mis. domain organisasi Anda).',
    emailDomainsMode: { all: 'Izinkan semua domain email', specific: 'Izinkan hanya domain tertentu' },
    emailDomainsPlaceholder: 'Ketik domain, mis. example.org',
    emailDomainsRequired: 'Tambahkan setidaknya satu domain email, atau izinkan semua domain email',
    requireArena2FA: 'Wajibkan autentikasi dua faktor Arena',
    requireArena2FAInfo:
      'Pengguna yang mengaktifkan 2FA Arena tetap harus memasukkan kodenya. Nonaktifkan hanya jika penyedia ini menerapkan autentikasi multifaktornya sendiri.',
    trustEmail: 'Percayai email dari penyedia ini',
    trustEmailInfo:
      'Tautkan akun berdasarkan email meskipun penyedia tidak mengonfirmasi bahwa email telah diverifikasi. Aktifkan hanya untuk penyedia yang memverifikasi email sendiri.',
    redirectUri: 'URI pengalihan',
    redirectUriCopied: 'URI pengalihan disalin',
    setupStepsTitle: 'Cara menyiapkan penyedia',
    setupGuide: {
      google: 'Panduan lengkap: Google',
      microsoft: 'Panduan lengkap: Microsoft',
      oidc: 'Panduan lengkap: Keycloak dan penyedia lainnya',
    },
    setupSteps: {
      google: [
        'Di Google Cloud console, buka Google Auth Platform (atau APIs & Services) > Clients dan buat klien OAuth dengan jenis "Web application".',
        'Tambahkan URI pengalihan di atas ke "Authorized redirect URIs" klien tersebut.',
        'Salin ID klien dan rahasia klien yang dibuat oleh Google ke kolom ID klien dan Rahasia klien di bagian Koneksi (di sebelah kiri), lalu klik Simpan.',
      ],
      microsoft: [
        'Di Microsoft Entra admin center, buka App registrations > New registration.',
        'Tambahkan URI pengalihan di atas sebagai URI pengalihan "Web" dari aplikasi tersebut.',
        'Di Certificates & secrets, buat rahasia klien baru.',
        'Salin Application (client) ID dan nilai rahasia ke kolom ID klien dan Rahasia klien di bagian Koneksi (di sebelah kiri), lalu klik Simpan.',
      ],
      oidc: [
        'Di penyedia (mis. Keycloak, Okta), daftarkan Arena sebagai aplikasi web rahasia (OpenID Connect, alur authorization code).',
        'Tambahkan URI pengalihan di atas ke URI pengalihan yang diizinkan untuk aplikasi tersebut, dan izinkan cakupan openid, email, dan profile.',
        'Salin URL penerbit, ID klien, dan rahasia klien aplikasi ke kolom URL penerbit, ID klien, dan Rahasia klien di bagian Koneksi (di sebelah kiri), lalu klik Simpan.',
      ],
    },
    loginPagePreview: 'Pratinjau halaman masuk',
    readOnlyEnv:
      'Penyedia ini didefinisikan dalam konfigurasi server (AUTH_PROVIDERS_CONFIG): ubah di sana dan mulai ulang Arena.',
    testConnection: 'Uji koneksi',
    testSignIn: 'Uji masuk',
    testConnectionOk: 'Koneksi berhasil: {{keysCount}} kunci penandatanganan dimuat dalam {{durationMs}} ms.',
    testConnectionFailed: 'Koneksi gagal: {{error}}',
  },
  testResult: {
    title: 'Hasil uji masuk',
    success: 'Masuk berhasil: token ID telah divalidasi. Tidak ada yang masuk dan tidak ada yang diubah.',
    issuer: 'Penerbit',
    subject: 'Subjek (sub)',
    email: 'Email',
    verified: '(terverifikasi)',
    notVerified: '(belum terverifikasi)',
    name: 'Nama',
    matchingUser: 'Pengguna Arena yang cocok',
    outcome: 'Saat masuk',
    alreadyLinked: 'Sudah tertaut: pengguna akan langsung masuk.',
    wouldLink: 'Akun akan ditautkan ke pengguna berdasarkan email.',
  },
}
