import {
  locationItemExtraDefName,
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Aktif',
    add: 'Tambah',
    advancedFunctions: 'Fungsi lanjutan',
    and: 'dan',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Terapkan',
    aggregateFunction: 'Fungsi agregat',
    aggregateFunction_other: 'Fungsi agregat',
    attribute: 'Atribut',
    attribute_other: 'Atribut',
    avg: 'Rata-rata',
    ascending: 'Naik',
    areaBased: 'berbasis area',
    back: 'Kembali',
    baseUnit: 'Satuan dasar',
    cancel: 'Batal',
    cancelConfirm: `**Ada perubahan yang belum disimpan**.

Apakah Anda ingin mengabaikannya?`,
    cantUndoWarning: 'Operasi ini tidak dapat dibatalkan',
    cantBeDeletedUsedItem: '{{item}} ini digunakan oleh beberapa definisi node dan tidak dapat dihapus',
    chain: 'Rantai',
    chain_other: 'Rantai',
    childrenEmpty: 'Tentukan setidaknya satu item turunan',
    clear: 'Bersihkan',
    clone: 'Klon',
    close: 'Tutup',
    cloneFrom: 'Klon dari',
    cnt: 'Jumlah',
    code: 'Kode',
    collapse: 'Ciutkan',
    confirm: 'Konfirmasi',
    convert: 'Konversi',
    copy: 'Salin',
    createdWith: 'Dibuat dengan',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Siklus',
    cycle_other: 'Siklus',
    dateCreated: 'Tanggal dibuat',
    dateLastModified: 'Tanggal terakhir diubah',
    delete: 'Hapus',
    deleted: 'Dihapus!',
    descending: 'Turun',
    description: 'Deskripsi',
    description_other: 'Deskripsi',
    designerNotes: 'Catatan perancang',
    designerNotesInfo: `Catatan perancang hanya akan terlihat di perancang formulir survei dan tidak akan terlihat di formulir entri data.`,
    details: 'Detail',
    dimension: 'Dimensi',
    dimension_other: 'Dimensi',
    done: 'Selesai',
    download: 'Unduh',
    draft: 'Draf',
    edit: 'Sunting',
    elapsed: 'Berlalu',
    email: 'Email',
    email_other: 'Email',
    emailSentConfirmation: `Email ke {{email}} telah dikirim.

    Mohon beri tahu orang tersebut untuk memeriksa juga folder Spam/Junk.`,
    logoutServerNotReached:
      'Server tidak dapat dihubungi, sehingga sesi Anda di server mungkin masih aktif. Jika ini komputer bersama, tutup peramban.',
    emailSentToSelfConfirmation: `Anda seharusnya telah menerima email di {{email}}.

Mohon periksa juga folder Spam/Junk.`,
    empty: 'Kosong',
    entity: 'Entitas',
    error: 'Kesalahan',
    error_other: 'Kesalahan',
    errorFound: '1 kesalahan ditemukan',
    errorFound_other: '{{count}} kesalahan ditemukan',
    errorMessage: 'Pesan kesalahan',
    errorMessage_other: 'Pesan kesalahan',
    expand: 'Bentangkan',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Ekspor',
    exportAll: 'Ekspor semua',
    exportToCSV: 'Ekspor ke CSV',
    exportToExcel: 'Ekspor ke Excel',
    exportToExcelTooManyItems: 'Terlalu banyak item untuk diekspor ke Excel; silakan gunakan ekspor CSV.',
    expression: 'Ekspresi',
    false: 'Salah',
    fetchError: 'Tidak dapat memuat data: {{message}}',
    file: 'File',
    file_other: 'File',
    formContainsErrors: 'Formulir berisi kesalahan',
    formContainsErrorsCannotContinue: 'Formulir berisi kesalahan. Harap perbaiki sebelum melanjutkan.',
    formContainsErrorsCannotSave: 'Formulir berisi kesalahan. Harap perbaiki sebelum menyimpan.',
    from: 'Dari',
    function: 'Fungsi',
    goToHomePage: 'Ke Beranda',
    goToSurveys: 'Ke daftar survei',
    group: 'Grup',
    help: 'Bantuan',
    hide: 'Sembunyikan',
    hideValue: 'Sembunyikan nilai',
    id: 'id',
    import: 'Impor',
    importFromExcelOrCSVFile: 'Impor dari file Excel (.xlsx) atau CSV',
    info: 'Info',
    invalid: 'TIDAK VALID',
    item: 'Item',
    item_other: 'Item',
    itemAlreadyAdded: 'Item sudah ditambahkan',
    label: 'Label',
    label_other: 'Label',
    language: 'Bahasa',
    language_other: 'Bahasa',
    leavePageConfirmMessage: `Ada perubahan yang belum disimpan di formulir.

Dengan mengonfirmasi, semua perubahan akan hilang.
Apakah Anda ingin melanjutkan?`,
    local: 'Lokal',
    loading: 'Memuat...',
    lock: 'Kunci',
    showValue: 'Tampilkan nilai',
    unlock: 'Buka kunci',
    max: 'Maksimum',
    med: 'Median',
    manage: 'Kelola',
    messages: 'Pesan',
    measure: 'Ukuran',
    measure_other: 'Ukuran',
    measurePrevSteps: 'Ukuran Langkah Sebelumnya',
    measurePrevSteps_other: 'Ukuran Langkah Sebelumnya',
    min: 'Minimum',
    moveUp: 'Pindah ke atas',
    moveDown: 'Pindah ke bawah',
    name: 'Nama',
    new: 'Baru',
    next: 'Berikutnya',
    no: 'Tidak',
    noItems: `$t(common.no) $t(common.item_other)`,
    notification: 'Notifikasi',
    notification_other: 'Notifikasi',
    notSpecified: '---Tidak ditentukan---',
    orderBy: 'Urutkan menurut',
    of: 'dari',
    ok: 'Ok',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Buka di jendela baru',
    options: 'Opsi',
    owner: 'Pemilik',
    path: 'Jalur',
    pause: 'Jeda',
    preview: 'Mode Pratinjau',
    previous: 'Sebelumnya',
    publish: 'Terbitkan',
    publishConfirm: `#### Anda akan menerbitkan survei {{survey}} ####

###### Proses penerbitan akan *menghapus secara permanen* informasi berikut ######
- Label yang terkait dengan bahasa yang dihapus.
- Catatan yang terkait dengan siklus yang dihapus.
- Data yang terkait dengan bidang formulir yang dihapus.

###### Setelah penerbitan: ######
- Bidang formulir tidak dapat diubah dari tunggal menjadi jamak dan sebaliknya.
- Kode item kategori tidak dapat diubah.
- Item kategori tidak dapat dihapus.
- Kode taksonomi tidak dapat diubah.
- Takson tidak dapat dihapus.

**Apakah Anda yakin ingin melanjutkan?**`,
    publishRecordValuesUpdateConfirm: `#### Menerbitkan {{survey}} akan memperbarui data yang sudah direkam ####

{{reasons}}

Operasi ini dapat mengubah atau mengosongkan secara permanen data yang sudah dimasukkan.

Untuk menerbitkan tanpa memperbarui data yang ada, centang "Lewati pembaruan data" di bawah (tidak disarankan).`,
    publishRecordValuesUpdateConfirmHeader: 'Data catatan yang ada akan diperbarui',
    publishRecordValuesUpdateConfirmOk: 'Terbitkan dan perbarui data',
    publishRecordValuesUpdateConfirmInputLabel: 'Ketik nama survei "{{strongConfirmRequiredText}}" untuk mengonfirmasi',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Atribut berikut akan diubah, dan nilainya di catatan yang ada akan dihitung ulang secara otomatis: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Atribut berikut menggunakan properti tambahan dari kategori atau taksonomi yang berubah, sehingga nilainya di catatan yang ada akan dihitung ulang: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Lewati pembaruan data',
    publishSkipDataUpdateConfirmOk: 'Lewati pembaruan data dan terbitkan',
    publishSkipDataUpdateImplications: 'Melewati pembaruan data berarti:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Catatan yang ada mungkin tidak lagi sesuai dengan definisi survei yang baru',
    publishSkipDataUpdateImplicationStaleValues:
      'Nilai yang terdampak tidak akan dihitung ulang sampai dimasukkan ulang secara manual',
    publishSkipDataUpdateImplicationChains:
      'Rantai pemrosesan yang menggunakan atribut ini dapat menghasilkan hasil yang usang',
    raiseTicketInSupportForum: `Jika terjadi masalah, silakan buat tiket dengan tag 'arena' di <b>Forum Dukungan</b> kami: $t(links.supportForum)`,
    record: 'Catatan',
    record_other: 'Catatan',
    remaining: 'Tersisa',
    remote: 'Jarak jauh',
    required: 'Wajib',
    requiredField: 'bidang wajib',
    reset: 'Atur ulang',
    refresh: 'Muat ulang',
    pressRefreshToReloadPage: 'Tekan Muat ulang untuk memuat ulang halaman.',
    resume: 'Lanjutkan',
    retry: 'Coba lagi',
    role: 'Peran',
    save: 'Simpan',
    saveAndBack: 'Simpan & Kembali',
    saved: 'Tersimpan!',
    samplingPolygon: 'Poligon Sampel',
    show: 'Tampilkan',
    select: 'Pilih',
    selectOne: 'Pilih salah satu...',
    selectAll: 'Pilih semua',
    selected: 'Dipilih',
    showLabels: 'Tampilkan label',
    showLabelsAndNames: 'Tampilkan label dan nama',
    showNames: 'Tampilkan nama',
    sort: 'Urutkan',
    sortAsc: 'Urutkan naik',
    sortDesc: 'Urutkan turun',
    sortNone: 'Hapus pengurutan',
    srs: 'SRS',
    status: 'Status',
    sum: 'Jumlah total',
    test: 'Uji',
    to: 'Ke',
    totalItems: 'Total item',
    true: 'Benar',
    trySplittingFileIntoSmallerChunks: 'Coba pisahkan file menjadi bagian-bagian yang lebih kecil.',
    type: 'Tipe',
    undefinedName: 'Nama tidak ditentukan',
    unique: 'Unik',
    upload: 'Unggah',
    uploadErrorConfirm: {
      message: `Kesalahan saat mengunggah file: {{error}}.\n
Coba lagi?`,
    },
    uploadFileChangedError: 'File yang dipilih tampaknya telah diubah sejak dipilih. Silakan pilih lagi.',
    uploadingFile: 'Mengunggah file ({{progressPercent}}%)',
    value: 'Nilai',
    view: 'Lihat',
    warning: 'Peringatan',
    warning_other: 'Peringatan',
    yes: 'Ya',
    date: {
      aMomentAgo: 'Baru saja',
      hour: 'jam',
      hour_other: 'jam',
      day: 'hari',
      day_other: 'hari',
      minute: 'menit',
      minute_other: 'menit',
      week: 'minggu',
      week_other: 'minggu',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} }) yang lalu`,
    },
    paginator: {
      firstPage: 'Halaman pertama',
      goToPage: 'Ke halaman',
      itemsPerPage: 'Item per halaman',
      lastPage: 'Halaman terakhir',
      nextPage: 'Halaman berikutnya',
      page: 'Halaman',
      previousPage: 'Halaman sebelumnya',
    },
    table: {
      visibleColumns: 'Kolom yang terlihat',
    },
  },
  confirm: {
    strongConfirmInputLabel: 'Untuk mengonfirmasi, ketik teks berikut: **{{strongConfirmRequiredText}}**',
  },
  dropzone: {
    acceptedFilesMessage: '(Hanya file {{acceptedExtensions}} dengan ukuran maksimum {{maxSize}} yang akan diterima)',
    error: {
      fileNotValid: 'File yang dipilih tidak valid',
      fileTooBig: 'File yang dipilih terlalu besar',
      invalidFileExtension: 'Ekstensi file tidak valid: {{extension}}',
    },
    message: 'Seret dan lepas file di sini, atau klik untuk memilihnya',
    selectedFile: 'File yang dipilih',
    selectedFile_other: 'File yang dipilih',
  },
  error: {
    pageNotFound: 'Halaman tidak ditemukan',
  },
  geo: {
    area: 'Luas',
    vertices: 'Simpul',
    perimeter: 'Keliling',
  },
  files: {
    header: 'File',
    missing: ' File yang hilang: {{count}}',
    totalSize: 'Ukuran total: {{size}}',
    fileName: 'Nama file',
    fileSize: 'Ukuran file',
  },
  sidebar: {
    logout: 'Keluar',
  },
  header: {
    theme: {
      label: 'Tema',
      light: 'Terang',
      dark: 'Gelap',
      system: 'Bawaan sistem',
    },
    myProfile: 'Profil saya',
    qrCodeLoginDialog: {
      title: 'Masuk ke Arena Mobile menggunakan kode QR',
      instructions: `1. Jalankan aplikasi **Arena Mobile** di perangkat seluler Anda
2. Buka menu **Pengaturan**
3. Pilih  **Koneksi ke server**
4. Tekan **Masuk menggunakan kode QR**
5. Pindai kode QR yang ditampilkan di layar ini`,
      success: 'Berhasil masuk!',
      error: 'Kesalahan saat membuat kode QR: {{error}}',
    },
  },
  nodeDefsTypes: {
    integer: 'Bilangan bulat',
    decimal: 'Desimal',
    text: 'Teks',
    date: 'Tanggal',
    time: 'Waktu',
    boolean: 'Boolean',
    code: 'Kode',
    coordinate: 'Koordinat',
    geo: 'Geospasial',
    taxon: 'Takson',
    file: 'File',
    entity: 'Entitas',
  },

  // ====== App modules and views
  appModules: {
    home: 'Beranda',
    landing: 'Halaman awal',
    dashboard: 'Dasbor',
    surveyNew: 'Survei Baru',
    surveys: 'Survei',
    templateNew: 'Templat Baru',
    templates: 'Templat',
    usersAccessRequest: 'Permintaan Akses Pengguna',
    collectImportReport: 'Laporan Impor Collect',

    surveyInfo: 'Info Survei',
    designer: 'Survei',
    formDesigner: 'Perancang Formulir',
    surveyHierarchy: 'Hierarki',
    surveyDependencyTree: 'Pohon dependensi',
    surveyCompare: 'Bandingkan / perbarui dari file',
    category: 'Kategori',
    categories: 'Kategori',
    nodeDef: 'Definisi Node',
    taxonomy: 'Taksonomi',
    taxonomies: 'Taksonomi',

    data: 'Data',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Laporan validasi catatan',
    explorer: 'Penjelajah',
    map: 'Peta',
    charts: 'Grafik',
    export: 'Ekspor Data',
    import: 'Impor Data',
    validationReport: 'Laporan validasi',
    formPreview: 'Pratinjau formulir',

    users: 'Pengguna',
    user: 'Profil Pengguna',
    userPasswordChange: 'Ubah kata sandi',
    userInvite: 'Undang pengguna',
    userNew: 'Pengguna Baru',
    usersSurvey: 'Daftar pengguna',
    userGroup: 'Grup Pengguna',
    userGroup_other: 'Grup Pengguna',
    userGroupNew: 'Grup Pengguna Baru',
    usersList: 'Daftar pengguna (semua)',
    user2FADevice: 'Perangkat 2FA',
    user2FADevice_other: 'Perangkat 2FA',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Analisis',
    chain: 'Rantai',
    chain_other: 'Rantai',
    virtualEntity: 'Entitas Virtual',
    entities: 'Entitas virtual',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Sesi RStudio',

    message: 'Pesan',
    message_other: '$t(common.messages)',

    systemAdmin: 'Administrasi Sistem',
    jobMonitor: 'Pemantau Tugas',
    systemLogs: 'Log Sistem',
    authProviders: 'Penyedia Login',
    authProvider: 'Penyedia Login',

    help: 'Bantuan',
    about: 'Tentang',
    changelog: 'Catatan perubahan',
    whatsNew: 'Yang baru',
    termsOfService: 'Ketentuan Layanan',
    privacyPolicy: 'Kebijakan Privasi',
    userManual: 'Panduan Pengguna',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Bagian ini hanya tersedia jika survei sudah diterbitkan',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Tipe dependensi',
    dependencyTypes: {
      applicable: 'Penerapan',
      defaultValues: 'Nilai bawaan',
      editable: 'Dapat disunting',
      fileName: 'Nama file',
      itemsFilter: 'Filter item',
      maxCount: 'Jumlah maks.',
      minCount: 'Jumlah min.',
      parentCode: 'Kode induk',
      validations: 'Validasi',
      visible: 'Terlihat',
    },
    selectAtLeastOneDependencyType: 'Pilih setidaknya satu tipe dependensi',
    noDependenciesToDisplay: 'Tidak ada dependensi untuk ditampilkan',
  },
  designerView: {
    formPreview: 'Pratinjau formulir',
  },
  recordView: {
    justDeleted: 'Catatan ini baru saja dihapus',
    sessionExpired: 'Sesi catatan telah kedaluwarsa',
    errorLoadingRecord: 'Kesalahan saat memuat catatan: {{details}}',
    recordEditModalTitle: 'Catatan: {{keyValues}}',
    recordNotFound: 'Catatan tidak ditemukan',
    keyAttributeEditing: {
      lock: 'Kunci penyuntingan atribut kunci',
      unlock: 'Izinkan penyuntingan atribut kunci',
    },
    qualifierAttributeEditing: {
      lock: 'Kunci penyuntingan atribut kualifikasi',
      unlock: 'Izinkan penyuntingan atribut kualifikasi',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Hapus fungsi agregat kustom ini?',
      sqlExpression: 'Ekspresi SQL',
    },
    editRecord: 'Sunting catatan',
  },
  mapView: {
    changeMarkerColor: 'Ubah warna penanda',
    createRecord: 'Buat catatan baru',
    editRecord: 'Sunting catatan',
    elevation: 'Elevasi (m)',
    location: 'Lokasi',
    locationEditInfo: 'Klik ganda pada peta atau seret penanda untuk memperbarui lokasi',
    locationNotValidOrOutOfRange: 'Lokasi tidak valid atau di luar rentang zona UTM',
    locationUpdated: 'Lokasi diperbarui',
    samplingPointDataLayerName: 'Data titik sampel - tingkat {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (memuat...)',
    samplingPointItemPopup: {
      title: 'Item Titik Sampel',
      levelCode: 'Kode tingkat {{level}}',
    },
    selectedPeriod: 'Periode yang dipilih',
  },

  mapWorkspace: {
    scenes: {
      tab: 'Sentinel-2',
      title: 'Citra Sentinel-2',
      menuSearch: 'Cari citra Sentinel-2 terbaru…',
      intro:
        'Sentinel-2 L2A, 10 m. Dicari di peramban dari indeks STAC GeoParquet statis, dan digambar langsung dari GeoTIFF cloud-optimised setiap citra. Tanpa server tile.',
      area: {
        label: 'Area',
        view: 'Tampilan peta',
        plot: 'Plot yang dipilih',
        draw: 'Gambar area',
        drawAgain: 'Gambar lagi',
      },
      period: {
        label: 'Periode',
        hint: 'hingga 6 bulan ke belakang',
        months_other: '{{count}} bulan',
      },
      maxCloud: 'Awan maks.',
      minCoverage: 'Cakupan min.',
      percent: '{{value}} %',
      chart: {
        title: 'Citra cerah per bulan',
        allMonths: 'Semua bulan',
        bar_other: '{{month}}: {{count}} citra',
      },
      count_other: '{{count}} citra',
      countInMonth_other: '{{count}} citra pada {{month}}',
      sort: {
        label: 'Urutkan',
        newest: 'Terbaru',
        leastCloud: 'Awan paling sedikit',
        mostCoverage: 'Cakupan terluas',
      },
      rowDetails: 'Tile {{tile}} · awan {{cloud}} · cakupan {{coverage}}',
      unknownValue: '–',
      thumbnailAlt: 'Pratinjau citra tanggal {{date}}',
      addAsLayer: 'Tambahkan sebagai lapisan',
      alreadyOnMap: 'Sudah ada di peta',
      useAsBaseMap: 'Gunakan sebagai peta dasar',
      loadingScene: 'Memuat citra…',
      bands: {
        label: 'Kanal',
        trueColour: 'Warna asli (cepat, satu file)',
        falseColourVegetation: 'Warna semu, vegetasi (B8, B4, B3)',
        swir: 'Inframerah gelombang pendek (B12, B8A, B4)',
        note: 'Kombinasi kanal lainnya membaca tiga file per citra, sehingga dimuat lebih lambat.',
      },
      bandsShort: {
        trueColour: 'warna asli',
        falseColourVegetation: 'warna semu',
        swir: 'SWIR',
      },
      layerName: 'Sentinel-2 {{date}} · {{tile}} · {{bands}}',
      baseLayerName: '{{name}} (peta dasar)',
      messages: {
        drawing: 'Klik dua sudut yang berlawanan di peta untuk menggambar area.',
        noPlot: 'Buka penanda plot di peta untuk mencari di sekitarnya.',
        noDrawnArea: 'Gambar persegi panjang di peta untuk mencari di dalamnya.',
        tooLarge: 'Area terlalu luas: perbesar hingga mencakup paling banyak {{max}} tile Sentinel-2.',
        outside: 'Tile Sentinel-2 hanya mencakup lintang dari 80° LS hingga 84° LU.',
        error: 'Indeks citra tidak dapat dibaca.',
        retry: 'Coba lagi',
        searching_other: 'Mencari di {{count}} tile…',
        empty: 'Tidak ada citra yang cocok. Izinkan lebih banyak awan atau periode yang lebih panjang.',
        layerError: 'Citra tidak dapat ditampilkan.',
      },
    },
    wms: {
      menuItem: 'Tambahkan layanan WMS / WMTS…',
      title: 'Tambahkan layanan WMS / WMTS',
      serviceUrl: 'URL layanan',
      serviceUrlPlaceholder: 'https://example.org/geoserver/wms',
      loadLayers: 'Muat lapisan',
      loading: 'Memuat…',
      urlHint: 'URL GetCapabilities WMS atau WMTS, atau templat tile XYZ dengan {z}/{x}/{y}',
      insecureUrlHint: 'Layanan ini menggunakan http: peramban mungkin memblokir tile-nya di halaman https ini',
      layersCount: '{{count}} lapisan',
      layersCount_other: '{{count}} lapisan',
      webMercatorSupported: 'Web Mercator didukung',
      webMercatorMissing: 'Tidak ada lapisan dalam Web Mercator',
      truncated: 'hanya {{max}} lapisan pertama yang dicantumkan',
      xyzSummary: 'Templat tile XYZ · tidak perlu capabilities',
      layersToAdd: 'Lapisan yang akan ditambahkan',
      layerNotWebMercator: 'Tidak tersedia dalam Web Mercator',
      addAs: 'Tambahkan sebagai',
      addAsOverlay: 'Lapisan overlay',
      addAsOverlayDescription: 'Ditampilkan di atas peta dasar, tercantum di tab Lapisan',
      addAsBaseMap: 'Peta dasar',
      addAsBaseMapDescription: 'Menggantikan peta dasar, tercantum di menu Peta dasar',
      displayName: 'Nama tampilan',
      displayNameMultiple: 'Setiap lapisan mempertahankan judulnya sendiri',
      imageFormat: 'Format gambar',
      formatPng: 'PNG (transparan)',
      formatJpeg: 'JPEG (lebih kecil)',
      opacity: 'Opasitas',
      attribution: 'Atribusi',
      whoSeesIt: 'Siapa yang dapat melihat',
      scopeSurvey: 'Semua orang di survei ini',
      scopeUser: 'Hanya saya',
      submitOverlays: 'Tambahkan {{count}} overlay',
      submitOverlays_other: 'Tambahkan {{count}} overlay',
      submitBaseMaps: 'Tambahkan {{count}} peta dasar',
      submitBaseMaps_other: 'Tambahkan {{count}} peta dasar',
      removeSelectedBaseMap: 'Hapus peta dasar kustom yang dipilih',
      hiddenForSession:
        'Lapisan disembunyikan sampai peta dibuka kembali: hanya orang yang dapat menyunting survei yang dapat menghapus lapisan yang dibagikan dengan semua orang',
      errors: {
        fetchLayersFailed: 'Tidak dapat memuat lapisan peta kustom',
        loadFailed: 'Tidak dapat memuat lapisan dari layanan ini',
        saveFailed: 'Tidak dapat menyimpan lapisan',
        removeFailed: 'Tidak dapat menghapus lapisan',
      },
    },
    toolbarLabel: 'Alat peta',
    menus: {
      baseMap: 'Peta dasar',
      addData: 'Tambah data',
      display: 'Tampilan',
      imagery: 'Citra',
      tools: 'Alat',
    },
    addData: {
      uploadFile: 'Unggah KML, KMZ, atau Shapefile…',
    },
    display: {
      showLocationMarkers: 'Penanda lokasi',
      showMarkersLabels: 'Label penanda',
      showUtmGrid: 'Grid UTM',
      imageInterpretation: 'Interpretasi citra',
      showSamplingPolygon: 'Poligon sampel',
      showControlPoints: 'Titik kontrol',
      showPlotReferencePoint: 'Titik referensi plot',
    },
    tools: {
      measureDistance: 'Ukur jarak',
    },
    quick: {
      zoomToData: 'Perbesar ke data',
      fullScreen: 'Layar penuh',
      exitFullScreen: 'Keluar dari layar penuh',
      noDataToZoom: 'Tidak ada data di peta untuk diperbesar',
    },
    search: {
      label: 'Cari di peta',
      placeholderFull: 'Kunci catatan atau koordinat',
      placeholderCompact: 'Koordinat',
      goTo: 'Ke {{coordinates}}',
      invalidCoordinates: 'Koordinat di luar rentang',
      noMatch: 'Tidak ada catatan atau koordinat yang cocok',
      coordinatesHint: 'Ketik koordinat, mis. 41.9, 12.5',
    },
    rail: {
      label: 'Panel peta',
      close: 'Ciutkan panel',
      resize: 'Ubah ukuran panel',
      tabs: {
        layers: 'Lapisan',
        records: 'Catatan',
        legend: 'Legenda',
      },
      titles: {
        records: 'Catatan di peta',
      },
      recordsEmpty: 'Tampilkan lapisan data survei untuk mencantumkan catatannya',
    },
    layers: {
      noSurveyData: 'Survei ini tidak memiliki data untuk ditampilkan di peta',
      groups: {
        custom: 'Kustom (WMS / WMTS)',
        scenes: 'Citra Sentinel-2',
        uploaded: 'File yang diunggah',
      },
      opacity: 'Opasitas {{name}}',
      remove: 'Hapus {{name}}',
    },
    legend: {
      marker: 'Lokasi catatan',
      cluster: 'Kelompok catatan yang berdekatan',
      samplingPolygon: 'Poligon sampel',
      utmGrid: 'Grid UTM',
      addedLayers: 'Lapisan yang ditambahkan',
    },
    status: {
      changeNotation: 'Klik untuk mengubah notasi',
      notations: {
        latLon: 'Lat, Lon',
        dms: 'DMS',
        utm: 'UTM',
      },
      zoom: 'Zoom',
      scale: 'Skala',
      recordsInView_other: '{{count}} catatan dalam tampilan',
    },
    upload: {
      unsupported: 'File tidak didukung: pilih file KML, KMZ, Shapefile terkompresi (zip), atau GeoJSON',
      tooLarge: 'File terlalu besar: maksimum {{maxSize}} MB',
      error: 'File tidak dapat dibaca: {{details}}',
    },
    measure: {
      measureArea: 'Ukur luas',
      barLabel: 'Ukur',
      modes: {
        distance: 'Jarak',
        area: 'Luas',
      },
      hint: 'Klik untuk menambahkan titik, klik ganda untuk menyelesaikan',
      units: 'Satuan',
      unitOptions: {
        auto: 'Otomatis',
        m: 'Meter (m)',
        km: 'Kilometer (km)',
        m2: 'Meter persegi (m²)',
        ha: 'Hektare (ha)',
        km2: 'Kilometer persegi (km²)',
      },
      unitSymbols: {
        m: 'm',
        km: 'km',
        m2: 'm²',
        ha: 'ha',
        km2: 'km²',
      },
      perimeter: 'Keliling {{value}}',
      done: 'Selesai',
    },
    screenshot: {
      quickButton: 'Tangkapan layar',
      title: 'Tangkapan layar peta',
      capture: 'Tangkap',
      captureView: 'Tampilan saat ini',
      capturePlot: 'Sesuaikan dengan plot',
      include: 'Sertakan',
      includeData: 'Penanda dan pengukuran',
      includeScale: 'Batang skala dan panah utara',
      includeStamp: 'Plot, tanggal, koordinat, peta dasar',
      saveTo: 'Simpan ke',
      targetRecord: 'Lampirkan ke catatan plot',
      targetRecordHint: 'Disimpan dalam atribut gambar',
      targetFile: 'Unduh saja',
      targetFileHint: 'File PNG di komputer ini',
      plot: 'Catatan plot',
      attribute: 'Atribut gambar',
      fileName: 'Nama file',
      mobileNote:
        'Hanya atribut gambar dari plot yang dicantumkan. Tim lapangan dapat melihat gambar ini di Arena Mobile setelah catatan diunduh ke perangkat mereka.',
      noPlots:
        'Tidak ada plot dalam tampilan peta. Untuk melampirkan gambar ke catatan plot, tampilkan lapisan lokasi di tab Lapisan dan pindahkan peta ke sebuah plot.',
      noImageAttributes:
        'Plot ini tidak memiliki atribut gambar yang dapat disunting yang mengizinkan tangkapan layar (aktifkan "Izinkan penyimpanan tangkapan layar di tampilan peta" di perancang formulir).',
      previewLoading: 'Menyiapkan pratinjau…',
      previewAlt: 'Pratinjau tangkapan layar peta',
      alsoDownload: 'Unduh juga',
      downloadPng: 'Unduh PNG',
      saving: 'Menyimpan…',
      replace: 'Ganti',
      keep: 'Pertahankan gambar saat ini',
      confirmReplace: 'Atribut ini sudah berisi gambar "{{fileName}}". Ganti dengan tangkapan layar?',
      saved:
        'Tangkapan layar disimpan ke {{plot}} › {{attribute}}. Tim lapangan akan menerimanya pada unduhan catatan berikutnya.',
      savedPending: 'Tangkapan layar dikirim ke {{plot}}. Catatan masih diperbarui: periksa sebentar lagi.',
      notices: {
        mapHidden: 'Peta tersembunyi di layar ini. Tutup panel samping atau perlebar jendela, lalu coba lagi.',
        tilesMissing: 'Tile peta yang tidak disertakan (servernya tidak mengizinkan, atau tidak termuat): {{count}}',
        equalEarth: 'Peta dasar Equal Earth tidak dapat ditangkap. Pilih peta dasar lain di menu Peta dasar.',
      },
      errors: {
        captureFailed: 'Tidak dapat menangkap peta: {{details}}',
        cannotEditRecord: 'Anda tidak dapat menyunting catatan ini (atau survei belum diterbitkan).',
        fileTooLarge: 'Gambar berukuran {{size}} MB, melebihi {{limit}} MB yang diizinkan untuk atribut ini.',
        quotaExceeded: 'Ruang file yang tersedia di survei ini tidak cukup untuk gambar tersebut.',
        plotNotFound: 'Plot tidak ditemukan di catatan. Plot mungkin telah dihapus.',
        saveFailed: 'Tangkapan layar tidak disimpan: {{details}}',
        fileNameRequired: 'Masukkan nama file.',
        rowNotConfirmed:
          'Baris baru untuk gambar tidak terkonfirmasi tepat waktu, sehingga tangkapan layar tidak disimpan. Periksa catatan sebelum mencoba lagi.',
        notApplicable: 'Gambar tidak dapat ditambahkan: atribut tidak berlaku di plot ini.',
        clearsOtherValues:
          'Tangkapan layar tidak disimpan: menambahkannya akan mengosongkan nilai di bidang lain catatan. Tambahkan dari editor catatan sebagai gantinya.',
      },
    },
  },

  samplingPolygonOptions: {
    circle: 'Lingkaran',
    controlPointOffsetEast: 'Offset Titik Referensi ke Timur (m)',
    controlPointOffsetNorth: 'Offset Titik Referensi ke Utara (m)',
    lengthLatitude: 'Panjang Lintang (m)',
    lengthLongitude: 'Panjang Bujur (m)',
    numberOfControlPoints: 'Jumlah Titik Kontrol',
    numberOfPointsEast: 'Jumlah Titik Kontrol ke Timur',
    numberOfPointsNorth: 'Jumlah Titik Kontrol ke Utara',
    offsetEast: 'Offset ke Timur (m)',
    offsetNorth: 'Offset ke Utara (m)',
    radius: 'Radius (m)',
    rectangle: 'Persegi panjang',
    samplingPolygon: 'Poligon Sampel',
    shape: 'Bentuk',
  },

  surveysView: {
    chains: 'Rantai',
    confirmUpdateSurveyOwner: `Ubah pemilik survei "{{surveyName}}" menjadi "{{ownerName}}"?`,
    cycles: 'Siklus',
    datePublished: 'Tanggal diterbitkan',
    editUserExtraProps: 'Sunting properti tambahan pengguna',
    editUserExtraPropsForSurvey: 'Sunting properti tambahan pengguna untuk survei "{{surveyName}}"',
    filter: 'Filter',
    filterPlaceholder: 'Filter menurut nama, label, atau pemilik',
    languages: 'Bahasa',
    nodes: 'Node',
    noSurveysMatchingFilter: 'Tidak ada survei yang cocok dengan filter yang ditentukan',
    onlyOwn: 'Hanya survei sendiri',
    records: 'Catatan',
    recordsCreatedWithMoreApps: 'Catatan yang dibuat dengan aplikasi lain:',
    status: {
      published: 'Diterbitkan',
      draft: 'Draf',
      'published-draft': 'Diterbitkan/Draf',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Diterima',
      CREATED: 'Tertunda',
      SELF_REGISTERED: 'Mendaftar sendiri',
    },
    acceptedBy: 'Diterima oleh',
    dateAccepted: 'Tanggal diterima',
    createdSurvey: 'Survei yang dibuat',
    acceptRequest: {
      accept: 'Terima',
      acceptRequestAndCreateSurvey: 'Terima permintaan dan buat survei',
      confirmAcceptRequestAndCreateSurvey:
        'Terima permintaan akses untuk **{{email}}** sebagai **{{role}}** dan buat survei baru **{{surveyName}}**?',
      error: 'Kesalahan saat menerima permintaan akses: {{error}}',
      requestAcceptedSuccessfully: 'Permintaan akses berhasil diterima. $t(common.emailSentConfirmation)',
      surveyLabelInitial: '(Ubah nama dan label survei sesuai kebutuhan)',
      surveyName: 'Nama Survei',
      newSurvey: 'Survei baru',
      requestDetails: 'Detail permintaan',
      template: 'Templat',
    },
  },
  userView: {
    scale: 'Skala',
    rotate: 'Putar',
    dragAndDrop: 'Letakkan gambar di atas atau',
    upload: 'Unggah',
    remove: 'Hapus foto profil?',
    sendNewInvitation: 'Kirim undangan baru',
    removeFromSurvey: 'Hapus dari survei',
    confirmRemove: 'Apakah Anda yakin ingin mencabut akses {{user}} dari survei {{survey}}?',
    removeUserConfirmation: 'Pengguna {{user}} telah dihapus dari survei {{survey}}',
    maxSurveysUserCanCreate: 'Jumlah maks. survei yang dapat dibuat pengguna',
    preferredUILanguage: {
      label: 'Bahasa antarmuka pilihan',
      auto: 'Terdeteksi otomatis ({{detectedLanguage}})',
    },
    newPassword: 'Kata sandi',
    confirmPassword: 'Konfirmasi kata sandi',
    manageTwoFactorDevices: {
      label: 'Kelola 2FA',
      title: 'Kelola Perangkat Autentikasi Dua Faktor',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Mengubah kata sandi untuk pengguna: {{user}}',
    oldPassword: 'Kata sandi lama',
    newPassword: 'Kata sandi baru',
    confirmPassword: 'Konfirmasi kata sandi baru',
    changePassword: 'Ubah kata sandi',
    passwordChangedSuccessfully: 'Kata sandi berhasil diubah!',
    notAuthorizedToChangePasswordOfAnotherUser: 'Anda tidak berwenang mengubah kata sandi pengguna lain',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Undang pengguna {{email}} sebagai Administrator Sistem?',
    confirmInviteSystemAdmin_other: 'Undang pengguna {{email}} sebagai Administrator Sistem?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}} alamat telah dilewati (alamat tersebut sudah pernah diundang ke survei ini sebelumnya): {{skippedEmails}}`,
    invalidEmailsWarning: `Alamat email {{emails}} tidak dapat dihubungi dan mungkin tidak ada. Alamat ini tetap disimpan di daftar di bawah: harap perbaiki atau hapus, lalu coba undang lagi.`,
    invalidEmailsWarning_other: `Alamat email {{emails}} tidak dapat dihubungi dan mungkin tidak ada. Alamat-alamat ini tetap disimpan di daftar di bawah: harap perbaiki atau hapus, lalu coba undang lagi.`,
    groupPermissions: {
      label: 'Izin',
      systemAdmin: `
        <li>Hak akses sistem penuh</li>`,
      surveyManager: `
        <li>Survei:
          <ul>
            <li>membuat</li>
            <li>mengklon</li>
            <li>menyunting survei sendiri</li>
            <li>menghapus survei sendiri</li>
          </ul>
        </li>
        <li>Pengguna:
          <ul>
            <li>mengundang pengguna ke survei sendiri</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Survei:
          <ul>
            <li>mengklon</li>
            <li>menyunting survei sendiri</li>
            <li>menghapus survei sendiri</li>
          </ul>
        </li>
        <li>Pengguna:
          <ul>
            <li>mengundang pengguna ke survei sendiri</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Survei:
          <ul>
            <li>menyunting survei sendiri</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Data:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>mengakses alat Peta</li>
          </ul>
        </li>
        <li>Analisis:
          <ul>
            <li>hak akses penuh ke semua alat</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Data:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>mengakses alat Validasi data</li>
        <li>mengirim catatan ke fase “Analisis”</li>`,
      dataEditor: `
        <li>Data:
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>menambahkan catatan baru (survei sendiri)</li>
        <li>menyunting catatan yang ada (survei sendiri)</li>
        <li>mengirim catatan ke fase “Pembersihan”</li>`,
      surveyGuest: `
        <li>Data:
          <ul>
            <li>melihat catatan (survei sendiri), tanpa menyuntingnya</li>
          </ul>
        </li>`,
    },
    messageOptional: 'Pesan (opsional)',
    messageInfo: `Pesan akan muncul di email yang dikirim ke pengguna.
Pesan dapat berupa teks biasa atau bahasa Markdown (https://www.markdownguide.org).`,
    sendInvitation: 'Kirim undangan',
    surveyNotPublishedWarning: `**Peringatan**: survei belum diterbitkan.
      Pengguna hanya dapat diundang dengan peran ***$t(auth:authGroups.systemAdmin.label)*** dan ***$t(auth:authGroups.surveyAdmin.label)***.
      Jika Anda ingin mengundang pengguna dengan peran lain, Anda harus menerbitkan survei terlebih dahulu.`,
    typeEmail: 'Ketik alamat email, lalu tekan tombol Tambah',
  },
  user: {
    mapApiKeys: {
      title: 'Kunci API Peta',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'Kunci API ini valid',
      keyIsNotCorrect: 'Kunci API ini TIDAK valid',
    },
    title: 'Sapaan',
    titleValues: {
      mr: 'Bapak',
      ms: 'Ibu',
      preferNotToSay: 'Memilih untuk tidak menyebutkan',
    },
  },
  chainView: {
    baseUnit: {
      confirmDelete:
        'Dengan menghapus unit dasar, Anda akan membatalkan semua pilihan "variabel berbasis area". Lanjutkan?',
    },
    downloadSummaryJSON: 'Unduh Ringkasan (JSON)',
    mauFile: {
      upload: 'Unggah MAU.zip',
      download: 'Unduh MAU.zip',
      delete: 'Hapus MAU.zip',
      confirmCycleAssociation:
        'File MAU.zip akan dikaitkan dengan siklus saat ini ({{cycle}}). Apakah Anda ingin melanjutkan?',
      confirmReplace: 'File MAU.zip sudah diunggah untuk rantai ini. Apakah Anda ingin menggantinya?',
      confirmDelete: 'Hapus file MAU.zip yang diunggah untuk rantai ini?',
      uploadComplete: 'File MAU.zip berhasil diunggah',
      deleteComplete: 'File MAU.zip dihapus',
      invalidFileExtension: 'Silakan pilih file .zip',
    },
    phase1Category: 'Kategori fase ke-1',
    phase1CategoryInfo: 'Pilih kategori yang berisi sampel fase pertama.',
    phase2JoinEntity: {
      label: 'Entitas penggabung (fase ke-2)',
      info: 'Entitas yang digunakan untuk menggabungkan unit dasar dengan kategori fase ke-1: entitas unit dasar itu sendiri, atau salah satu entitas induknya.',
    },
    phase2AsSamplingPointData: {
      label: 'Gabungkan menggunakan tautan Data Titik Sampel',
      info: 'Kunci entitas fase kedua dibaca dari tabel Data Titik Sampel, yaitu tabel yang sama yang digunakan untuk fase pertama.',
    },
    phase1JoinAttribute: {
      label: 'Atribut penggabung (fase ke-1)',
      info: 'Pilih kolom tabel $t(chainView.phase1Category) (properti tambahan, atau "code") yang digunakan untuk menggabungkannya dengan entitas penggabung fase ke-2.',
    },
    phase2JoinAttribute: {
      label: 'Atribut penggabung (fase ke-2)',
      info: `Pilih atribut (dari entitas fase ke-2) untuk digabungkan dengan tabel fase ke-1; nilainya dicocokkan dengan atribut penggabung fase ke-1 sebelumnya.`,
    },
    formLabel: 'Label rantai pemrosesan',
    basic: 'Dasar',
    records: 'Catatan',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Kirim hanya data tahap analisis ke RStudio',
    submitOnlySelectedRecordsIntoR: 'Kirim hanya catatan yang dipilih ke RStudio',
    includeEntitiesWithoutData: 'Sertakan entitas tanpa data',
    cannotStartRStudio: {
      common: 'Tidak dapat memulai RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): tidak ada catatan untuk dikirim',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): terbitkan survei terlebih dahulu',
    },
    nonResponseBiasCorrection: 'Koreksi bias non-respons',
    nonResponseBiasCorrectionInfo: `Untuk menerapkan metode Weighting Class Adjustment, tambahkan 'design_psu' dan 'design_ssu' ke tabel kategori strata sebagai properti numerik tambahan`,
    pValue: 'Nilai-P',
    resultsBackFromRStudio: 'Hasil dibaca kembali dari RStudio',
    resultsBackFromRStudioInfo: `Aktifkan opsi ini jika atribut hasil yang dihitung di RStudio harus diimpor kembali ke server Arena.
Proses ini mungkin lambat.`,
    samplingDesign: 'Desain Sampling',
    samplingDesignDetails: 'Detail Desain Sampling',
    samplingStrategyLabel: 'Strategi sampling',
    samplingStrategy: {
      simpleRandom: 'Sampling Acak Sederhana',
      systematic: 'Sampling Sistematis',
      stratifiedRandom: 'Sampling Acak Berstrata',
      stratifiedSystematic: 'Sampling Sistematis Berstrata',
      twoPhase: 'Sampling Dua Fase',
    },
    statisticalAnalysis: {
      header: 'Analisis statistik',
      entityToReport: 'Entitas yang dilaporkan',
      entityWithoutData: 'Entitas {{name}} tidak memiliki data',
      filter: 'Filter (skrip R)',
      reportingMethod: 'Metode pelaporan',
      reportingMethods: {
        dimensionsCombined: 'Kombinasi dimensi',
        dimensionsSeparate: 'Dimensi secara terpisah',
      },
      reportingArea: 'Total area pelaporan (ha) (Opsional)',
      reportingAreaInfo: `Dengan sampling berstrata, berikan luas strata di tabel kategori atribut strata (nama kolom 'area')`,
    },
    stratumAttribute: 'Atribut strata',
    stratumAttributeInfo: 'Pilih variabel yang digunakan untuk membuat strata sampel.',
    stratumAttribute2ndPhaseInfo:
      'Pilih variabel yang digunakan untuk membuat sub-strata sampel fase pertama sebelum mengambil subsampel akhir yang terperinci. Hanya atribut yang namanya juga muncul sebagai kolom kategori fase ke-1 yang ditampilkan.',
    postStratificationAttribute: 'Atribut pasca-stratifikasi',
    areaWeightingMethod: 'Metode Pembobotan Area',
    clusteringEntity: 'Entitas klaster',
    clusteringEntityInfo:
      'Entitas yang mendefinisikan unit sampling primer. Catatan: Ini digunakan khusus untuk analisis klaster dalam kerangka paket R survey.',
    clusteringOnlyVariances: 'Klaster hanya untuk varians',
    errorNoLabel: 'Rantai harus memiliki Label yang valid',
    dateExecuted: 'Tanggal dijalankan',
    deleteChain: 'Hapus rantai',
    deleteConfirm: `Hapus rantai pemrosesan ini?

$t(common.cantUndoWarning)`,
    deleteComplete: 'Rantai pemrosesan dihapus',
    cloneFromAnotherSurvey: 'Klon dari survei lain',
    cloneFromAnotherSurveyDialog: {
      title: 'Klon rantai dari survei lain',
      sourceSurvey: 'Survei sumber',
      sourceChain: 'Rantai sumber',
      entityCheck: 'Kompatibilitas entitas',
      entityMissing: 'tidak ada di survei tujuan',
      skipMissingEntities: 'Lewati atribut analisis untuk entitas yang tidak ada di survei tujuan',
      noAnalysisAttributes: 'Rantai ini tidak memiliki atribut analisis',
      cloneComplete: 'Rantai berhasil diklon',
      missingEntities: 'Tidak dapat mengklon: entitas berikut tidak ada di survei tujuan: {{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles: `Definisi node "{{label}}" tidak dapat dipilih karena tidak termasuk dalam semua siklus rantai pemrosesan`,
    cannotSelectCycle: 'Siklus ini tidak dapat dipilih karena beberapa definisi node tidak termasuk dalam siklus ini',
    copyRStudioCode: `#### Anda akan membuka RStudio Server ####

##### Klik tombol OK dan perintah-perintah ini akan disalin ke papan klip Anda. #####

###### RStudio Server akan dibuka; setelah konsol RStudio aktif, tempel dan jalankan baris berikut untuk mengimpor kode rantai: ######

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Rantai pemrosesan ke RStudio ####

###### Klik tombol OK dan perintah-perintah ini akan disalin ke papan klip Anda. ######

###### Jalankan RStudio di komputer Anda (paket 'rstudioapi' harus sudah terpasang). ######

###### Setelah konsol RStudio aktif, tempel dan jalankan baris berikut untuk mengimpor kode rantai: ######


{{rStudioCode}}

`,
    entities: {
      new: 'Entitas virtual',
    },
    reportingDataCategory: 'Nama tabel kategori',
    reportingDataAttribute: 'Atribut untuk {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Tabel data pelaporan dan penggabungan dengan atribut',
    showSamplingAttributes: 'Tampilkan atribut sampling',
  },
  instancesView: {
    title: '$t(appModules.instances)',
    terminate: 'Hentikan',
    noSessionRunning: 'Tidak ada sesi RStudio yang berjalan.',
    noSessionRunningHint: 'Mulai sesi dari rantai pemrosesan, menggunakan tombol RStudio.',
  },
  chain: {
    quantitative: 'Kuantitatif',
    categorical: 'Kategoris',
    addQuantitative: 'Tambahkan atribut kuantitatif',
    addCategorical: 'Tambahkan atribut kategoris',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts: 'entitas dan semua variabel hasil terkait akan dikecualikan dari skrip RStudio',
    entityWithoutData: 'Entitas {{name}} tidak memiliki data; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'Entitas {{name}} tidak tersedia di siklus yang dipilih; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Token tidak valid atau kedaluwarsa',
    },
  },
  itemsTable: {
    unused: 'Tidak digunakan',
    noItemsAdded: 'Belum ada item yang ditambahkan',
    selectedItemsCount: '{{count}} item dipilih',
    selectedItemsCount_other: '{{count}} item dipilih',
  },
  expression: {
    areaOfInterestNotFound: 'Area minat "{{name}}" tidak ditemukan: tentukan di Info Survei → Peta',
    functionHasTooFewArguments: 'Fungsi {{fnName}} memerlukan setidaknya {{minArity}} argumen (diberikan {{numArgs}})',
    functionHasTooManyArguments:
      'Fungsi {{fnName}} hanya menerima paling banyak {{maxArity}} argumen (diberikan {{numArgs}})',
    identifierNotFound: 'Atribut atau entitas "{{name}}" tidak ditemukan',
    invalid: 'Ekspresi tidak valid: {{details}}',
    invalidAttributeValuePropertyName: 'Nama properti nilai atribut tidak valid: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Nama properti tambahan tidak valid: {{propName}}',
    invalidCategotyName: 'Nama kategori tidak valid: {{name}}',
    invalidTaxonomyExtraProp: 'Nama properti tambahan taksonomi tidak valid: {{propName}}',
    invalidTaxonomyName: 'Nama taksonomi tidak valid: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Kode bahasa nama lokal takson tidak valid: {{vernacularLangCode}}',
    missingFunctionParameters: 'Parameter fungsi tidak lengkap',
    notSupported: 'Ekspresi tidak didukung: periksa sintaksisnya (mis. operator yang hilang di antara dua nilai)',
    undefinedFunction: 'Fungsi tidak terdefinisi: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
Tentang
========

$t(common.appNameFull)
--------

 * Dikembangkan oleh: $t(links.openforis)
 * Versi: {{version}}
 * Situs web: $t(links.openforisArenaWebsite)
 * Video tutorial Arena di FAO elearning Academy: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Video tutorial Arena di YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Forum Dukungan: $t(links.supportForum)
 * Arena di GitHub: $t(links.arenaInGitHub)
 * Skrip R Arena di GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Bahasa',
  },
  taxonomy: {
    header: 'Taksonomi',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'Taksonomi'})`,
    confirmDelete: 'Hapus taksonomi {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Klon Taksonomi dari Survei Lain',
      sourceSurvey: 'Survei sumber',
      sourceTaxonomy: 'Taksonomi sumber',
      loadingSurveys: 'Memuat survei...',
      noSurveysAvailable: 'Tidak ada survei yang tersedia',
      selectSurveyFirst: 'Pilih survei terlebih dahulu',
      loadingTaxonomies: 'Memuat taksonomi...',
      noTaxonomiesAvailable: 'Tidak ada taksonomi yang tersedia di survei yang dipilih',
    },
    edit: {
      taxonomyListName: 'Nama daftar taksonomi',
      taxaNotImported: 'Takson tidak diimpor',
      family: 'Famili',
      genus: 'Genus',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Sinonim / Latin',
      extraPropsNotDefined: 'Properti tambahan tidak didefinisikan untuk taksonomi ini',
      importMissingPublishedTaxa:
        '{{count}} takson yang sudah diterbitkan tidak ditemukan di file yang diimpor: dibiarkan tidak berubah, setelah takson yang diimpor. Kode: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} lainnya)',
    },
    taxaCount: 'Jumlah takson',
    vernacularNameLabel: 'Label nama lokal',
  },
  categoryList: {
    batchImport: 'Impor kategori secara massal (dari ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} kategori berhasil diimpor!
{{insertedCategories}} baru
{{updatedCategories}} diperbarui`,
    cloneFromAnotherSurvey: {
      title: 'Klon Kategori dari Survei Lain',
      sourceSurvey: 'Survei sumber',
      sourceCategory: 'Kategori sumber',
      loadingSurveys: 'Memuat survei...',
      noSurveysAvailable: 'Tidak ada survei yang tersedia',
      selectSurveyFirst: 'Pilih survei terlebih dahulu',
      loadingCategories: 'Memuat kategori...',
      noCategoriesAvailable: 'Tidak ada kategori yang tersedia di survei yang dipilih',
    },
    itemsCount: 'Jumlah item',
    structure: 'Struktur',
    types: {
      flat: 'Datar',
      hierarchical: 'Hierarkis',
      reportingData: 'Data Pelaporan',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Data Titik Sampel',
    },
  },
  categoryEdit: {
    header: 'Kategori',
    addLevel: 'Tambah tingkat',
    categoryName: 'Nama kategori',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'Kategori'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'Tingkat kategori'})`,
    confirmDelete: 'Hapus kategori {{categoryName}}?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'Kategori ini **kosong** dan akan dihapus. Lanjutkan?',
    confirmDeleteLevel: `Hapus tingkat kategori '{{levelName}}' beserta semua itemnya?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Hapus item?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Hapus item beserta semua turunannya?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Konversi ke Data Pelaporan',
      confirmMessage: `Konversi kategori ini menjadi kategori Data Pelaporan?

Tingkat akan diganti namanya menjadi level_1, level_2... level_N dan properti tambahan 'area' akan ditambahkan ke item.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Konversi kategori Data Pelaporan ini menjadi kategori sederhana?`,
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Konversi ke Data Titik Sampel',
      confirmMessage: `Konversi kategori ini menjadi kategori Data Titik Sampel?

Kategori akan diganti namanya menjadi '${samplingPointDataCategoryName}' dan properti tambahan '${locationItemExtraDefName}' akan ditambahkan ke item.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Konversi ke kategori GeoPackage',
      confirmMessage: `Konversi kategori ini menjadi kategori GeoPackage?

Properti tambahan '${locationItemExtraDefName}' akan ditambahkan ke item.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Konversi ke kategori sederhana',
      confirmMessage: `Konversi kategori GeoPackage ini menjadi kategori sederhana?

Properti tambahan '${locationItemExtraDefName}' akan dibuka kuncinya, sehingga dapat diganti namanya, diubah tipenya, atau dihapus seperti properti tambahan lainnya. Datanya tidak terpengaruh.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Konversi ke kategori sederhana',
      confirmMessage: `Konversi kategori Data Titik Sampel ini menjadi kategori sederhana?

Nama kategori akan dikosongkan (Anda perlu memberinya nama baru), dan properti tambahan '${locationItemExtraDefName}' akan dibuka kuncinya, sehingga dapat diganti namanya, diubah tipenya, atau dihapus seperti properti tambahan lainnya. Datanya tidak terpengaruh.`,
    },
    geoPackageCategory: 'Kategori ini memiliki kemampuan geo',
    geoPackageCategoryInfo: `Kategori ini memiliki properti tambahan bernama '${locationItemExtraDefName}', yang memungkinkannya diekspor sebagai file GeoPackage.`,
    samplingPointDataCategoryType: 'Ini adalah kategori Data Titik Sampel',
    samplingPointDataCategoryTypeInfo: `Ini adalah kategori bawaan untuk data titik sampel. Kategori ini memiliki properti tambahan bernama '${locationItemExtraDefName}', yang memungkinkannya diekspor sebagai file GeoPackage.`,
    samplingPointDataCategoryLocationMissing: `Properti tambahan '${locationItemExtraDefName}' tidak ada`,
    createCategory: {
      menuLabel: 'Tambah kategori',
      simple: 'Kategori sederhana',
      otherTypes: 'Tipe kategori lainnya',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Kategori Data Titik Sampel',
      description: 'Kategori bawaan untuk data titik sampel, termasuk bidang lokasi untuk setiap item.',
      message: `Buat kategori Data Titik Sampel baru?

Properti tambahan '${locationItemExtraDefName}' akan ditambahkan ke item.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Kategori dengan kemampuan geo',
      description: 'Menambahkan bidang lokasi ke item, sehingga kategori dapat diekspor sebagai file GeoPackage.',
      message: `Buat kategori baru dengan kemampuan geo?

Properti tambahan '${locationItemExtraDefName}' akan ditambahkan ke item.`,
    },
    deleteItem: 'Hapus item',
    level: {
      title: 'Tingkat {{levelPosition}}',
      noItemsDefined: 'Belum ada item yang didefinisikan',
      selectItemFromPreviousLevel: 'Pilih item dari tingkat sebelumnya',
    },

    importSummary: {
      columns: 'Kolom',
      columnTypeSummary: 'Tingkat {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Deskripsi ({{language}})',
      columnTypeLabel: 'Label ({{language}})',
      columnType: {
        code: 'kode',
        description: 'deskripsi',
        label: 'label',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Tipe Data',
      title: 'Ringkasan impor kategori',
    },
    reportingData: 'Data pelaporan',
    exportToGeoPackage: 'Ekspor ke GeoPackage',
    exportToGeoPackageSkippedItems: '{{count}} item tanpa lokasi yang valid dilewati.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Buat analisis Whisp',
      confirmMessage: `Buat analisis Whisp untuk semua titik sampel?

- setiap titik sampel yang memiliki lokasi akan dikirim ke Open Foris Whisp untuk dianalisis
- hasilnya akan digabungkan dengan data titik sampel dan disimpan di kategori '${samplingPointDataWhispCategoryName}'
- jika kategori '${samplingPointDataWhispCategoryName}' sudah ada, isinya akan diganti
- analisis berjalan di latar belakang dan dapat memakan waktu beberapa menit, tergantung jumlah titik sampel`,
    },
    templateFor_samplingPointDataImport_csv: 'Templat untuk impor Data Titik Sampel (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Templat untuk impor Data Titik Sampel (Excel)',
  },
  extraProp: {
    label: 'Properti tambahan',
    label_other: 'Properti tambahan',
    addExtraProp: 'Tambah properti tambahan',
    dataTypes: {
      geometryPoint: 'Titik Geometri',
      number: 'Angka',
      text: 'Teks',
    },
    editor: {
      title: 'Sunting $t(extraProp.label_other)',
      confirmDelete: 'Hapus properti tambahan "{{name}}"?',
      confirmSave: `Simpan perubahan pada definisi properti tambahan?

  **Peringatan**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Nama diubah dari {{nameOld}} menjadi {{nameNew}}',
        dataTypeChanged: 'Tipe data diubah dari {{dataTypeOld}} menjadi {{dataTypeNew}}',
      },
    },
    name: 'Nama properti {{position}}',
    value: 'Nilai',
  },
  record: {
    ancestorNotFound: 'Node leluhur tidak ditemukan di catatan',
    keyDuplicate: 'Kunci catatan duplikat',
    oneOrMoreInvalidValues: 'Satu atau beberapa nilai tidak valid',
    uniqueAttributeDuplicate: 'Nilai duplikat',

    attribute: {
      customValidation: 'Nilai tidak valid',
      uniqueDuplicate: 'Nilai duplikat',
      valueInvalid: 'Nilai tidak valid',
      valueRequired: 'Nilai wajib diisi',
    },
    entity: {
      keyDuplicate: 'Kunci entitas duplikat',
    },
    nodes: {
      count: {
        invalid: 'Node {{nodeDefName}} harus tepat berjumlah {{count}}',
        maxExceeded: 'Node {{nodeDefName}} harus berjumlah kurang dari atau sama dengan {{maxCount}}',
        minNotReached: 'Node {{nodeDefName}} harus berjumlah lebih dari atau sama dengan {{minCount}}',
      },
    },
  },

  // ====== Common components
  expressionEditor: {
    and: 'DAN',
    or: 'ATAU',
    group: 'Grup ()',
    var: 'Variabel',
    ancestorEntities: 'Entitas leluhur',
    node: 'Node (atribut atau entitas)',
    const: 'Nilai konstan',
    call: 'Fungsi',
    operator: 'Operator',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Atribut koordinat asal',
      distanceAttribute: 'Atribut jarak',
      bearingAttribute: 'Atribut arah (bearing)',
    },
    areaOfInterestEditor: {
      areaOfInterest: 'Area minat',
      areasOfInterestNotDefined: 'Belum ada area minat yang didefinisikan: tentukan di Info Survei → Peta',
    },
    coordinateAttribute: 'Atribut koordinat',
    coordinateAttributeWithPosition: 'Atribut koordinat {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Atribut tanggal pertama',
      firstTimeAttribute: 'Atribut waktu pertama',
      secondDateAttribute: 'Atribut tanggal kedua',
      secondTimeAttribute: 'Atribut waktu kedua',
    },
    error: {
      selectOneVariable: 'Silakan pilih satu variabel',
    },

    header: {
      editingExpressionForNodeDefinition: 'Menyunting ekspresi {{qualifier}} untuk "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Menyunting fungsi "{{functionName}}" untuk "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'nilai bawaan',
      'default-values-apply-if': 'nilai bawaan berlaku jika',
      'editable-if': 'dapat disunting jika',
      'max-count': 'jumlah maks.',
      'min-count': 'jumlah min.',
      'relevant-if': 'relevan jika',
      validations: 'aturan validasi',
      'validations-apply-if': 'aturan validasi berlaku jika',
      'visible-if': 'visibilitas',
    },

    selectAFunction: 'Pilih fungsi',

    valueType: {
      constant: 'Konstanta',
      expression: 'Ekspresi',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>`,
    arenaVideoTutorialsInFaoElearningAcademy: `<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>`,
    arenaVideoTutorialsInYouTube: `<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>`,
    arenaInGitHub: `<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>`,
    arenaRScriptsInGitHub: `<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>`,
  },
  aiExpression: {
    title: 'Buat ekspresi dari deskripsi',
    hint: 'Jelaskan dengan bahasa sehari-hari apa yang harus dilakukan ekspresi. AI akan menerjemahkannya ke sintaksis Arena. Tekan Ctrl+Enter untuk membuat.',
    placeholder: 'mis. tinggi pohon harus lebih besar dari 0 dan kurang dari 200',

    generate: 'Buat',
    generating: 'Membuat…',
    use: 'Gunakan ekspresi ini',
    useAnyway: 'Tetap gunakan',
    tryAgain: 'Coba deskripsi lain',
    parseError:
      'Ekspresi yang dibuat tidak dapat diurai dengan benar: {{message}}. Anda tetap dapat menerapkannya dan menyuntingnya secara manual, atau coba ubah susunan kalimatnya.',

    explain: {
      title: 'Jelaskan ekspresi ini',
      thinking: 'Meminta AI untuk menjelaskan ekspresi ini…',
      error: 'Gagal mengambil penjelasan: {{message}}',
      timeout: 'AI terlalu lama merespons. Silakan coba lagi.',
    },
  },

  aiBatch: {
    translateTitle: 'AI: Terjemahkan label',
    dataDictionaryTitle: 'AI: Deskripsi bidang',
    preparing: 'Menyiapkan…',
    progress: '{{done}} dari {{total}} permintaan AI selesai',
    stop: 'Hentikan',
    stopping: 'Menghentikan…',
    confirmStop: 'Hentikan proses AI? Hasil yang sudah ada tetap disimpan.',
    keepRunning: 'Tetap jalankan',
    stoppedCancelled: 'Dihentikan setelah {{done}} dari {{total}} permintaan AI. Hasil yang sudah ada tetap disimpan.',
    stoppedError:
      'Dihentikan setelah {{done}} dari {{total}} permintaan AI ({{message}}). Hasil yang sudah ada tetap disimpan.',
  },

  aiTranslation: {
    translateButton_other: 'Terjemahkan ke {{count}} bahasa lain',
    translateButton: 'Terjemahkan ke bahasa lain',

    success_other: 'Diterjemahkan ke {{count}} bahasa. Tinjau dan simpan.',
    success: 'Diterjemahkan. Tinjau dan simpan.',

    failed: 'Terjemahan gagal: {{message}}',
    sourceChanged: 'Teks berubah saat sedang diterjemahkan, sehingga terjemahan tidak diterapkan.',
  },
  aiActivityLog: {
    title: 'Ringkasan log aktivitas',
    summarizeButton: 'Ringkas',
    thinking: 'Mengumpulkan peristiwa dan meminta AI untuk meringkas…',
    error: 'Gagal mengambil ringkasan: {{message}}',
  },

  aiEngine: {
    unavailableTitle: 'Tidak tersedia',
    unavailable: {
      policyForbids: 'Kebijakan AI survei tidak mengizinkan penyedia ini untuk data ini.',
      notAvailable: 'Penyedia AI yang dipilih sedang tidak tersedia.',
      missingOnThisBrowser: 'Penyedia bawaan Anda berada di komputer lain.',
      notSetUp: 'Belum ada penyedia AI yang diatur. Tambahkan di pengaturan AI Anda.',
      invalidAddress:
        'Alamat server AI lokal Anda tidak valid (tanpa nama pengguna, kata sandi, ? atau #). Perbaiki di pengaturan AI Anda.',
    },
    localAddressInvalid: 'Alamat tidak boleh berisi nama pengguna, kata sandi, ? atau #.',
    action: {
      retry: 'Coba lagi',
      changePolicy: 'Ubah kebijakan AI survei',
      openSettings: 'Buka pengaturan AI',
    },
    consent: {
      title: 'Gunakan server AI lokal Anda?',
      destination: 'Permintaan untuk survei ini akan dikirim ke {{baseUrl}} ({{location}}).',
      destinationNoSurvey: 'Permintaan akan dikirim ke {{baseUrl}} ({{location}}).',
      model: 'Model: {{modelId}}',
      continue: 'Lanjutkan',
      chooseOther: 'Pilih penyedia lain',
      sends: 'Arena akan mengirim {{what}}.',
      revokeHint: 'Anda telah mengizinkan Arena mengirim permintaan ke server ini.',
      revoke: 'Cabut izin',
      revoked: 'Izin dicabut. Arena akan bertanya lagi sebelum permintaan berikutnya.',
    },
  },

  aiAnalysis: {
    area: 'Analisis',
    empty:
      'Tanyakan tentang data survei: misalnya, "Rata-rata tinggi pohon per plot". Saya mengusulkan kueri yang dapat Anda buka di Penjelajah.',
    mapLayerCard: {
      title: 'Lapisan peta {{label}}',
      titleLocation: 'Lokasi peta',
      search: 'Cari: {{text}}',
      showOnMap: 'Tampilkan di peta',
      missing: 'Lapisan ini sudah tidak tersedia.',
      noPermission: 'Anda tidak dapat membuka peta survei ini.',
    },
    queryCard: {
      title: 'Kueri {{queryId}}',
      columns: 'Kolom',
      filter: 'Filter',
      openInExplorer: 'Buka di Penjelajah',
      showAsChart: 'Tampilkan sebagai grafik',
      missing: 'Kueri ini sudah tidak tersedia.',
    },
    recordDataNotice: {
      message: 'Percakapan ini berisi data catatan. Lanjutkan dengan server AI lokal, atau mulai percakapan baru.',
      newConversation: 'Percakapan baru',
    },
  },

  aiCleaning: {
    area: 'Pembersihan',
    empty:
      'Tanyakan kepada saya tentang kesalahan validasi atau nilai yang mencurigakan. Saya mengusulkan suntingan catatan; Anda meninjau dan menerapkannya.',
    rowAction: {
      askAssistant: 'Tanya asisten',
      question: 'Mengapa nilai ini tidak valid, dan bagaimana cara memperbaikinya?',
      busy: 'Asisten masih menjawab. Tunggu hingga selesai atau hentikan terlebih dahulu.',
    },
    card: {
      empty: '(kosong)',
      newErrors: 'Kesalahan baru di catatan ini: {{count}}',
      applySelected: 'Terapkan yang dipilih ({{count}})',
      retryFailed: 'Coba lagi yang gagal ({{count}})',
      applying: 'Menerapkan… {{done}} dari {{total}}',
      counts: 'Diterapkan: {{applied}} · Konflik: {{conflict}} · Gagal: {{failed}}',
    },
    badge: {
      fixes: 'Memperbaiki kesalahan',
      stillInvalid: 'Masih tidak valid',
      noErrors: 'Tidak ada kesalahan',
    },
    result: {
      applied: 'Diterapkan',
      conflict: 'Tidak diterapkan: nilai telah berubah sejak diusulkan',
      failed: 'Gagal: {{message}}',
      skipped: 'Dilewati',
    },
  },
  aiAssistant: {
    open: 'Asisten AI',
    title: 'Asisten AI',
    close: 'Tutup',
    providerChip: {
      answerWith: 'Jawab dengan',
      makeDefault: 'Jadikan bawaan saya',
      manage: 'Kelola penyedia…',
      none: 'Tidak ada penyedia · Tambahkan',
      missing: 'Penyedia bawaan tidak ada di komputer ini',
      removedNotice: 'Penyedia percakapan ini telah dihapus. Menggunakan penyedia bawaan Anda.',
      chooseAnother: 'Pilih penyedia lain',
      defaultFailed: 'Penyedia bawaan tidak dapat diubah: {{message}}',
      title: 'Penyedia AI percakapan ini: {{name}}',
      isDefault: 'bawaan',
    },
    tabs: {
      design: 'Desain',
      help: 'Bantuan',
    },
    unavailable: {
      noSurvey: 'Buka survei untuk menggunakan area ini.',
      policy: 'Kebijakan AI survei tidak mengizinkan penyedia AI yang dikonfigurasi.',
    },
    menu: {
      label: 'Menu asisten',
      newConversation: 'Percakapan baru',
      aiSettings: 'Pengaturan AI…',
      deleteAll: 'Hapus semua percakapan…',
    },
    historyTitle: 'Percakapan',
    newConversationTitle: 'Percakapan baru',
    noSuggestions: 'Tidak ada saran.',
    historyEmpty: 'Tidak ada percakapan tersimpan.',
    historyKept: '{{count}} percakapan terbaru dari setiap survei disimpan di peramban ini sampai Anda menghapusnya.',
    back: 'Kembali',
    deleteAllConfirm:
      'Hapus semua percakapan asisten AI Anda, di setiap survei dan setiap area? Tindakan ini tidak dapat dibatalkan.',
    start: {
      suggestions: 'Saran',
      recent: 'Percakapan terbaru',
      seeAll_other: 'Lihat semua {{count}} percakapan',
      seeAllSuggestions_other: 'Lihat semua {{count}} saran',
    },
    searchConversations: 'Cari percakapan',
    historyNoMatch: 'Tidak ada percakapan yang cocok.',
    deleteConversation: 'Hapus percakapan',
    deleteConversationConfirm: 'Hapus percakapan ini? Tindakan ini tidak dapat dibatalkan.',
    discardConfirm: 'Buang perubahan yang diusulkan ini? Perubahan tersebut tidak akan diterapkan.',
    deleteConversationFailed: 'Percakapan tidak dapat dihapus.',
    deleteAllFailed: 'Percakapan tidak dapat dihapus.',
    day: {
      today: 'Hari ini',
      yesterday: 'Kemarin',
      earlier: 'Sebelumnya',
    },
    sentData: {
      ariaLabel: 'Data yang dikirim: {{label}}',
      questions: {
        label: 'Hanya pertanyaan',
        tooltip: 'Hanya pertanyaan Anda yang dikirim, beserta kutipan dari panduan Arena. Tanpa konten survei.',
      },
      schema: {
        label: 'Desain survei',
        tooltip: 'Desain survei dikirim: entitas, atribut, kategori, dan label. Tanpa data catatan.',
      },
      data: {
        label: 'Data catatan',
        tooltip: 'Data catatan dikirim, bersama dengan desain survei.',
      },
    },
    emptyDesign:
      'Minta saya menambahkan atribut, atau menulis label atau ekspresi. Saya mengusulkan perubahan; Anda menerapkannya.',
    emptyHelp: 'Tanyakan apa saja tentang Open Foris Arena. Saya menjawab berdasarkan panduan pengguna.',
    placeholder: 'Ketik pesan Anda…',
    send: 'Kirim',
    stop: 'Hentikan',
    retry: 'Coba lagi',
    stopped: 'Dihentikan.',
    thinking: 'Berpikir',
    thinkingActive: 'Berpikir…',
    inMemoryOnly:
      'Peramban ini tidak dapat menyimpan percakapan: percakapan akan hilang saat Anda memuat ulang halaman.',
    context: {
      label: 'Konteks yang digunakan oleh percakapan ini',
      tokens: '{{used}} token',
      tokensOfWindow: '{{used}} / {{window}} token',
      assumed: '(diasumsikan)',
      nearLimit: 'Mendekati batas.',
      trimmed: 'Pesan lama tidak lagi dikirim ke model.',
    },
    missingTextsBatch: {
      start_other:
        '{{count}} teks belum tersedia dalam {{lang}}. Saya menerjemahkannya dalam kelompok berisi {{size}}: ini dapat memakan waktu beberapa menit. Anda meninjau terjemahan sebelum ada yang disimpan.',
      summary: 'Terjemahan teks yang belum tersedia dalam {{lang}}',
      done_other: '{{count}} teks diterjemahkan: tinjau di kartu, lalu terapkan.',
      failed_other: '{{count}} teks tidak dapat diterjemahkan.',
      nothing: 'Tidak ada teks untuk diterjemahkan: teks yang belum tersedia tidak diisi dalam bahasa lain mana pun.',
      categoryStart_other:
        '{{count}} label kategori belum tersedia dalam {{lang}}. Saya menerjemahkannya dalam kelompok berisi {{size}}: ini dapat memakan waktu beberapa menit. Anda meninjau terjemahan sebelum ada yang disimpan.',
      categorySummary: 'Terjemahan label kategori yang belum tersedia dalam {{lang}}',
      progressTitle_other: 'Menerjemahkan {{count}} teks ke {{lang}}',
      categoryProgressTitle_other: 'Menerjemahkan {{count}} label kategori ke {{lang}}',
      minutesLeft: 'sekitar {{minutes}} menit lagi',
      lessThanMinuteLeft: 'kurang dari satu menit lagi',
      descriptionsStart_other:
        '{{count}} entri tidak memiliki deskripsi. Saya menulisnya dalam {{lang}}, secara bertahap: ini dapat memakan waktu beberapa menit. Anda meninjau deskripsi sebelum ada yang disimpan.',
      descriptionsDone_other: '{{count}} deskripsi ditulis: tinjau di kartu, lalu terapkan.',
      descriptionsFailed_other: '{{count}} deskripsi tidak dapat ditulis.',
      descriptionsProgressTitle_other: 'Menulis deskripsi untuk {{count}} entri',
      descriptionsSummary: 'Deskripsi untuk entri yang belum memilikinya',
      descriptionsNothing: 'Tidak ada entri untuk dideskripsikan: semuanya sudah memiliki deskripsi.',
    },
    tools: {
      survey_getOverview: 'Membaca struktur survei',
      nodeDef_get: 'Mencari {{name}}',
      nodeDef_search: 'Mencari "{{text}}"',
      survey_getValidation: 'Memeriksa kesalahan desain',
      view_getCurrent: 'Memeriksa tampilan saat ini',
      conversation_setTitle: 'Memberi nama percakapan',
      expression_check: 'Memeriksa ekspresi',
      nodeDef_proposeCreate: 'Menyiapkan item baru',
      nodeDef_proposeUpdate: 'Menyiapkan perubahan properti',
      labels_proposeSet: 'Menyiapkan label',
      missingTexts_translate: 'Menerjemahkan teks yang belum tersedia dalam {{name}}',
      missingTexts_translateRunning: 'Sedang menerjemahkan teks yang belum tersedia dalam {{name}}',
      categoryItemLabels_translate: 'Menerjemahkan label kategori yang belum tersedia dalam {{name}}',
      categoryItemLabels_translateRunning: 'Sedang menerjemahkan label kategori yang belum tersedia dalam {{name}}',
      descriptions_write: 'Menulis deskripsi yang belum ada ({{name}})',
      descriptions_writeRunning: 'Sedang menulis deskripsi yang belum ada ({{name}})',
      expressions_proposeSet: 'Menyiapkan ekspresi',
      survey_listMissingTexts: 'Mencantumkan teks yang belum tersedia',
      categories_list: 'Mencantumkan kategori',
      taxonomies_list: 'Mencantumkan taksonomi',
      docs_search: 'Mencari "{{query}}" di panduan',
      query_listEntities: 'Mencantumkan entitas',
      category_findItems: 'Mencari item kategori',
      query_propose: 'Menyiapkan kueri',
      map_proposeLayer: 'Menyiapkan lapisan peta',
      query_count: 'Menghitung baris kueri',
      query_run: 'Menjalankan kueri',
      records_countByStep: 'Menghitung catatan per tahap',
      records_countOverTime: 'Menghitung catatan dari waktu ke waktu',
      validation_summarize: 'Meringkas kesalahan validasi',
      validation_list: 'Mencantumkan kesalahan validasi',
      record_getValues: 'Membaca nilai catatan',
      records_proposeEdits: 'Menyiapkan suntingan catatan',
      categoryItems_listMissingLabels: 'Mencantumkan label kategori yang perlu diterjemahkan',
      categoryItemLabels_proposeSet: 'Menyiapkan label kategori',
      default: 'Menggunakan alat',
      failed: 'Gagal',
      interrupted: 'Terputus',
    },
    card: {
      title: 'Perubahan yang diusulkan',
      stale: 'Survei telah berubah sejak usulan ini dibuat.',
      reason: {
        nodeDefMissing: 'Atribut atau entitas ini sudah tidak ada.',
        valueChanged: 'Nilai saat ini berbeda dengan nilai awal usulan ini.',
        parentMissing: 'Entitas induk sudah tidak ada.',
        nameTaken: 'Atribut atau entitas lain sudah menggunakan nama ini.',
        alreadyExists: 'Atribut atau entitas ini sudah ada.',
        refMissing: 'Kategori atau taksonomi yang akan ditetapkan sudah tidak ada.',
        itemMissing: 'Item kategori ini sudah tidak ada.',
        surveyDirty: 'Survei memiliki suntingan yang belum disimpan.',
        surveyChanged: 'Survei lain dibuka sementara itu.',
        dependencyNotApplied: 'Perubahan ini bergantung pada perubahan yang tidak diterapkan.',
        notSupported: 'Jenis perubahan ini tidak dapat diterapkan di sini.',
        missingResult: 'Server tidak memberikan jawaban untuk perubahan ini.',
      },
      applySelected: 'Terapkan yang dipilih',
      applying: 'Menerapkan… {{done}} dari {{total}}',
      discard: 'Buang',
      discarded: 'Dibuang.',
      applyFailed: 'Perubahan tidak dapat diterapkan: {{message}}',
      discardFailed: 'Usulan tidak dapat dibuang: {{message}}',
      saveCurrentEditFirst: 'Simpan atau batalkan suntingan Anda saat ini terlebih dahulu.',
      empty: '(kosong)',
      yes: 'Ya',
      no: 'Tidak',
      newItem: '{{type}} baru',
      categoryItem: 'Item {{ref}} ({{level}})',
      replaces: 'Menggantikan',
      kind: {
        label: 'Label',
        description: 'Deskripsi',
      },
      changes_other: '{{count}} perubahan',
      more: '+ {{count}} lainnya',
      reviewAll: 'Tinjau semua ({{count}})',
      applyAll: 'Terapkan semua',
      applySelectedCount: 'Terapkan yang dipilih ({{count}})',
      confirm: {
        title: 'Konfirmasi Terapkan semua',
        text: 'Anda belum membuka tinjauan. Perubahan yang akan diterapkan: {{count}}',
        review: 'Tinjau dahulu',
        apply: 'Terapkan ({{count}})',
        cancel: 'Batal',
      },
      behaviourUnselected: 'Perubahan pada ekspresi atau properti tidak dipilih sampai Anda meninjaunya: {{count}}',
      review: {
        title: 'Tinjau perubahan yang diusulkan',
        search: 'Cari perubahan',
        groupBy: 'Kelompokkan menurut',
        byEntity: 'Entitas',
        byField: 'Perubahan',
        show: 'Tampilkan',
        groups: 'Kelompok',
        all: 'Semua ({{count}})',
        selected: 'Dipilih ({{count}})',
        conflicts: 'Konflik ({{count}})',
        allChanges: 'Semua perubahan',
        item: 'Item',
        change: 'Perubahan',
        original: 'Asli',
        current: 'Saat ini',
        proposed: 'Diusulkan',
        status: 'Status',
        selectShown: 'Pilih perubahan yang ditampilkan',
        selectGroup: 'Pilih {{name}}',
        selectedOf: '{{selected}} dari {{total}} dipilih',
        noMatch: 'Tidak ada perubahan yang cocok.',
        close: 'Tutup',
        discardAll: 'Buang semua',
        categoryGroup: 'Kategori {{name}}',
      },
      label: 'Label ({{lang}})',
      description: 'Deskripsi ({{lang}})',
      status: {
        applied: 'Diterapkan',
        conflict: 'Konflik',
        failed: 'Gagal',
        skipped: 'Dilewati',
      },
      props: {
        name: 'Nama',
        key: 'Kunci',
        multiple: 'Jamak',
        readOnly: 'Hanya baca',
        categoryUuid: 'Kategori',
        taxonomyUuid: 'Taksonomi',
      },
      expressionProps: {
        defaultValues: 'Nilai bawaan',
        applicable: 'Relevan jika',
        validations: 'Validasi',
        visibleIf: 'Terlihat jika',
        editableIf: 'Dapat disunting jika',
      },
    },
    issues: {
      typeNotAllowed: 'Asisten tidak dapat membuat item bertipe {{type}}.',
      parentNotFound: 'Tidak ada entitas bernama {{name}}.',
      parentNotEntity: '{{name}} bukan entitas.',
      entityUnderTable: 'Entitas tidak dapat ditambahkan ke {{name}}, yang ditampilkan sebagai tabel.',
      nodeDefNotFound: 'Tidak ada item bernama {{name}}.',
      languageNotInSurvey: 'Survei tidak memiliki bahasa {{lang}}.',
      entityMultipleChange: 'Ubah pengaturan "jamak" entitas di perancang formulir.',
      multipleWithDefaultValues: 'Atribut dengan nilai bawaan tidak dapat bersifat jamak.',
      multipleNotAllowed: 'Pengaturan "jamak" dari {{name}} tidak dapat digunakan untuk tipe item ini.',
      multipleEditDisabled:
        'Pengaturan "jamak" dari {{name}} tidak dapat diubah (sudah diterbitkan, merupakan kunci, hanya baca, atau berada di tabel).',
      keyNotAllowed: '{{name}} tidak dapat menjadi atribut kunci.',
      keyEditDisabled:
        '{{name}} tidak dapat diubah menjadi atau dari kunci (bersifat jamak, atau batas kunci telah tercapai).',
      duplicateOperation: 'Properti yang sama dari {{name}} diubah dua kali.',
      singleExpressionOnly: 'Properti ini hanya menerima satu ekspresi.',
      expressionEmpty: 'Ada ekspresi yang kosong.',
      rootEntity: 'Entitas akar tidak dapat diubah oleh asisten.',
      categoryNotFound: 'Tidak ada kategori {{name}}.',
      refEditDisabled:
        '{{name}} tidak dapat diberi kategori atau taksonomi lain (sudah diterbitkan, atau atribut kode lain bergantung padanya).',
      refHasParentCode:
        '{{name}} bergantung pada atribut kode induk, sehingga kategorinya tidak dapat diubah di sini. Ubah di perancang.',
      nodeDefInvalid:
        '{{name}} tidak akan valid setelah perubahan ini, sehingga tidak ada perubahannya yang diterapkan.',
      expressionInvalid: 'Ekspresi tidak valid: {{text}}',
    },
  },

  aiPolicy: {
    dataClass: {
      schema: 'desain survei',
      data: 'data catatan',
    },
    // used inside appErrors:aiPolicyRefused ("… sending X to <hostingClass>")
    hostingClass: {
      onDevice: 'perangkat ini',
      orgHosted: 'server organisasi',
      cloud: 'cloud',
      unknown: 'layanan AI yang tidak dikenal',
    },
    level: {
      off: 'Nonaktif',
      onDevice: 'Di perangkat ini',
      orgHosted: 'Server organisasi',
      cloud: 'Cloud',
    },
    blocked: {
      schema: {
        off: 'Kebijakan AI survei ini tidak mengizinkan AI pada desain survei.',
        onDevice: 'Kebijakan AI survei ini menyimpan desain survei di perangkat ini.',
        orgHosted: 'Kebijakan AI survei ini menyimpan desain survei di server organisasi.',
      },
      data: {
        off: 'Kebijakan AI survei ini tidak mengizinkan AI pada data catatan.',
        onDevice: 'Kebijakan AI survei ini menyimpan data catatan di perangkat ini.',
        orgHosted: 'Kebijakan AI survei ini menyimpan data catatan di server organisasi.',
      },
    },
    blockedByInstance: {
      schema: 'Instans Arena ini tidak mengizinkan pengiriman desain survei ke layanan AI ini.',
      data: 'Instans Arena ini tidak mengizinkan pengiriman data catatan ke layanan AI ini.',
    },
    openPolicyTab: 'Buka kebijakan AI',
  },

  aiDataLocation: {
    cloud: 'Cloud',
    cloudWithProvider: 'Cloud · {{provider}}',
    orgHosted: 'Server organisasi',
    onDevice: 'Di perangkat ini',
    onDeviceWithEngine: 'Di perangkat ini · {{engine}}',
    orgHostedWithEngine: 'Server organisasi · {{engine}}',
    ariaLabel: 'Data diproses oleh: {{location}}',
    modelTitle: '{{location}} ({{model}})',
  },
}
