export default {
  completion: '{{percent}}% selesai',
  pagesValidationProgress: '{{valid}}/{{total}} halaman valid ({{percent}}%)',
  pageComplete: 'Selesai',
  copyPath: 'Salin jalur',
  pathCopiedToClipboard: 'Jalur disalin ke papan klip',
  subPage: 'Subhalaman',
  addChildTo: 'Tambahkan ke {{nodeDefLabel}}',
  addChildToTitle: 'Tambahkan node baru ke {{nodeDefLabel}}',
  addChildToTypes: {
    boolean: 'Boolean',
    code: 'Kode',
    coordinate: 'Koordinat',
    date: 'Tanggal',
    decimal: 'Desimal',
    geo: 'Geospasial',
    entity: 'Tabel atau formulir',
    file: 'File',
    integer: 'Bilangan bulat',
    taxon: 'Takson',
    text: 'Teks',
    time: 'Waktu',
    // layout elments
    formHeader: 'Header Formulir',
  },
  clone: `Kloning '{{nodeDefLabel}}'`,
  compressFormItems: `Padatkan item formulir untuk '{{nodeDefLabel}}'`,
  confirmClearNonApplicableValues: `Kolom berikut tidak akan relevan lagi dan nilainya akan dikosongkan:

{{nodeDefLabels}}

Lanjutkan?`,
  confirmUpdateDependentEnumeratedEntities: `Jika Anda melanjutkan, beberapa entitas terenumerasi ({{entityDefs}}) akan dienumerasi ulang,
dan nilai yang sudah dimasukkan ke dalamnya (jika ada) akan dihapus.
Lanjutkan?`,
  convert: `Ubah '{{nodeDefLabel}}'`,
  delete: `Hapus '{{nodeDefLabel}}'`,
  edit: `Sunting '{{nodeDefLabel}}'`,
  schemaSummary_csv: 'Ringkasan skema (CSV)',
  schemaSummary_xlsx: 'Ringkasan skema (Excel)',
  schemaSummaryAiDescriptions_csv: 'Ringkasan skema + deskripsi AI (CSV)',
  schemaSummaryAiDescriptions_xlsx: 'Ringkasan skema + deskripsi AI (Excel)',
  schemaSummaryAiDescriptionsFailed_other:
    'Deskripsi AI tidak dapat dibuat untuk {{count}} kolom; deskripsi tersebut dibiarkan kosong.',
  schemaSummaryAiDescriptionsNotDone_other:
    'Deskripsi AI tidak dibuat untuk {{count}} kolom karena proses dihentikan; deskripsi tersebut dibiarkan kosong.',
  hidePages: 'Sembunyikan halaman',
  showPages: 'Tampilkan halaman',
  move: `Pindahkan '{{nodeDefLabel}}'`,
  movePageUp: 'Pindahkan halaman ke atas',
  movePageDown: 'Pindahkan halaman ke bawah',
  formEditActions: {
    preview: 'Pratinjau',
    previewDesktop: 'Pratinjau (desktop)',
    previewMobile: 'Pratinjau (seluler)',
    previewOptions: 'Opsi pratinjau',
  },
  mobilePreview: {
    device: {
      phone: 'Ponsel',
      tablet: 'Tablet',
    },
    error: 'Kesalahan saat memuat pratinjau seluler: {{error}}',
    differences: `**Perbedaan dengan Arena Mobile di perangkat sebenarnya**
- **Tanggal dan waktu**: diketik di kolom teks (DD/MM/YYYY, HH:mm), bukan melalui pemilih tanggal/waktu perangkat
- **Peta**: tidak tersedia (tombol peta menampilkan placeholder, tanpa peta offline atau PDF)
- **Lokasi**: diambil dari browser (biasanya kurang akurat dibandingkan GPS perangkat); tanpa penerima GPS eksternal
- **Foto dan file**: dipilih dari komputer; pengambilan kamera dan lokasi foto (EXIF) tidak tersedia
- **Keyboard dan gestur**: keyboard fisik dan mouse, bukan keyboard layar dan usapan
- **Data**: hanya disimpan di memori, hilang saat memuat ulang; tanpa daftar catatan, sinkronisasi, atau ekspor`,
    note: 'Perkiraan tampilan Arena Mobile yang berjalan di browser dengan survei draf.',
    orientation: {
      landscape: 'Lanskap',
      portrait: 'Potret',
    },
    reload: 'Muat ulang',
    title: 'Pratinjau seluler',
  },
  formEntryActions: {
    confirmDemote: 'Apakah Anda yakin ingin menurunkan catatan ini ke {{name}}?',
    confirmPromote: `Apakah Anda yakin ingin **menaikkan catatan ini ke {{name}}**?
Anda tidak akan dapat menyuntingnya lagi`,
    confirmPromoteWithErrors: `**Catatan ini berisi kesalahan**.
$t(surveyForm:formEntryActions.confirmPromote)`,
    confirmDelete: 'Apakah Anda yakin ingin menghapus catatan ini?\n\n$t(common.cantUndoWarning)',
    closePreview: 'Tutup pratinjau',
    demoteTo: 'Turunkan ke {{stepPrev}}',
    promoteTo: 'Naikkan ke {{stepNext}}',
    step: 'Tahap {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Kolom',
    confirmConvert: 'Ubah atribut "{{name}}" menjadi "{{toType}}"?',
    confirmDelete:
      'Apakah Anda yakin ingin menghapus definisi node ini secara permanen: {{ name }}?\n\n$t(common.cantUndoWarning)',
  },
  nodeDefCode: {
    code: '$t(common.code)',
    label: '$t(common.label)',
    typeCodeOrLabel: 'Ketik kode atau label',
    option: 'Opsi {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: '$t(common.true)',
        false: '$t(common.false)',
      },
      yesNo: {
        true: '$t(common.yes)',
        false: '$t(common.no)',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Koordinat',
    latLong: 'Lat, Long',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Tampilkan di peta',
    accuracy: 'Akurasi',
    altitude: 'Ketinggian',
    altitudeAccuracy: 'Akurasi ketinggian',
  },
  nodeDefGeo: {
    confirmDelete: 'Hapus nilai Geospasial ini?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'File GeoJSON yang diunggah tidak valid',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Tambahkan {{name}} baru',
    confirmDelete: 'Apakah Anda yakin ingin menghapus entitas ini?',
    select: 'Pilih {{name}}:',
    selectedEntity: '{{name}} yang dipilih:',
  },
  nodeDefTaxon: {
    code: '$t(common.code)',
    scientificName: 'Nama ilmiah',
    vernacularName: 'Nama vernakular',
    vernacularNameAlwaysIncludedIfSingle: 'Nama vernakular selalu disertakan jika hanya ada satu',
    vernacularNameAlwaysIncludedIfSingleInfo: `- **Diaktifkan**: Jika opsi ini diaktifkan dan sebuah takson hanya memiliki satu nama vernakular, nama vernakular tersebut akan otomatis disimpan bersama data saat takson dipilih.
- **Dinonaktifkan**: hanya kode takson dan nama ilmiah yang akan disimpan, meskipun takson memiliki satu nama vernakular.`,
    vernacularNameSelectionKept: 'Pilihan nama vernakular dipertahankan',
    vernacularNameSelectionKeptInfo: `- **Diaktifkan**: ketika takson dipilih menggunakan nama vernakular (umum), nama vernakular yang digunakan dalam pencarian juga akan disimpan dalam data.
- **Dinonaktifkan**: hanya kode takson dan nama ilmiah yang akan disimpan, apa pun nama vernakular yang digunakan saat pencarian.
Di Arena Mobile:
- **Diaktifkan**: setiap nama vernakular muncul sebagai item terpisah dalam daftar hasil pencarian.
- **Dinonaktifkan**: semua nama vernakular suatu takson dikelompokkan dan ditampilkan bersama takson (digabung dalam satu entri). Akibatnya, daftar pelengkapan otomatis berisi lebih sedikit item.`,
    visibleFields: 'Kolom yang terlihat',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Kesalahan saat memuat pratinjau',
    fileUuid: 'UUID file',
    fileName: 'Nama file',
    locationInformationNotFound: 'Informasi lokasi tidak ditemukan dalam file',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Semua node',
    onlyPages: 'Hanya halaman',
  },
  step: {
    entry: 'Entri',
    cleansing: 'Pembersihan',
    analysis: 'Analisis',
  },
  cloneFromAnotherSurvey: {
    title: 'Kloning Node dari Survei Lain',
    expandToLoadNodes: 'Perluas untuk memuat node',
    loadingSurveyNodes: 'Memuat node survei...',
    errorLoadingSurveyNodes: 'Kesalahan saat memuat node survei',
    noNodesAvailable: 'Tidak ada node yang tersedia',
    loadingSurveys: 'Memuat survei...',
    noSurveysAvailable: 'Tidak ada survei yang tersedia',
    sourceNode: 'Node sumber',
    targetEntityCurrentSurvey: 'Entitas tujuan (survei saat ini)',
  },
  confirmNodeDelete: 'Apakah Anda yakin ingin menghapus {{nodeDefType}} ini ({{nodeDefLabel}})?',
  downloadPrintableDocument: 'Unduh dokumen siap cetak (Word)',
  downloadPrintableDocumentPdf: 'Unduh dokumen siap cetak (PDF)',
  printableExport: {
    title: 'Ekspor dokumen siap cetak',
    exportDocument: 'Ekspor Dokumen',
    format: 'Format',
    formats: {
      pdf: 'PDF',
      docx: 'Word',
    },
    scope: 'Konten',
    scopes: {
      full: 'Seluruh survei',
      currentPage: 'Hanya halaman saat ini ({{entityLabel}})',
    },
    currentPageUnavailable:
      'Tidak dapat menentukan instans halaman saat ini. Buka halaman tertentu atau ekspor seluruh survei.',
    includeQrCode: 'Sertakan kode QR',
    includeQrCodeInfo:
      'Menambahkan kode QR di halaman pertama yang menautkan ke salinan hanya baca dari PDF entitas halaman ini (berlaku selama 1 tahun).',
    orientation: 'Orientasi halaman',
    orientations: {
      portrait: 'Potret',
      landscape: 'Lanskap',
    },
    download: 'Unduh',
  },
  exportLabels_csv: 'Ekspor label (CSV)',
  exportLabels_xlsx: 'Ekspor label (Excel)',
  importLabels: 'Impor label dari Excel atau CSV',
  aiTranslateLabels: 'AI: Terjemahkan label',
  nodeDefsTranslation: {
    apply: 'Terapkan Terjemahan',
    applySuccess: 'Terjemahan berhasil diterapkan',
    aiSuggestion: 'AI',
    current: 'Saat ini',
    custom: 'Kustom',
    defaultDescription: 'Deskripsi bawaan',
    defaultLabel: 'Label bawaan',
    failed_other: 'AI tidak dapat menghasilkan {{count}} terjemahan; terjemahan tersebut tidak memiliki saran AI.',
    notDone_other:
      'Proses dihentikan sebelum {{count}} terjemahan diminta; terjemahan tersebut tidak memiliki saran AI.',
    path: 'Jalur',
    showDescriptions: 'Tampilkan deskripsi',
    title: 'Terjemahkan Label Definisi Node',
  },
}
