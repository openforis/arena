export default {
  authProvider: {
    notFound: 'Penyedia login tidak ditemukan',
    readOnly: 'Penyedia ini ditetapkan dalam konfigurasi server dan tidak dapat diubah di sini',
    idAlreadyUsed: 'Pengenal "{{id}}" sudah digunakan oleh penyedia lain',
    encryptionKeyMissing:
      'Kunci enkripsi untuk rahasia klien (AUTH_PROVIDER_SECRET_ENCRYPTION_KEY) belum dikonfigurasi',
    validation: 'Beberapa isian tidak valid',
    iconInvalid: 'Ikon tidak valid: gunakan file PNG atau SVG berukuran maksimal 100 KB',
    identityNotFound: 'Akun tertaut tidak ditemukan',
    lastSignInMethod:
      'Ini adalah metode masuk terakhir: tetapkan kata sandi atau tautkan penyedia lain terlebih dahulu',
    idInvalid: 'Pengenal tidak valid: gunakan huruf kecil, angka, dan tanda hubung (maksimal 64 karakter)',
    typeInvalid: 'Jenis penyedia tidak valid',
    labelInvalid: 'Label tombol wajib diisi (maksimal 64 karakter)',
    issuerInvalid: 'URL penerbit tidak valid (https wajib digunakan)',
    tenantInvalid: 'Tenant tidak valid',
    clientIdRequired: 'ID klien wajib diisi',
    scopesMissingOpenid: 'Cakupan (scope) harus menyertakan "openid"',
    emailDomainInvalid: 'Domain email tidak valid',
    clientSecretRequired: 'Rahasia klien wajib diisi',
  },
  mapCustomLayers: {
    urlInvalid: 'URL layanan tidak valid',
    urlNotAllowed: 'Hanya alamat http dan https publik yang dapat digunakan',
    hostNotFound: 'Host tidak ditemukan: {{host}}',
    redirectNotFollowed: 'Layanan mengalihkan ke {{location}}: gunakan URL tersebut',
    responseTooLarge: 'Respons layanan lebih besar dari {{limitMb}} MB',
    timeout: 'Layanan tidak merespons dalam {{seconds}} detik',
    fetchFailed: 'Layanan merespons dengan status HTTP {{status}}',
    unreachable: 'Layanan tidak dapat dijangkau',
    notCapabilities: 'Tidak ditemukan capabilities WMS atau WMTS pada URL ini',
    noLayers: 'Layanan tidak memiliki lapisan yang dapat ditampilkan',
    invalidLayers: 'Lapisan peta tidak valid',
    tooManyLayers: 'Paling banyak {{max}} lapisan peta kustom dapat ditambahkan',
    busy: 'Server sedang sibuk memuat layanan lain: coba lagi sebentar lagi',
  },
  aggregateFunctionInvalid: `Fungsi agregat kustom "{{name}}" tidak valid: sunting untuk memperbaikinya`,
  cannotGetChild: `Tidak dapat mengambil anak '{{childName}}' dari atribut {{name}}`,
  cannotImportFilesExceedingQuota: 'Tidak dapat mengimpor file catatan: kuota penyimpanan file akan terlampaui',
  cannotInsertFileExceedingQuota: 'Tidak dapat menyisipkan file: kuota penyimpanan file akan terlampaui',
  cannotOverridePublishedTaxa: 'Tidak dapat menimpa takson yang sudah diterbitkan',
  cantUpdateStep: `Tidak dapat memperbarui tahap`,
  categoryItemLabelsInvalid: 'Permintaan label kategori tidak valid ({{reason}}).',
  categoryItemLabelsTooLarge:
    'Kategori ini terlalu besar untuk memeriksa label yang hilang; coba lagi nanti atau gunakan kategori yang lebih kecil.',
  chainCannotBeSaved: 'Rantai analisis tidak valid dan tidak dapat disimpan',
  csv: {
    emptyHeaderFound: 'Ditemukan header kosong pada kolom {{columnPosition}}',
    emptyHeaders: 'Ditemukan header kosong',
  },
  dataExport: {
    excelMaxCellsLimitExceeded:
      'Kesalahan saat mengekspor data (terlalu banyak item). Coba ekspor data dalam format CSV.',
    noRecordsMatchingSearchCriteria: 'Tidak ada catatan yang sesuai dengan kriteria pencarian',
  },
  dataImport: {
    importFromMobileNotAllawed: 'Impor data dari Arena Mobile tidak diizinkan',
    invalidNodeInRecord:
      'Node tidak valid dalam catatan "{{recordUuid}}", node "{{nodeUuid}}" dengan definisi node "{{nodeDefName}}" (uuid "{{nodeDefUuid}}"): {{details}}',
    noRecordsFound: 'Tidak ada catatan dalam file impor atau format file salah',
    pendingImportFileNotFoundOrExpired:
      'File yang diunggah sebelumnya tidak dapat ditemukan lagi; mungkin sudah kedaluwarsa. Silakan unggah kembali.',
    recordMergeWithSameKeysNotAllowed:
      'Tidak dapat mengimpor catatan "{{recordKeyValues}}": catatan lain dengan kunci yang sama sudah ada dan penggabungan catatan dengan kunci yang sama tidak diizinkan dalam survei ini',
    recordOfAnotherUserGroup:
      'Tidak dapat memperbarui catatan "{{recordKeyValues}}" karena catatan ini milik grup pengguna lain',
    recordOwnedByAnotherUser:
      'Tidak dapat memperbarui catatan "{{recordKeyValues}}" karena pemiliknya adalah pengguna lain',
  },
  entryDataNotFound: 'Data entri tidak ditemukan: {{entryName}}',
  expression: {
    identifierNotFound: '$t(expression.identifierNotFound)',
    undefinedFunction: '$t(expression.undefinedFunction)',
  },
  forbidden: 'Anda tidak diizinkan melakukan ini.',
  functionHasTooFewArguments: 'Fungsi {{fnName}} memerlukan setidaknya {{minArity}} (diberikan {{numArgs}})',
  functionHasTooManyArguments: 'Fungsi {{fnName}} hanya menerima paling banyak {{maxArity}} (diberikan {{numArgs}})',
  generic: 'Kesalahan tak terduga: {{text}}',
  unexpectedServerError: 'Terjadi kesalahan tak terduga di server.',
  geoWhispApiError: 'Layanan Whisp untuk sementara tidak tersedia.',
  geoWhispSamplingPointDataCategoryMissing: 'Kategori data titik sampel tidak ditemukan.',
  geoWhispSamplingPointDataLocationsMissing: 'Tidak ditemukan item data titik sampel dengan lokasi yang valid.',
  importingDataIntoWrongCollectSurvey: 'Mengimpor data ke survei yang salah. URI yang diharapkan: {{collectSurveyUri}}',
  invalidParams: 'Parameter permintaan tidak valid.',
  invalidType: 'Jenis tidak valid {{type}}',
  jobCanceledOrErrorsFound: 'Tugas dibatalkan atau ditemukan kesalahan; transaksi dibatalkan (rollback)',
  jobOrphanedOnRestart: 'Tugas terhenti karena server dimulai ulang. Silakan coba lagi.',
  mobileAppVersionNotSupported:
    'Versi Arena Mobile ini tidak didukung oleh server: perbarui ke versi {{minVersion}} atau yang lebih baru',
  paramIsRequired: 'Parameter {{param}} wajib diisi',
  paramMustBeInteger: 'Parameter {{param}} harus berupa bilangan bulat',
  propUpdateNotAllowed: 'Properti "{{key}}" tidak dapat diperbarui',
  unableToFindParent: 'Tidak dapat menemukan induk dari {{name}}',
  unableToFindNode: 'Tidak dapat menemukan node dengan nama {{name}}',
  unableToFindSibling: 'Tidak dapat menemukan saudara dengan nama {{name}}',
  undefinedFunction: `Fungsi '{{fnName}}' tidak terdefinisi atau jenis parameter salah`,
  invalidSyntax: 'Sintaks ekspresi tidak valid',
  networkError: 'Kesalahan saat berkomunikasi dengan server',
  nodeDefConversionNotAllowed: `'{{name}}' tidak dapat dikonversi ke {{toType}}`,
  nodeDefTypeInvalid: 'Jenis definisi node tidak valid: {{type}}',
  record: {
    errorUpdating: 'Kesalahan saat memperbarui catatan',
    entityNotFound: 'Entitas "{{entityName}}" dengan kunci "{{keyValues}}" tidak ditemukan',
    updateSelfAndDependentsDefaultValues:
      '$t(appErrors:record.errorUpdating); kesalahan saat mengevaluasi ekspresi pada node {{nodeDefName}}: {{details}}',
    lockTimeout: 'Catatan sedang sibuk; coba lagi dalam beberapa detik.',
    nodeNotInRecord: 'Node bukan bagian dari catatan {{recordUuid}}.',
    nodesBatchInvalid: 'Permintaan penyuntingan massal tidak valid ({{reason}}).',
    nodesBatchBusy: 'Penyuntingan massal lain masih berjalan; coba lagi dalam beberapa detik.',
    nodesBatchInvalidValue: 'Nilai baru "{{attributeName}}" tidak valid untuk atribut ini.',
    nodesBatchWouldClearValues:
      'Penyuntingan ini akan mengosongkan nilai lain yang menjadi tidak berlaku; sunting nilai ini di formulir untuk mengonfirmasi.',
    nodesBatchUnexpected: 'Penyuntingan tidak dapat diterapkan karena terjadi kesalahan tak terduga di server.',
    nodesBatchRolledBack: 'Penyuntingan tidak diterapkan karena penyuntingan lain pada catatan yang sama gagal.',
  },
  recordPrintableExport: {
    missingEntityParams: 'Ekspor halaman saat ini memerlukan entityDefUuid dan entityNodeUuid',
    entityNotFound: 'Entitas tidak ditemukan untuk ekspor yang ditentukan',
    missingServerUrl: 'URL server publik diperlukan saat mengekspor dengan kode QR',
    qrTokenMismatch: 'Tidak dapat menyelesaikan ekspor kode QR; silakan coba lagi',
  },
  sessionExpiredRefreshPage: `Sesi mungkin telah berakhir.
Coba muat ulang halaman.`,
  survey: {
    nodeDefNameNotFound: 'Definisi node tidak ditemukan: {{name}}',
    dataMigrationInProgress: 'Survei ini sedang ditingkatkan, silakan coba lagi sebentar lagi.',
    fileNotFound: 'File tidak ditemukan',
    nodeDefRefLocked: '{{name}} tidak dapat menggunakan kategori atau taksonomi lain: sudah diterbitkan.',
    languageCodeInvalid: 'Kode bahasa tidak valid: {{lang}}',
    cycleKeysInvalid: 'Siklus harus diberi nomor berurutan, dimulai dari 1',
    srsCodeInvalid: 'Kode sistem referensi spasial tidak valid: {{code}}',
  },
  unsupportedFunctionType: 'Jenis fungsi tidak didukung: {{exprType}}',
  // AI gateway errors
  aiSessionExpired: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
  aiNotAuthorized: 'Anda tidak diizinkan menggunakan fitur AI ini di sini.',
  aiNotConfigured:
    'AI belum dikonfigurasi. Tetapkan penyedia pribadi di Pengaturan AI atau minta administrator Anda untuk mengonfigurasi penyedia default.',
  aiPolicyRefused:
    'Kebijakan AI survei ini tidak mengizinkan pengiriman $t(common:aiPolicy.dataClass.{{dataClass}}) ke $t(common:aiPolicy.hostingClass.{{hostingClass}}).',
  aiPolicyDataAboveSchema:
    "Data catatan tidak boleh lebih longgar daripada desain survei (desain: '$t(common:aiPolicy.level.{{schema}})', data catatan: '$t(common:aiPolicy.level.{{data}})').",
  aiPolicyInvalid: 'Kebijakan AI tidak valid: pilih satu tingkat untuk desain survei dan satu untuk data catatan.',
  aiPolicyAboveCeiling:
    "'$t(common:aiPolicy.level.{{level}})' tidak diizinkan untuk $t(common:aiPolicy.dataClass.{{dataClass}}) pada instans Arena ini (maksimum: '$t(common:aiPolicy.level.{{ceiling}})').",
  aiFeaturesDisabled: 'Fitur AI dinonaktifkan pada instalasi ini.',
  aiFeatureDisabled: 'Fitur AI "{{feature}}" dinonaktifkan.',
  aiPromptTooLarge: 'Prompt AI terlalu besar ({{size}} karakter; batas {{limit}}).',
  aiInputTooLong: 'Isian input AI "{{field}}" melebihi batas {{limit}} karakter.',
  aiFeatureUnknown: 'Fitur AI "{{feature}}" tidak dikenal.',
  aiCallInvalid: 'Permintaan AI tidak valid ({{reason}}).',
  aiRateLimited: 'Terlalu banyak permintaan AI. Silakan tunggu satu menit lalu coba lagi.',
  aiDailyBudgetExceeded:
    'Anda telah mencapai batas hari ini untuk penyedia AI default Arena. Batas ini diatur ulang pada tengah malam UTC. Anda tetap dapat bekerja dengan penyedia Anda sendiri di Pengaturan AI.',
  aiRequestTimeout: 'AI terlalu lama memberikan jawaban. Silakan coba lagi.',
  aiToolNotOffered:
    'AI meminta alat yang tidak diizinkan untuk digunakan, sehingga jawabannya dibuang. Silakan coba lagi.',
  aiProviderAuth: 'Penyedia AI menolak kredensial. Periksa kunci API di Pengaturan AI atau hubungi administrator Anda.',
  aiProviderRateLimited: 'Penyedia AI sedang membatasi jumlah permintaan. Silakan coba lagi sebentar lagi.',
  aiProviderRejected: 'Penyedia AI menolak permintaan (periksa nama model di Pengaturan AI).',
  aiDataDictionaryInvalid: 'AI tidak mengembalikan deskripsi isian yang dapat digunakan.',
  aiDescriptionsInvalid: 'Deskripsi isian AI yang dikirim bersama ekspor tidak valid.',
  aiIncludeAiDescriptionsRemoved: 'Halaman ini sudah usang. Muat ulang lalu ekspor kembali.',
  aiProviderInvalid: 'Penyedia AI tidak didukung: {{provider}}.',
  aiModelMissing: 'Pengenal model AI wajib diisi.',
  aiApiKeyMissing: 'Kunci API wajib diisi untuk penyedia {{provider}}.',
  aiBaseUrlMissing: 'URL dasar wajib diisi untuk penyedia openai-compatible.',
  aiBaseUrlNotAllowed:
    'URL dasar ini mengarah ke alamat internal, yang tidak dipanggil oleh server Arena. Untuk model di komputer Anda, gunakan server AI lokal. Untuk server milik organisasi Anda, minta administrator untuk menambahkannya ke server model organisasi.',
  aiProviderUnavailable: 'Penyedia AI tidak dapat dijangkau. Silakan coba lagi nanti.',
  aiProviderResponseTooLarge:
    'Penyedia AI mengirim jawaban yang terlalu besar, sehingga jawaban terpotong. Silakan coba lagi atau pilih penyedia lain.',
  aiSurveyChanged: 'Survei berubah saat asisten sedang bekerja. Tanyakan lagi untuk menggunakan survei saat ini.',
  aiModelListFailed: 'Tidak dapat menampilkan daftar model dari penyedia.',
  aiProviderNotFound: 'Penyedia AI ini tidak ada atau bukan milik Anda. Pilih penyedia lain.',
  aiProviderNotGateway:
    'Penyedia yang disimpan di peramban ini dipanggil dari peramban, tidak pernah melalui server Arena.',
  aiApiKeyUnreadable:
    'Kunci API tersimpan dari penyedia ini tidak dapat dibaca lagi (rahasia enkripsi server telah berubah). Sunting penyedia di pengaturan AI Anda dan masukkan kunci kembali.',
  aiEncryptionMissing:
    'Kunci API tidak dapat disimpan: server tidak memiliki rahasia enkripsi. Minta administrator Anda untuk menetapkan AI_USER_KEY_ENCRYPTION_SECRET.',
  aiProviderChanged:
    'Penyedia AI ini diubah atau dihapus saat sedang diperiksa. Muat ulang pengaturan AI lalu coba lagi.',
  aiProviderFieldTooLong:
    'Nilai penyedia terlalu panjang: $t(appErrors:aiProviderFieldNames.{{field}}) maksimal {{max}} karakter.',
  aiProviderFieldNames: { model: 'Model', baseUrl: 'URL dasar', apiKey: 'Kunci API' },
  aiProviderLimitReached:
    'Anda dapat menyimpan paling banyak {{max}} penyedia AI. Hapus salah satu untuk menambahkan yang lain.',
  aiExpressionDescriptionMissing: 'Silakan jelaskan ekspresi yang Anda inginkan dalam bahasa sehari-hari.',
  aiExpressionTypeInvalid: 'Jenis ekspresi tidak dikenal: {{expressionType}}.',
  aiExpressionNodeDefMissing: 'Tidak dapat membuat ekspresi tanpa isian target.',
  aiExpressionNodeDefNotFound: 'Tidak dapat menemukan isian target (uuid {{nodeDefUuid}}).',
  aiExpressionExpressionMissing: 'Tidak dapat menjelaskan ekspresi kosong.',
  aiTranslationSourceLangMissing: 'Bahasa sumber wajib diisi untuk terjemahan.',
  aiTranslationTargetLangsMissing: 'Setidaknya satu bahasa target wajib diisi untuk terjemahan.',
  aiTranslationItemsMissing: 'Tidak ada yang perlu diterjemahkan.',
  aiTranslationInvalid: 'AI tidak mengembalikan terjemahan yang dapat digunakan. Silakan coba lagi.',
  aiTranslationTooManyItems: 'Terlalu banyak item dalam satu kelompok ({{count}}); batasnya {{limit}}.',
  aiDataQueryDescriptionMissing: 'Silakan jelaskan data yang ingin Anda lihat dalam bahasa sehari-hari.',
  aiDataQueryNoEntities: 'Survei ini tidak memiliki entitas yang dapat dikueri.',
  aiDataQueryInvalid: 'AI tidak dapat membuat kueri yang valid untuk permintaan ini: {{errors}}',
  aiDataQueryEmpty: 'Pilih entitas dan beberapa atribut (atau dimensi dan ukuran) terlebih dahulu.',
  aiAssistantNoAnswer: 'Asisten berhenti tanpa menulis jawaban. Coba lagi, atau ajukan pertanyaan yang lebih spesifik.',
  aiAssistantContextFull:
    'Konteks model sudah penuh sebelum asisten dapat menjawab. Mulai percakapan baru, ajukan pertanyaan yang lebih spesifik, atau gunakan model dengan konteks yang lebih besar.',
  aiAssistantToolCallText:
    'Model menulis panggilan alat sebagai teks alih-alih memanggil alat tersebut. Coba lagi, atau gunakan model yang lebih besar.',
  aiLocalServerUnreachable:
    'Server AI di {{baseUrl}} tidak dapat dijangkau. Apakah server sedang berjalan, dengan CORS diaktifkan? Apakah peramban memblokir akses ke perangkat jaringan lokal?',
  aiLocalServerModelMissing:
    'Model "{{modelId}}" tidak tersedia di server AI lokal. Muat model di LM Studio atau pilih model lain di pengaturan AI Anda.',
  aiLocalServerContextExceeded:
    'Permintaan terlalu panjang untuk ukuran konteks model lokal. Muat model dengan konteks yang lebih besar di LM Studio, atau persingkat permintaan.',
  aiLocalServerError: 'Server AI lokal mengembalikan kesalahan (HTTP {{status}}).',
  aiNoEngineAvailable: 'Tidak ada mesin AI yang dapat digunakan untuk permintaan ini.',
  aiLocalServerConsentCancelled: 'Permintaan dibatalkan.',
  aiProviderChooseAnother: 'Permintaan tidak dikirim. Pilih penyedia AI lain.',
  aiDataQuerySummaryInvalid: 'AI tidak dapat menyarankan nama dan deskripsi untuk kueri ini. Silakan coba lagi.',
  aiApplyTimeout:
    'Server tidak merespons tepat waktu. Beberapa perubahan mungkin sudah diterapkan: muat ulang untuk memeriksa.',
  userCannotDeleteHasMessages:
    'Pengguna ini tidak dapat dihapus: pengguna ini menulis {{count}} pesan; hapus atau alihkan pesan tersebut terlebih dahulu',
  userCannotDeleteLastSystemAdmin:
    'Pengguna ini tidak dapat dihapus: pengguna ini adalah administrator sistem terakhir',
  userCannotDeleteOwnsSurveys:
    'Pengguna ini tidak dapat dihapus: pengguna ini memiliki {{count}} survei; alihkan kepemilikan terlebih dahulu',
  userCannotDeleteSelf: 'Anda tidak dapat menghapus akun pengguna Anda sendiri',
  userEmailInvalid: 'Email undangan tidak dapat dikirim ke {{email}}; periksa apakah alamatnya sudah benar',
  userHasPendingInvitation: `Sudah ada undangan tertunda untuk pengguna dengan email '{{email}}'; pengguna tersebut tidak dapat diundang ke survei ini sampai undangan diterima`,
  userHasRole: 'Pengguna ini sudah memiliki peran dalam survei ini',
  userHasRole_other: 'Pengguna-pengguna ini sudah memiliki peran dalam survei ini',
  userInvalid: 'Pengguna tidak valid',
  userInvitationLinkNotAvailable:
    'Tautan undangan pengguna ini hanya dapat disalin oleh administrator sistem, karena pengguna memiliki peran atau undangan di luar survei ini',
  surveyCompareFileTooLarge:
    'File survei terlalu besar (maks. {{maxSize}} MB): ekspor survei tanpa data, catatan dan file-filenya tidak diperlukan untuk membandingkan survei',
  userIsAdmin: 'Pengguna ini sudah menjadi administrator sistem',
  userNotAllowedToChangePref: 'Pengguna tidak diizinkan mengubah preferensi',
  userPrefsInvalid: 'Preferensi pengguna tidak valid',
  userNotAuthorized: 'Pengguna {{userName}} tidak memiliki otorisasi',
  userNotFound: 'Pengguna tidak ditemukan: {{userUuid}}',
  userNotInvitedToSurvey: 'Pengguna tidak memiliki undangan tertunda untuk survei ini',
  usersBackupImport: {
    invalidFile: 'File ini bukan cadangan pengguna Arena yang valid',
  },
}
