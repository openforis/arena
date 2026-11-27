export default {
  // the assistant button when suggestions wait (screen readers; the dot shows it)
  buttonLabel_other: 'Asisten AI: {{count}} saran',
  listLabel: 'Saran',
  doIt: 'Lakukan',
  dismiss: 'Abaikan',
  moduleIntro: {
    card: {
      designer: 'Baru mengenal perancang formulir? Tanyakan kepada saya cara kerjanya.',
      data: 'Baru mengenal modul Data? Tanyakan kepada saya cara kerjanya.',
      analysis: 'Baru mengenal modul Analisis? Tanyakan kepada saya cara kerjanya.',
    },
    request: {
      designer: 'Bagaimana cara kerja perancang formulir?',
      data: 'Bagaimana cara kerja modul Data?',
      analysis: 'Bagaimana cara kerja modul Analisis?',
    },
  },
  missingTranslations: {
    card_other: '{{count}} teks belum tersedia dalam {{language}}. Terjemahkan?',
    request_other: 'Terjemahkan {{count}} teks yang belum tersedia ke dalam {{language}}.',
  },
  newEntriesDescriptions: {
    card_other: 'Anda menambahkan {{count}} entri tanpa deskripsi. Tulis deskripsi dalam semua bahasa?',
    request_other: 'Tulis deskripsi dalam semua bahasa untuk {{count}} entri baru.',
  },
  entityWithoutKey: {
    cardSingle: '{{name}} tidak memiliki atribut kunci. Sarankan satu?',
    card_other: '{{count}} entitas tidak memiliki atribut kunci. Sarankan kunci?',
    requestSingle: 'Sarankan atribut kunci untuk {{name}}.',
    request_other: 'Sarankan atribut kunci untuk {{count}} entitas.',
  },
  attributeWithoutRef: {
    cardCategory: '{{name}} tidak memiliki kategori. Pilih satu?',
    cardTaxonomy: '{{name}} tidak memiliki taksonomi. Pilih satu?',
    card_other: '{{count}} atribut tidak memiliki kategori atau taksonomi. Pilih?',
    requestCategory: 'Pilih kategori untuk {{name}}.',
    requestTaxonomy: 'Pilih taksonomi untuk {{name}}.',
    request_other: 'Pilih kategori atau taksonomi untuk {{count}} atribut.',
  },
  publishErrors: {
    card_other: '{{count}} entri memiliki kesalahan. Penerbitan akan gagal. Perbaiki?',
    request_other: 'Perbaiki kesalahan pada {{count}} entri sebelum menerbitkan.',
  },
  categoryItemTranslations: {
    card_other: '{{count}} label kategori belum tersedia dalam {{language}}. Terjemahkan?',
    request_other: 'Terjemahkan {{count}} label kategori yang belum tersedia ke dalam {{language}}.',
  },
  validationErrors: {
    card: '{{count}} pesan validasi dalam siklus ini. Rangkum polanya?',
    request: 'Rangkum pola dari {{count}} pesan validasi dalam siklus ini.',
  },
  dataImported: {
    card: '{{count}} catatan diimpor. Lihat ikhtisar singkat?',
    cardOne: '1 catatan diimpor. Lihat ikhtisar singkat?',
    request: 'Berikan ikhtisar singkat tentang {{count}} catatan yang diimpor.',
    requestOne: 'Berikan ikhtisar singkat tentang catatan yang diimpor.',
  },
}
