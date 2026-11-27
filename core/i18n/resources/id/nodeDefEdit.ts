export default {
  additionalFields: 'Kolom tambahan',
  basic: 'Dasar',
  advanced: 'Lanjutan',
  mobileApp: 'Aplikasi Seluler',
  print: 'Cetak',
  printProps: {
    printOrientation: {
      label: 'Orientasi halaman',
      info: 'Orientasi yang digunakan ketika entitas ini memulai bagian cetaknya sendiri. Bawaan mengikuti orientasi dokumen yang dipilih saat ekspor.',
    },
    orientations: {
      default: 'Bawaan (dokumen)',
      portrait: 'Potret',
      landscape: 'Lanskap',
    },
  },
  validations: 'Validasi',
  function: 'Fungsi',
  editingFunction: 'Menyunting fungsi {{functionName}}',
  editorHelp: {
    json: 'Ekspresi yang valid adalah bagian dari Javascript.',
    sql: 'Hanya ekspresi SQL yang valid yang diizinkan.',
  },
  editorCompletionHelp: '- Tampilkan variabel dan fungsi yang tersedia dan dapat digunakan',
  editorTextSearchHelp:
    "Cari nilai teks dengan text_attr.includes('abc'), text_attr.startsWith('abc') atau text_attr.endsWith('abc'); tambahkan .toLowerCase() sebelumnya untuk mengabaikan huruf besar/kecil, mis. text_attr.toLowerCase().includes('abc')",
  functionDescriptions: {
    appId:
      'Mengembalikan pengenal aplikasi yang menyunting catatan: "arena" (Arena) atau "am" (Arena Mobile). $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appIdLabel:
      'Mengembalikan nama aplikasi yang menyunting catatan: "Arena" atau "Arena Mobile". $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appInfoNote:
      'Dievaluasi saat catatan dibuat dan dievaluasi lagi saat catatan disunting dengan aplikasi, platform, atau versi aplikasi lain',
    appPlatform:
      'Mengembalikan platform aplikasi yang menyunting catatan: "web", "android" atau "ios". $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    appVersion:
      'Mengembalikan versi aplikasi yang menyunting catatan. $t(nodeDefEdit:functionDescriptions.appInfoNote)',
    categoryItemProp:
      'Mengembalikan nilai $t(extraProp.label) yang ditentukan dari item kategori dengan kode yang ditentukan',
    dateTimeDiff: 'Mengembalikan selisih (dalam menit) dari 2 pasang tanggal-waktu',
    distance: 'Mengembalikan jarak (dalam meter) antara koordinat yang ditentukan',
    first: 'Mengembalikan nilai atau node pertama dari atribut atau entitas jamak yang ditentukan',
    geoCoordinateAtDistance:
      'Mengembalikan koordinat pada jarak dan arah (bearing) tertentu dari koordinat yang ditentukan',
    geoDistance: '$t(nodeDefEdit:functionDescriptions.distance)',
    geoAOIContaining:
      'Mengembalikan nama area minat pertama dari survei (sesuai urutan yang ditentukan di Info Survei → Peta) yang memuat koordinat yang ditentukan, atau tidak mengembalikan apa pun jika tidak ada area yang memuatnya',
    geoDistanceToAOIBoundary:
      'Mengembalikan jarak (dalam meter) antara sebuah koordinat dan batas area minat survei yang ditentukan: negatif di dalam area, positif di luar',
    geoPolygon: 'Membuat poligon dalam GeoJSON dari daftar koordinat',
    includes: 'Mengembalikan true jika atribut jamak yang ditentukan memuat nilai yang ditentukan.',
    index: 'Mengembalikan indeks node yang ditentukan di antara node saudaranya',
    isEmpty: 'Mengembalikan true jika argumen tidak memiliki nilai',
    isNotEmpty: 'Mengembalikan true jika argumen memiliki nilai',
    last: 'Mengembalikan nilai atau node terakhir dari atribut atau entitas jamak yang ditentukan',
    ln: 'Mengembalikan logaritma natural dari X',
    log10: 'Mengembalikan logaritma basis 10 dari X',
    max: 'Mengembalikan nilai maksimum dari argumen',
    min: 'Mengembalikan nilai minimum dari argumen',
    nodeDateCreated:
      'Mengembalikan tanggal dan waktu pembuatan node yang ditentukan (atribut atau entitas) sebagai nilai datetime, mis. nodeDateCreated(parent(this))',
    nodeDateModified:
      'Mengembalikan tanggal dan waktu terakhir diubahnya node yang ditentukan sebagai nilai datetime; untuk entitas, waktu terakhir entitas tersebut atau salah satu turunannya diubah, mis. nodeDateModified(parent(this))',
    now: 'Mengembalikan tanggal atau waktu saat ini',
    parent: 'Mengembalikan entitas induk dari node yang ditentukan',
    pow: 'Mengembalikan nilai bilangan pokok yang dipangkatkan',
    prevCycleNote:
      'Hanya berfungsi di Arena Mobile jika beberapa siklus ditentukan dan tautan siklus sebelumnya diaktifkan',
    prevCycleValue:
      'Mengembalikan nilai atribut yang sama dalam catatan siklus sebelumnya. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    prevCycleValues:
      'Mengembalikan nilai-nilai atribut yang sama dalam catatan siklus sebelumnya. $t(nodeDefEdit:functionDescriptions.prevCycleNote)',
    recordCycle: 'Mengembalikan siklus catatan saat ini',
    recordDateCreated:
      'Mengembalikan tanggal dan waktu pembuatan catatan saat ini sebagai nilai datetime. Dapat digunakan dalam atribut teks, tanggal, atau waktu',
    recordDateLastModified:
      'Mengembalikan tanggal dan waktu terakhir diubahnya catatan saat ini sebagai nilai datetime. Dapat digunakan dalam atribut teks, tanggal, atau waktu',
    recordOwnerEmail: 'Mengembalikan email pengguna pemilik catatan',
    recordOwnerName: 'Mengembalikan nama pengguna pemilik catatan',
    recordOwnerRole: 'Mengembalikan peran (dalam survei saat ini) pengguna pemilik catatan',
    rowIndex: 'Mengembalikan indeks baris tabel (atau formulir) saat ini',
    taxonProp: 'Mengembalikan nilai $t(extraProp.label) yang ditentukan dari takson dengan kode yang ditentukan',
    taxonVernacularName:
      'Mengembalikan nama vernakular (atau lokal) (pertama) dalam bahasa yang ditentukan dari takson dengan kode yang ditentukan',
    unique: 'Mengembalikan nilai unik dari atribut atau entitas jamak',
    userEmail: 'Mengembalikan email pengguna yang sedang masuk',
    userIsRecordOwner:
      'Mengembalikan nilai boolean "true" jika pengguna yang menyunting catatan juga pemiliknya, "false" jika tidak',
    userName: 'Mengembalikan nama pengguna yang sedang masuk',
    userProp: 'Mengembalikan nilai $t(extraProp.label) yang ditentukan dari pengguna yang sedang masuk',
    uuid: 'Membuat UUID (pengenal unik universal) yang dapat digunakan sebagai pengenal (mis. sebagai atribut kunci suatu entitas)',
    // SQL functions
    avg: 'Mengembalikan nilai rata-rata variabel numerik',
    count: 'Mengembalikan jumlah baris yang memenuhi kriteria tertentu',
    sum: 'Mengembalikan jumlah total variabel numerik',
  },
  functionName: {
    rowIndex: 'Indeks baris',
  },
  basicProps: {
    analysis: 'Analisis',
    autoIncrementalKey: {
      label: 'Bertambah otomatis',
      info: 'Nilai akan dibuat secara otomatis',
    },
    autoCreateMinCountItems: {
      label: 'Buat item minimum secara otomatis',
      info: 'Ketika entitas menjadi relevan atau entitas induknya dibuat, sejumlah entitas yang sama dengan jumlah minimum akan dibuat secara otomatis.',
    },
    displayAs: 'Tampilkan sebagai',
    displayIn: 'Tampilkan di',
    entitySource: 'Sumber Entitas',
    enumerate: {
      label: 'Enumerasi',
      info: `Baris akan dibuat secara otomatis menggunakan item kategori yang terkait dengan atribut kode yang ditandai sebagai Kunci dan didefinisikan di dalam entitas; baris tidak dapat ditambahkan atau dihapus dan atribut kode kunci tidak dapat disunting`,
    },
    enumeratingItemsExpression: {
      label: 'Ekspresi item enumerasi',
      info: 'Ekspresi opsional yang menyaring item kategori yang dienumerasi (mis. unique(table_source.source_type)). Jika kosong, semua item kategori digunakan.',
    },
    enumerator: {
      label: 'Enumerator',
      info: 'Item dalam kategori akan digunakan untuk membuat baris entitas induk',
    },
    form: 'Formulir',
    formula: 'Rumus',
    includedInClonedData: 'Disertakan dalam data kloning',
    includedInMultipleEntitySummary: {
      label: 'Sertakan dalam ringkasan entitas jamak',
      info: `Jika ditandai, nilai atribut akan terlihat di pemilih entitas (di Arena) dan di tampilan ringkasan entitas (di Arena Mobile)`,
    },
    includedInRecordsList: {
      label: 'Sertakan dalam daftar catatan',
      info: `Jika ditandai, atribut akan terlihat di daftar catatan`,
    },
    key: 'Kunci',
    maxKeysCountReached: 'Jumlah kunci maksimum tercapai ({{maxKeysCount}})',
    multiple: 'Jamak',
    ownPage: 'Halamannya sendiri',
    parentPage: 'Halaman induk ({{parentPage}})',
    qualifier: {
      label: 'Kualifikator',
      info: `Ketika catatan baru dibuat oleh pengguna yang tergabung dalam sebuah grup, atribut ini akan otomatis diisi dengan nilai yang ditentukan untuknya dalam kualifikator grup pengguna tersebut. Pengguna hanya dapat melihat dan mengubah catatan milik grup mereka sendiri, jika mereka tergabung dalam grup.`,
    },
    table: 'Tabel',
  },
  advancedProps: {
    areaBasedEstimate: 'Estimasi berbasis area',
    defaultValues: 'Nilai bawaan',
    defaultValuesInfo: `Fitur ini memungkinkan Anda mengisi jawaban secara otomatis berdasarkan aturan tertentu.
Jika Anda membuat beberapa aturan, sistem akan memeriksanya secara berurutan dari atas ke bawah.
Sistem akan menerapkan aturan pertama yang sesuai dengan kondisi Anda dan menggunakannya sebagai jawaban.`,
    defaultValueEvaluatedOneTime: 'Nilai bawaan dievaluasi hanya sekali',
    defaultValueEvaluatedOneTimeInfo: `Nilai bawaan hanya akan dievaluasi sekali, saat atribut dibuat.
Jika tidak ditandai, nilai bawaan akan dievaluasi ulang setiap kali catatan diperbarui.
Opsi ini sebaiknya ditandai saat menggunakan ekspresi seperti now() atau uuid() yang hanya perlu dievaluasi sekali, saat nilai atribut dibuat pertama kali.`,
    defaultValuesNotEditableForAutoIncrementalKey:
      'Nilai bawaan tidak dapat disunting karena kunci bertambah otomatis telah diatur',
    defaultValuesNotSpecified: 'Nilai bawaan tidak ditentukan',
    defaultValuesSpecified: 'Nilai bawaan ditentukan',
    editableIf: 'Dapat disunting',
    editableIfInfo: `Secara bawaan, pengguna selalu dapat mengakses kolom yang relevan.
Di sini Anda dapat menetapkan aturan apakah pengguna dapat mengetik atau mengubah kolom ini.
Jika kondisi yang Anda tetapkan terpenuhi, kolom dapat disunting. Jika tidak, kolom menjadi "hanya baca" (terkunci).`,
    editableAlways: 'Selalu dapat disunting',
    editableIfConditionIsMet: 'Dapat disunting jika kondisi terpenuhi',
    hidden: 'Selalu tersembunyi',
    hiddenInReport: 'Tersembunyi di Dasbor Analitik',
    hiddenInReportInfo: `Jika ditandai, atribut tidak akan terlihat di Dasbor Analitik`,
    hiddenWhenNotRelevant: 'Sembunyikan jika tidak relevan',
    itemsFilter: 'Filter item',
    itemsFilterInfo: `Ekspresi yang digunakan untuk menyaring item yang dapat dipilih.
Dalam ekspresi, kata "this" merujuk pada item itu sendiri.
Mis. this.region = region_attribute_name
(dengan "region" adalah nama properti tambahan yang ditentukan untuk item dan region_attribute_name adalah nama atribut dalam survei)`,
    readOnly: 'Hanya baca',
    relevantIf: 'Relevansi',
    relevantIfInfo: `Secara bawaan, semua kolom selalu aktif.
Jika Anda menetapkan aturan relevansi dan aturan tersebut tidak terpenuhi, kolom akan berwarna abu-abu atau disembunyikan sepenuhnya,
dan semua jawaban otomatis akan diabaikan.
Gunakan ini untuk menampilkan atau menyembunyikan bagian survei secara dinamis; mis. hanya menampilkan kotak teks "Sebutkan" jika pengguna memilih "Lainnya" pada pertanyaan sebelumnya.`,
    relevantIfRadioNone: 'Selalu relevan',
    relevantIfRadioDefined: 'Relevan jika kondisi terpenuhi',
    script: 'Skrip',
    visibleIf: 'Visibilitas',
    visibleIfInfo: `Secara bawaan, kolom selalu terlihat.
Jika Anda menetapkan aturan, kolom hanya akan terlihat saat aturan tersebut terpenuhi; jika tidak, kolom akan disembunyikan.
Catatan: berbeda dengan menyembunyikan kolom "tidak aktif" (tidak relevan), kolom yang tersembunyi tetap dapat memiliki jawaban otomatis yang disimpan di latar belakang.
Ini sangat cocok untuk menyembunyikan seluruh bagian survei berdasarkan siapa yang masuk (seperti peran pengguna).`,
    visibleAlways: 'Selalu terlihat',
    visibleIfConditionIsMet: 'Terlihat jika kondisi terpenuhi',
  },
  mobileAppProps: {
    hiddenInMobile: {
      label: 'Tersembunyi di Arena Mobile',
      info: `Jika ditandai, atribut tidak akan terlihat di AM`,
    },
    includedInPreviousCycleLink: {
      label: 'Sertakan dalam tautan siklus sebelumnya',
      info: `Jika ditandai, nilai dari siklus sebelumnya akan ditampilkan pada formulir entri data (saat tautan ke siklus sebelumnya diaktifkan di aplikasi seluler)`,
    },
  },
  numericProps: {
    unit: 'Satuan',
  },
  decimalProps: {
    maxNumberDecimalDigits: 'Jumlah maksimum digit desimal',
  },
  fileProps: {
    fileNameExpression: 'Ekspresi nama file',
    fileType: 'Jenis file',
    fileTypes: {
      image: 'Gambar',
      video: 'Video',
      audio: 'Audio',
      other: 'Lainnya',
    },
    maxFileSize: 'Ukuran file maks. (Mb)',
    numberOfFiles: 'Buka Validasi untuk mengubah jumlah file Min. dan Maks.',
    showGeotagInformation: 'Tampilkan informasi geotag',
    allowScreenCaptureInMap: 'Izinkan menyimpan tangkapan layar di tampilan peta',
  },
  mobileProps: {
    title: 'Aplikasi Seluler',
  },
  timeProps: {
    includeSeconds: 'Sertakan detik',
  },
  geoProps: {
    positionTracking: 'Pelacakan posisi',
    positionTrackingInfo: `Hanya berlaku untuk Arena Mobile: jika dicentang, nilainya adalah jalur yang dilalui pengguna saat mengisi catatan (direkam dengan melacak posisi perangkat) dan tidak dapat disunting secara manual`,
  },
  formHeaderProps: {
    headerColorLabel: 'Warna header',
    headerColor: {
      blue: 'Biru',
      green: 'Hijau',
      orange: 'Oranye',
      red: 'Merah',
      yellow: 'Kuning',
    },
  },
  textProps: {
    displayAsTypes: {
      hyperlink: 'Hyperlink',
      markdown: 'Markdown',
      text: 'Teks',
    },
    textInputType: 'Jenis input teks',
    textInputTypes: {
      singleLine: 'Satu baris',
      multiLine: 'Banyak baris',
    },
    textTransform: 'Transformasi teks',
    textTransformTypes: {
      none: 'tidak ada',
      capitalize: 'kapital awal kata',
      uppercase: 'huruf besar',
      lowercase: 'huruf kecil',
    },
  },
  booleanProps: {
    labelValue: 'Nilai label',
    labelValues: {
      trueFalse: '$t(common.true)/$t(common.false)',
      yesNo: '$t(common.yes)/$t(common.no)',
    },
  },
  codeProps: {
    category: 'Kategori',
    codeShown: 'Tampilkan kode',
    displayAsTypes: {
      checkbox: 'Kotak centang',
      dropdown: 'Dropdown',
    },
    parentCode: 'Kode Induk',
  },
  coordinateProps: {
    allowOnlyDeviceCoordinate: 'Hanya izinkan koordinat perangkat',
    allowOnlyDeviceCoordinateInfo: `Hanya berlaku untuk Arena Mobile: jika dicentang, pengguna tidak dapat mengubah nilai X/Y, tetapi hanya GPS perangkat yang dapat digunakan untuk mendapatkannya`,
    mapMarkerColor: 'Warna penanda peta',
  },
  expressionsProp: {
    expression: 'Ekspresi',
    applyIf: 'Terapkan Jika',
    confirmDelete: 'Hapus ekspresi ini?',
    severity: 'Tingkat keparahan',
  },
  validationsProps: {
    minCount: 'Jumlah min.',
    maxCount: 'Jumlah maks.',
    expressions: 'Ekspresi validasi',
    attributeAlwaysValid: 'Atribut selalu valid',
    attributeValidWhenConditionIsMet: 'Atribut valid jika kondisi terpenuhi',
    notRequired: 'Tidak wajib',
    alwaysRequired: 'Selalu wajib',
    requiredWhenConditionIsMet: 'Wajib jika kondisi terpenuhi',
  },
  cannotChangeIntoMultipleWithDefaultValues: 'Node ini tidak dapat diubah menjadi jamak karena memiliki nilai bawaan.',
  cannotDeleteNodeDefReferenced: `Tidak dapat menghapus "{{nodeDef}}": node ini dirujuk oleh definisi node berikut: {{nodeDefDependents}}`,
  cloneDialog: {
    confirmButtonLabel: 'Kloning',
    title: 'Mengkloning definisi node "{{nodeDefName}}"',
    entitySelectLabel: 'Entitas tujuan kloning:',
  },
  conversion: {
    dialogTitle: 'Ubah {{nodeDefName}} menjadi jenis lain',
    fromType: 'Dari jenis',
    toType: 'Ke jenis',
  },
  moveDialog: {
    confirmButtonLabel: 'Pindahkan',
    title: 'Memindahkan definisi node "{{nodeDefName}}" dari "{{parentNodeDefName}}"',
    entitySelectLabel: 'Entitas tujuan pemindahan:',
  },
  movedNodeDefinitionHasErrors:
    'Definisi node "{{nodeDefName}}" yang Anda pindahkan memiliki kesalahan; harap perbaiki.',
  nodeDefintionsHaveErrors: 'Definisi node berikut memiliki kesalahan: {{nodeDefNames}}. Harap perbaiki.',
  filterVariable: 'Variabel untuk menyaring item',
  filterVariableForLevel: 'Variabel untuk {{levelName}}',
  unique: {
    label: 'Unik',
    info: `Jika sebuah atribut ditandai sebagai **Unik**, nilainya harus unik di dalam entitas jamak terdekat (jika tidak, kesalahan akan ditampilkan).

---

Mis. dalam struktur seperti *cluster -> plot -> tree*, jika Anda memiliki atribut *tree_species* yang ditandai sebagai **Unik**, Anda hanya dapat memiliki satu pohon per spesies di dalam *plot* yang sama.`,
  },
  nodeDefClonedSuccessfully: 'Definisi node "{{nodeDefName}}" berhasil dikloning ke "{{targetParentNodeDefName}}"',
  categoriesClonedFromSurvey: 'Kategori berikut juga dikloning dari survei sumber: {{names}}',
  taxonomiesClonedFromSurvey: 'Taksonomi berikut juga dikloning dari survei sumber: {{names}}',
}
