export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Survei aktif belum dipilih</title>
      <p><label>Silakan pilih salah satu dari</label><linkToSurveys>Daftar Survei</linkToSurveys> atau <linkToNewSurvey>Buat survei baru</linkToNewSurvey></p>`,
    activeUsers: 'Pengguna aktif',
    activityLog: {
      title: 'Log aktivitas',
      size: 'Ukuran $t(homeView:dashboard.activityLog.title): {{size}}',
      loadError: 'Aktivitas tidak dapat dimuat.',
      empty: 'Belum ada aktivitas.',
    },
    exportWithData: 'Ekspor + data (Cadangan)',
    exportWithDataNoActivityLog: 'Ekspor + data (TANPA Log Aktivitas)',
    exportWithDataNoResultAttributes: 'Ekspor + data (TANPA Atribut Hasil)',
    surveyPropUpdate: {
      main: `<title>Selamat datang di Arena</title>

        <p>Pertama, Anda perlu menetapkan <strong>nama</strong> dan <strong>label</strong> survei.</p>

        <p>Klik di bawah pada <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>atau pada nama survei:<basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Jika nama dan label sudah benar, buat atribut pertama
        <linkWithIcon>Survei > Perancang Formulir</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>Mari buat atribut pertama dari {{surveyName}} </title>

        <p>Buka <linkWithIcon>Survei > Perancang Formulir</linkWithIcon></p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Penggunaan penyimpanan',
      availableSpace: 'Tersedia ({{size}})',
      usedSpace: 'Terpakai ({{size}})',
      usedSpaceOutOf: `Terpakai {{percent}}% ({{used}} dari {{total}})`,
    },
    storageSummaryDb: {
      title: 'Penggunaan penyimpanan (basis data)',
    },
    storageSummaryFiles: {
      title: 'Penggunaan penyimpanan (file)',
    },
    samplingPointDataCompletion: {
      title: 'Kelengkapan Data Titik Sampel',
      totalItems: 'Total item: {{totalItems}}',
      remainingItems: 'Item tersisa',
    },
    kpi: {
      records: 'Catatan',
      contributors: 'Kontributor',
      storage: 'Penyimpanan',
      expandDetails: 'Tampilkan detail',
      collapseDetails: 'Sembunyikan detail',
    },
    recordsCard: {
      total: 'Catatan yang ditambahkan dalam periode terpilih',
      byStep: 'Menurut tahap alur kerja (sepanjang waktu)',
    },
    contributorsCard: {
      active: 'Kontributor aktif dalam periode terpilih: {{count}}',
    },
    map: {
      title: 'Peta',
      allOwners: 'Semua pemilik',
    },
    step: {
      entry: 'Entri Data',
      cleansing: 'Pembersihan Data',
      analysis: 'Analisis Data',
    },
    // records' summary
    recordsByUser: 'Catatan per pengguna',
    recordsAddedPerUserWithCount: 'Catatan yang ditambahkan per pengguna (Total {{totalCount}})',
    dailyRecordsByUser: 'Catatan harian per pengguna',
    totalRecords: 'Total catatan',
    selectUsers: 'Pilih pengguna...',
    noRecordsAddedInSelectedPeriod: 'Tidak ada catatan yang ditambahkan dalam periode terpilih',
  },
  surveyDeleted: 'Survei {{surveyName}} telah dihapus',
  landing: {
    openDashboard: 'Buka dasbor',
  },
  surveyInfo: {
    basic: 'Info dasar',
    branding: {
      title: 'Branding',
      primaryColor: 'Warna utama',
      titleFontSize: 'Ukuran font judul',
      descriptionFontSize: 'Ukuran font deskripsi',
      fontSizePreset: {
        small: 'Kecil',
        default: 'Bawaan',
        large: 'Besar',
      },
      surveyLogo1: 'Logo survei 1',
      surveyLogo2: 'Logo survei 2',
      surveyLogo3: 'Logo survei 3',
      landingBackground: 'Gambar latar halaman awal',
      uploadLogo: 'Unggah gambar',
      logoFileFormatHint: 'PNG, JPEG, WebP atau SVG (maks. {{maxMb}} MB)',
      logoFileTooLarge: 'Gambar logo harus berukuran {{maxMb}} MB atau lebih kecil',
      preview: 'Pratinjau',
      backgroundFileTooLarge: 'Gambar latar harus berukuran {{maxMb}} MB atau lebih kecil',
      invalidPrimaryColor: 'Masukkan warna #RRGGBB yang valid atau biarkan kosong',
      invalidSaveBlocked: 'Perbaiki kolom branding yang tidak valid sebelum menyimpan info survei',
      imageLoadError: 'Tidak dapat memuat gambar "{{name}}". Hapus gambar tersebut dan unggah gambar baru.',
      imageLoadErrorReadOnly: 'Tidak dapat memuat gambar "{{name}}"',
      downloadImage: 'Klik untuk mengunduh gambar',
    },
    configuration: {
      title: 'Konfigurasi',
      filesTotalSpace: 'Total ruang file (GB)',
    },
    confirmDeleteCycleHeader: 'Hapus siklus ini?',
    confirmDeleteCycle: `Apakah Anda yakin ingin menghapus siklus {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
Jika ada catatan yang terkait dengan siklus ini, catatan tersebut akan dihapus.`,
    cycleForArenaMobile: 'Siklus untuk Arena Mobile',
    keepNonApplicableValues: 'Pertahankan nilai atribut yang tidak relevan',
    keepNonApplicableValuesInfo: `Jika tidak dicentang (bawaan), selama entri data nilai atribut yang tidak lagi relevan akan dikosongkan (setelah pengguna mengonfirmasinya).
Jika dicentang, nilai tersebut tetap disimpan dalam catatan, meskipun atributnya tidak lagi relevan.`,
    deleteActivityLog: 'Kosongkan log aktivitas',
    deleteActivityLogConfirm: {
      headerText: 'Kosongkan SEMUA data log aktivitas untuk survei ini?',
      message: `
  - SEMUA data log aktivitas untuk survei **{{surveyName}}** akan dihapus;\n\n
  - ruang yang digunakan survei di basis data akan berkurang;\n\n
  - data input survei tidak akan terpengaruh;\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Masukkan nama survei ini untuk mengonfirmasi:',
    },
    fieldManualLink: 'Tautan panduan lapangan',
    editInfo: 'Sunting info',
    map: 'Peta',
    viewInfo: 'Lihat info',

    areasOfInterest: {
      title: 'Area minat',
      info: 'Poligon (GeoJSON, koordinat WGS84) yang digunakan oleh fungsi ekspresi geoDistanceToAOIBoundary (jarak ke batas suatu area) dan geoAOIContaining (area yang memuat suatu lokasi), juga secara offline di Arena Mobile. Nama area digunakan dalam ekspresi.',
      name: 'Nama',
      polygons: 'Poligon',
      vertices: 'Verteks',
      invalidFile: 'File tidak berisi poligon yang valid dalam format GeoJSON dengan koordinat WGS84',
      confirmDelete: 'Apakah Anda yakin ingin menghapus area minat ini?',
      showAllOnMap: 'Tampilkan semua di peta',
      editor: {
        title: 'Area minat',
      },
    },

    preloadedMapLayers: {
      enabledMessage: 'Lapisan peta pramuat diaktifkan',
      title: 'Lapisan peta pramuat',
      confirmDelete: 'Apakah Anda yakin ingin menghapus lapisan peta pramuat ini?',
      editor: {
        title: 'Lapisan peta pramuat',
      },
    },

    surveyDocLayout: {
      tabTitle: 'Tata Letak Dokumen',
      title: 'Gambar dokumen',
      layoutOptions: {
        title: 'Opsi tata letak',
        headerOnFirstPageOnly: 'Header hanya di halaman pertama',
        pageNumbering: 'Penomoran halaman',
      },
      documentPlace: 'Posisi',
      documentPlaceValues: {
        header: 'Header',
        footer: 'Footer',
      },
      applyIf: 'Terapkan jika kondisi',
      confirmDelete: 'Apakah Anda yakin ingin menghapus gambar dokumen ini?',
      editor: {
        title: 'Gambar dokumen',
      },
    },

    preferredLanguage: 'Bahasa pilihan',
    sampleBasedImageInterpretation: 'Interpretasi citra berbasis sampel',
    sampleBasedImageInterpretationEnabled: 'Interpretasi citra berbasis sampel diaktifkan',
    aiPolicy: {
      title: 'Kebijakan AI',
      intro:
        'Pilih di mana AI boleh memproses konten survei ini. Yang berlaku adalah yang lebih ketat antara kebijakan ini dan batasan instans Arena ini.',
      schemaLabel: 'Desain survei (skema)',
      schemaHint: 'Definisi node, label, dan ekspresi.',
      dataLabel: 'Data catatan',
      dataHint: 'Nilai yang dikumpulkan dan aktivitas pengguna.',
      levelHint: {
        off: 'AI tidak pernah digunakan untuk konten ini.',
        onDevice: 'Diproses hanya oleh mesin AI yang berjalan di perangkat pengguna.',
        orgHosted: 'Diproses oleh server AI yang dikelola organisasi Anda.',
        cloud: 'Dapat diproses oleh penyedia AI cloud.',
      },
      notAllowedOnInstance: 'Tidak diizinkan pada instans Arena ini: {{levels}}',
      dataLimitedBySchema: 'Data catatan tidak boleh lebih longgar daripada desain survei. Tidak tersedia: {{levels}}',
      onDeviceNote: 'Di perangkat ini: pengguna memerlukan server AI lokal (misalnya LM Studio).',
      readOnly: 'Hanya administrator survei yang dapat mengubah kebijakan AI.',
      saved: 'Kebijakan AI disimpan',
      savedDataLowered:
        'Kebijakan AI disimpan. Data catatan juga diturunkan: tidak boleh lebih longgar daripada desain survei.',
      saveError: 'Tidak dapat menyimpan kebijakan AI: {{message}}',
      loadError: 'Tidak dapat memuat kebijakan AI',
    },
    security: {
      title: 'Keamanan',
      publishToApply: 'Perubahan pada opsi ini berlaku setelah survei diterbitkan.',
      dataEditorViewNotOwnedRecordsAllowed: 'Editor Data dapat melihat catatan milik pengguna lain',
      dataAnalystViewNotOwnedRecordsAllowed: 'Analis Data dapat melihat catatan milik pengguna lain',
      visibleInMobile: 'Terlihat di Arena Mobile',
      allowRecordsDownloadInMobile: 'Izinkan mengunduh catatan dari server ke Arena Mobile',
      allowRecordsUploadFromMobile: 'Izinkan mengunggah catatan dari Arena Mobile ke server',
      allowRecordsWithErrorsUploadFromMobile:
        'Izinkan mengunggah catatan dengan kesalahan validasi dari Arena Mobile ke server',
      notifyAdminsOnRecordsUploadFromMobile:
        'Beri tahu administrator survei melalui email saat catatan diunggah dari Arena Mobile',
      notifyAdminsOnRecordsUploadFromMobileInfo:
        'Jika dicentang, setiap administrator survei menerima email yang berisi daftar catatan yang diunggah dari Arena Mobile (nilai kunci, pembuat, tanggal, validasi, dan UUID).',
      formPreviewForDataEntryUsers: 'Izinkan pengguna entri data melihat pratinjau formulir draf (belum diterbitkan)',
      formPreviewForDataEntryUsersInfo:
        'Pengguna yang dapat memasukkan data tetapi tidak dapat menyunting survei akan melihat tombol Pratinjau formulir di daftar catatan, untuk menguji formulir dengan perubahan terbaru yang belum diterbitkan (mis. untuk uji penerimaan pengguna). Data yang dimasukkan dalam pratinjau tidak disimpan.',
      allowRecordsMergeWithSameKeys:
        'Izinkan penggabungan catatan dengan kunci yang sama (mis. catatan yang dibuat di perangkat Arena Mobile yang berbeda)',
    },
    srsPlaceholder: 'Ketik kode atau label',
    unpublish: 'Batalkan penerbitan dan hapus data',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Apakah Anda yakin ingin membatalkan penerbitan survei ini?',
      unpublishWarning: `Membatalkan penerbitan survei **{{surveyName}}** akan menghapus semua datanya.\n\n

  $t(common.cantUndoWarning)`,
      confirmName: 'Masukkan nama survei ini untuk mengonfirmasi:',
    },
    userExtraProps: {
      title: 'Properti tambahan pengguna',
      info: `Properti tambahan yang dapat diberikan kepada setiap pengguna yang terkait dengan survei.
Properti tersebut dapat digunakan dalam nilai bawaan, aturan validasi, dan ekspresi keberlakuan.
Mis.: *userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Apakah Anda yakin ingin menghapus survei ini?',
    deleteWarning: `Menghapus survei **{{surveyName}}** akan menghapus semua datanya.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Masukkan nama survei ini untuk mengonfirmasi:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Aktifkan',
  },
  collectImportReport: {
    excludeResolvedItems: 'Kecualikan item yang sudah diselesaikan',
    expression: 'Ekspresi',
    resolved: 'Diselesaikan',
    exprType: {
      applicable: '$t(nodeDefEdit:advancedProps.relevantIf)',
      codeParent: 'Kode induk',
      defaultValue: 'Nilai bawaan',
      requiredIf: 'Wajib jika',
      validationRule: 'Aturan validasi',
    },
    title: 'Laporan Impor Collect',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Catatan yang ditambahkan dalam:',
    fromToPeriod: 'dari {{from}} hingga {{to}}',
    record: '{{count}} Catatan',
    record_other: '{{count}} Catatan',
    week: '{{count}} Minggu',
    week_other: '{{count}} Minggu',
    month: '{{count}} Bulan',
    month_other: '{{count}} Bulan',
    year: '{{count}} Tahun',
    year_other: '{{count}} Tahun',
  },
}
