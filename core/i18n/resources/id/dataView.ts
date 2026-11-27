export default {
  charts: {
    downloadToPng: 'Unduh bagan sebagai PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Pilih satu dimensi dan satu ukuran untuk menampilkan bagan',
      selectAtLeast2NumericAttributes: 'Pilih 2 atribut numerik untuk menampilkan bagan',
      tooManyItemsToShowChart: `Terlalu banyak item untuk menampilkan bagan;
maksimum {{maxItems}} item yang diharapkan.
Persempit kueri Anda (mis. dengan menambahkan filter) untuk mengurangi jumlah item.
`,
      sampleRandomOnly: 'Menampilkan sampel acak {{sampleSize}} dari {{totalCount}} item (tidak ditemukan pencilan).',
      sampleWithOutliers:
        'Menampilkan {{sampleSize}} dari {{totalCount}} item: {{outliersCount}} pencilan dan sampel acak {{randomCount}} dari item lainnya.',
      sampleOutliersOnly: 'Menampilkan {{sampleSize}} pencilan paling ekstrem dari {{totalCount}} item.',
    },
    type: {
      area: 'Bagan area',
      bar: 'Bagan batang',
      line: 'Bagan garis',
      pie: 'Bagan pai',
      scatter: 'Bagan sebar',
    },
  },
  dataQuery: {
    aggregateFunctionsOf: 'Fungsi agregat dari {{name}}',
    ai: {
      button: 'Tanya AI',
      buttonTitle: 'Buat kueri dari deskripsi menggunakan AI',
      title: 'Buat kueri dengan AI',
      hint: 'Jelaskan data yang ingin Anda lihat; AI akan memilih entitas, atribut (atau dimensi dan ukuran), filter, dan pengurutan. Anda kemudian dapat meninjau kueri yang dibuat dan menyimpannya dari pengelola kueri.',
      placeholder: 'mis. jumlah pohon dikelompokkan berdasarkan spesies',
      generate: 'Buat',
      generating: 'Membuat…',
      replaceQueryConfirmMessage: 'Ganti kueri saat ini dengan kueri yang dibuat?',
      suggestSummary: 'Sarankan nama dan deskripsi',
      suggestSummaryFailed: 'Tidak dapat menyarankan nama dan deskripsi kueri: {{message}}',
      suggestSummaryTitle: 'Gunakan AI untuk menyarankan nama, label, dan deskripsi kueri berdasarkan pilihan saat ini',
      generatedSuccessfully:
        'Kueri dibuat: {{explanation}} Periksa hasilnya dan simpan kueri jika Anda ingin menyimpannya.',
    },
    customAggregateFunctions: 'Fungsi agregat kustom…',
    deleteConfirmMessage: 'Hapus kueri "{{name}}"?',
    displayType: {
      chart: 'Bagan',
      table: 'Tabel',
    },
    manageQueries: 'Kelola kueri',
    mode: {
      aggregate: 'Agregat',
      raw: 'Mentah',
      rawEdit: 'Sunting mentah',
    },
    replaceQueryConfirmMessage: 'Ganti kueri saat ini dengan kueri yang dipilih?',
    showCodes: 'Tampilkan kode',
    showTotalAndPercentage: 'Tampilkan total dan persentase',
    total: 'Total',
    viewOptions: 'Tampilan',
  },
  editSelectedRecord: 'Sunting catatan yang dipilih',
  filterAttributeTypes: 'Filter jenis atribut',
  filterAttributes: 'Filter atribut',
  filterMessages: 'Filter pesan',
  messageTypeFilter: {
    valueRequired: 'Nilai wajib',
    valueInvalid: 'Nilai tidak valid',
    uniqueDuplicate: 'Nilai duplikat',
    customValidation: 'Validasi kustom',
    entityKeyDuplicate: 'Kunci entitas duplikat',
    recordKeyDuplicate: 'Kunci catatan duplikat',
    nodesCount: 'Jumlah node',
  },
  filterRecords: {
    buttonTitle: 'Filter catatan',
    expressionEditorHeader: 'Ekspresi untuk menyaring catatan',
  },
  invalidRecord: 'Catatan tidak valid',
  nodeDefsSelector: {
    hide: 'Sembunyikan Pemilih Definisi Node',
    show: 'Tampilkan Pemilih Definisi Node',
    nodeDefFrequency: `{{nodeDefLabel}} (frekuensi)`,
    searchPlaceholder: 'Cari variabel berdasarkan nama',
  },
  records: {
    clone: 'Kloning',
    confirmDeleteRecord: `Hapus catatan "{{keyValues}}"?`,
    confirmDeleteSelectedRecord_other: `Hapus {{count}} catatan yang dipilih?`,
    confirmMergeSelectedRecords: `### Gabungkan catatan yang dipilih menjadi satu?

- catatan "sumber" akan digabungkan ke dalam catatan "target":
  - sumber: [{{sourceRecordKeys}}], diubah {{sourceRecordModifiedDate}};
  - target: [{{targetRecordKeys}}], diubah {{targetRecordModifiedDate}};

- pratinjau hasil akan ditampilkan sebelum penggabungan dilakukan;

- setelah penggabungan dikonfirmasi, **catatan sumber AKAN DIHAPUS**`,
    confirmUpdateRecordsStep: `Pindahkan {{count}} catatan yang dipilih dari {{stepFrom}} ke {{stepTo}}?`,
    confirmUpdateRecordOwner: `Ubah pemilik catatan yang dipilih menjadi {{ownerName}}?`,
    confirmValidateAllRecords: `Validasi ulang semua catatan?\n\nProses ini mungkin memerlukan beberapa menit.`,
    deleteRecord: 'Hapus catatan',
    demoteAllRecordsFromAnalysis: 'Analisis -> Pembersihan',
    demoteAllRecordsFromCleansing: 'Pembersihan -> Entri',
    editRecord: 'Sunting catatan',
    exportList: 'Ekspor daftar',
    exportData: 'Ekspor data',
    exportDataSummary: 'Ekspor ringkasan data',
    exportSelectedRecordsArenaFormat: 'Ekspor catatan yang dipilih (format Arena)',
    exportRecordDocx: 'Ekspor catatan (Word)',
    filterPlaceholder: 'Filter berdasarkan kunci atau pemilik',
    merge: {
      label: 'Gabungkan',
      confirmLabel: 'Konfirmasi penggabungan',
      confirmTooManyDifferencesMessage: `**Terlalu banyak perbedaan**.
Tampaknya catatan-catatan ini sangat berbeda satu sama lain.
Banyak atribut (~{{nodesUpdated}}) akan diperbarui selama penggabungan.
Lanjutkan ke pratinjau penggabungan?`,
      noChangesWillBeApplied: `Tidak ada perubahan yang akan diterapkan pada catatan target.
Penggabungan tidak dapat dilakukan.`,
      performedSuccessfullyMessage: 'Penggabungan catatan berhasil dilakukan!',
      previewTitle: 'Pratinjau penggabungan (catatan {{keyValues}})',
    },
    noRecordsAdded: 'Belum ada catatan yang ditambahkan',
    noRecordsAddedForThisSearch: 'Tidak ada catatan yang ditemukan',
    noSelectedRecordsInStep: 'Tidak ada catatan yang dipilih pada tahap {{step}}',
    owner: 'Pemilik',
    promoteAllRecordsToAnalysis: 'Pembersihan -> Analisis',
    promoteAllRecordsToCleansing: 'Entri -> Pembersihan',
    step: 'Tahap',
    updateRecordsStep: 'Perbarui tahap catatan',
    validateAll: 'Validasi semua',
    formPreview: 'Pratinjau formulir',
    formPreviewInfo: 'Pratinjau formulir draf (belum diterbitkan): data yang dimasukkan dalam pratinjau tidak disimpan',
    viewRecord: 'Lihat catatan',
  },
  recordsClone: {
    title: 'Kloning catatan',
    fromCycle: 'Dari siklus',
    toCycle: 'Ke siklus',
    confirmClone: `Kloning catatan dari siklus {{cycleFrom}} ke siklus {{cycleTo}}?\n
(Hanya catatan yang belum ada di siklus {{cycleTo}} yang akan dikloning)`,
    startCloning: 'Mulai kloning',
    cloneComplete: 'Kloning selesai. {{recordsCloned}} catatan dikloning dari {{cycleFrom}} ke {{cycleTo}}',
    error: {
      cycleToMissing: 'Pilih "Ke siklus"',
      cycleToMustBeDifferentFromCycleFrom: '"Ke siklus" harus berbeda dari "Dari siklus"',
    },
    source: {
      label: 'Sumber',
      allRecords: 'Semua catatan di siklus {{cycleFrom}} yang belum ada di siklus {{cycleTo}}',
      selectedRecords: 'Hanya {{selectedRecordsCount}} catatan yang dipilih',
    },
  },
  recordDeleted_other: `{{count}} catatan berhasil dihapus!`,
  recordsSource: {
    label: 'Sumber',
  },
  recordsUpdated: '{{count}} catatan berhasil diperbarui!',
  rowNum: 'Baris #',
  selectedAttributes: 'Atribut yang dipilih:',
  selectedDimensions: 'Dimensi yang dipilih',
  selectedMeasures: 'Ukuran yang dipilih',
  sortableItemsInfo: 'Seret & lepas untuk mengurutkan',
  showValidationReport: 'Tampilkan laporan validasi',
  sort: 'Urutkan',
  dataExport: {
    source: {
      label: 'Sumber',
      allRecords: 'Semua catatan',
      filteredRecords: 'Hanya catatan yang difilter',
      selectedRecord: 'Hanya catatan yang dipilih',
      selectedRecord_other: 'Hanya {{count}} catatan yang dipilih',
    },
    title: 'Ekspor data',
  },
  dataMatrixExport: {
    intro: `Ekspor data **{{entity}}** sebagai tabel dengan:

- satu **baris** untuk setiap nilai berbeda dari atribut baris (mis. setiap spesies dan lapisan);
- satu **kolom** untuk setiap catatan, dinamai sesuai kuncinya ({{keys}});
- di dalam sel, nilai dari atribut nilai (mis. tutupan).

Ini adalah format yang digunakan oleh alat analisis vegetasi seperti Turboveg, Juice, dan Synbiosys.`,
    layout: {
      dataMatrix: 'Matriks data',
      info: 'Tabel: baris dan kolom seperti yang ditampilkan di Penjelajah Data. Matriks data: satu baris per spesies (atau atribut lain) dan satu kolom per catatan, sesuai kebutuhan alat analisis vegetasi seperti Turboveg.',
      label: 'Ekspor sebagai',
      table: 'Tabel',
    },
    preview: 'Pratinjau',
    previewRecord: '{{keys}} dari catatan {{number}}',
    recordKeys: 'Atribut kunci yang digunakan untuk menamai kolom catatan',
    recordKeysInfo:
      'Setiap catatan menjadi satu kolom, dinamai sesuai nilai atribut kunci yang dipilih (mis. hanya nomor plot). Secara bawaan, atribut kunci yang dipilih di Penjelajah Data akan digunakan, atau semuanya jika tidak ada yang dipilih. Minimal satu diperlukan.',
    recordsAll:
      'Data dari semua catatan akan diekspor: atur filter di Penjelajah Data untuk mengekspor hanya sebagian catatan.',
    recordsFiltered: 'Hanya data yang sesuai dengan filter Penjelajah Data saat ini yang diekspor.',
    rowAttribute: 'Baris (nama atribut takson, mis. spesies)',
    rowAttributeInfo:
      'Setiap nilai berbeda dari atribut ini menjadi satu baris tabel. Atribut takson diekspor dengan nama ilmiahnya, karena semua takson yang tidak terdaftar memiliki kode yang sama.',
    secondRowAttribute: 'Atribut baris kedua, opsional (mis. lapisan)',
    secondRowAttributeInfo:
      'Gunakan jika spesies yang sama dapat muncul lebih dari sekali dalam satu catatan (mis. di lapisan yang berbeda): setiap kombinasi menjadi baris terpisah.',
    valueAttribute: 'Nilai (mis. tutupan)',
    valueAttributeInfo:
      'Nilai yang ditampilkan di sel. Atribut kode diekspor dengan kodenya, bukan labelnya. Jika sebuah baris muncul lebih dari sekali dalam satu catatan dengan nilai berbeda, sel tersebut berisi semua nilainya.',
  },
  dataVis: {
    errorLoadingData: 'Kesalahan saat memuat data',
    noData: 'Kueri ini tidak menghasilkan data',
    noSelection: 'Buat pilihan Anda menggunakan panel sisi kiri atau pilih kueri yang ada dari "Kelola kueri"',
  },
  viewSelectedRecord: 'Lihat catatan yang dipilih',
  mapView: {
    layersControl: {
      areasOfInterest: 'Area minat',
      baseLayers: 'Lapisan dasar',
      inputData: 'Data masukan',
      preloadedLayers: 'Lapisan pramuat',
      samplingPointData: 'Data titik sampel',
    },
    layersPanel: {
      markers: '{{count}} penanda',
      markers_other: '{{count}} penanda',
    },
  },
}
