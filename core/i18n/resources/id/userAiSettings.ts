export default {
  section: 'Fitur AI',
  encryptionMissing:
    'Deployment ini tidak memiliki AI_USER_KEY_ENCRYPTION_SECRET; kunci API pribadi tidak dapat disimpan sampai administrator mengonfigurasinya.',

  model: 'Model',
  modelOther: 'Lainnya (ketik ID model)...',
  modelChooseFromList: 'Pilih dari daftar model',
  baseUrl: 'URL dasar',
  apiKey: 'Kunci API',
  apiKeyPlaceholder: 'Tempel kunci API penyedia Anda',
  apiKeySaved: 'Kunci disimpan',
  unknownError: 'Kesalahan tidak diketahui',
  apiKeyKept: 'Biarkan kosong untuk mempertahankan kunci yang ada.',
  apiKeyUnreadable:
    'Kunci API yang tersimpan tidak dapat dibaca lagi (rahasia enkripsi server telah berubah). Masukkan kunci lagi.',
  vercelAiSdkHint:
    'Endpoint chat Vercel AI SDK diperlakukan sebagai agen tetap - pemilihan model dan kunci API tidak berlaku. Pembuatan teks bebas berfungsi; fitur keluaran terstruktur mungkin tidak.',
  modelsFetchFailed: 'Tidak dapat mengambil model: {{message}}',

  savedSuccessfully: 'Pengaturan AI disimpan.',
  saveFailed: 'Gagal menyimpan pengaturan AI: {{message}}',

  status: {
    ready: 'Siap',
    notTested: 'Belum diuji',
    notAvailable: 'Tidak tersedia',
    notSetUp: 'Belum disiapkan',
  },
  where: {
    onDevice: 'Komputer ini',
    orgHosted: 'Server organisasi',
    cloudOwnKey: 'Cloud · kunci Anda',
    cloud: 'Cloud',
  },
  localServer: {
    where: 'Di komputer ini atau jaringan Anda',
    baseUrl: 'URL server',
    answered: 'Merespons',
    noModels: 'Server tidak mencantumkan model apa pun. Muat model di server lokal Anda.',
    contextTokens_other: 'Konteks: {{count}} token',
    contextUnknown: 'Konteks: tidak diketahui (diasumsikan 8.192 token)',
    model: 'Model',
    modelPlaceholder: 'Uji koneksi untuk menampilkan daftar model',
    help: 'Jalankan server lokal Anda (misalnya LM Studio atau Ollama) dan izinkan permintaan dari situs ini (CORS). Peramban Anda mungkin meminta izin untuk mengakses perangkat di jaringan lokal.',
    httpsHint:
      'Arena disajikan melalui HTTPS: server di komputer lain dalam jaringan Anda memerlukan HTTPS, atau peramban dengan Local Network Access (Chrome) dan izin Anda.',
    cloudWarning:
      'Alamat ini tidak berada di perangkat ini maupun dalam daftar server organisasi: kebijakan AI survei memperlakukannya sebagai layanan cloud.',
    notSaved: 'Pengaturan server AI lokal tidak dapat disimpan di peramban ini (penyimpanan diblokir atau penuh).',
  },
  list: {
    section: 'Penyedia',
    add: 'Tambah penyedia',
    arenaDefault: 'Bawaan Arena',
    default: 'Bawaan',
    defaultMissing:
      'Penyedia bawaan Anda adalah Server lokal yang disimpan di peramban lain. Jadikan penyedia lain sebagai bawaan untuk menggunakan AI di sini.',
    footerHint: 'Penyedia disimpan saat Anda menambahkannya. Apa yang dapat dilihat AI disimpan dengan Simpan.',
    menu: 'Tindakan untuk {{name}}',
    makeDefault: 'Jadikan bawaan',
    test: 'Uji koneksi',
    edit: 'Sunting…',
    remove: 'Hapus',
    removeConfirm: 'Hapus {{name}}? Percakapan yang menggunakannya akan memakai penyedia bawaan Anda.',
    removed: '{{name}} telah dihapus.',
    defaultChanged: '{{name}} sekarang menjadi penyedia bawaan Anda.',
    testOk: '{{name}} merespons.',
    testFailed: '{{name}} tidak merespons. Sunting untuk memeriksa pengaturannya.',
    actionFailed: 'Perubahan tidak dapat disimpan: {{message}}',
  },
  types: {
    local: 'Server lokal',
    orgServer: 'Server organisasi',
    openai: 'OpenAI',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    'google-vertex': 'Google Vertex AI (Gemini)',
    'openai-compatible': 'Kompatibel dengan OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock (server uji)',
  },
  defaultName: {
    local: 'Server lokal',
    orgServer: 'Server organisasi',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    'google-vertex': 'Google Vertex AI',
    'openai-compatible': 'Kompatibel dengan OpenAI',
    'vercel-ai-sdk': 'Vercel AI SDK',
    mock: 'Mock',
  },
  typeHints: {
    orgServer: 'Server yang kompatibel dengan OpenAI dalam daftar organisasi Anda.',
    'openai-compatible': 'Azure, OpenRouter, …',
    'google-vertex': 'Kunci API Vertex AI (mode ekspres); ketik modelnya, mis. gemini-2.5-flash.',
    'vercel-ai-sdk': 'Endpoint chat yang dibangun dengan Vercel AI SDK.',
  },
  dialog: {
    addTitle: 'Tambah penyedia AI',
    editTitle: 'Sunting {{name}}',
    groupLocal: 'Di komputer atau jaringan Anda',
    groupCloud: 'Cloud, dengan kunci API Anda',
    back: 'Kembali',
    name: 'Nama (opsional)',
    test: 'Uji',
    testOk: 'Merespons dalam {{latencyMs}} ms',
    add: 'Tambah penyedia',
    save: 'Simpan',
    testFirst: 'Uji koneksi sebelum menyimpan.',
    orgServerHint: 'Server dalam daftar organisasi Anda: {{urls}}',
    orgServerNotAllowed: 'Alamat ini tidak ada dalam daftar server organisasi Anda.',
    apiKeyCleared: 'Alamat telah berubah: masukkan kunci API lagi.',
    removeKey: 'Hapus kunci',
    keepKey: 'Pertahankan kunci',
    apiKeyRemoved: 'Kunci yang tersimpan akan dihapus. Uji koneksi, lalu simpan.',
    localUrlHint:
      'Alamat ini berada di komputer atau jaringan Anda: server Arena tidak dapat menjangkaunya. Tambahkan sebagai Server lokal.',
    useLocalServer: 'Tambah Server lokal',
  },
  dataClasses: {
    none: 'Tanpa konten survei',
    schema: 'Desain survei',
    data: 'Data catatan',
  },
  access: {
    section: 'Apa yang dapat dilihat AI',
    levels: {
      off: 'Nonaktif',
      help: 'Hanya bantuan',
      design: '+ Desain survei',
      data: '+ Data catatan',
    },
    classes: {
      help: { title: 'Bantuan Arena', text: 'Pertanyaan Anda dan kutipan dari panduan pengguna Arena.' },
      design: {
        title: 'Desain survei',
        text: 'Entitas, atribut, label, kategori, dan ekspresi. Tanpa nilai catatan.',
      },
      data: {
        title: 'Data catatan',
        text: 'Nilai catatan dan hasil kueri. Secara bawaan, hanya server di perangkat ini yang boleh menerimanya.',
      },
    },
    count: '{{on}} dari {{total}} fitur aktif',
    off: 'Fitur AI nonaktif',
    customize: 'Sesuaikan',
    customizeHint: 'Kebijakan AI setiap survei tetap dapat memblokir penyedia.',
    sendsInfo: 'Apa yang dikirim',
  },
  features: {
    chat: {
      label: 'Asisten bantuan',
      sends: 'Pertanyaan Anda, kutipan dari panduan pengguna Arena, dan posisi Anda di Arena (nama modul).',
    },
    assistantSuggestions: {
      label: 'Saran proaktif',
      sends: 'Tidak ada, sampai Anda mengklik Lakukan pada sebuah saran. Pemeriksaan berjalan di peramban Anda.',
    },
    expressions: {
      label: 'Ekspresi',
      sends:
        'Atribut dan atribut saudaranya (nama dan jenis), ekspresi, dan deskripsi Anda. Jika mencoba ulang atau menjelaskan kesalahan, juga ekspresi yang gagal beserta pesan kesalahannya.',
    },
    translation: {
      label: 'Terjemahan label',
      sends:
        "Label atau deskripsi yang Anda terjemahkan, beserta kode bahasanya. 'AI: Terjemahkan label' di Perancang Formulir mengirim label dan deskripsi semua entitas dan atribut.",
    },
    assistantDesign: {
      label: 'Asisten desain',
      sends: 'Struktur survei yang dimintanya: entitas, atribut, label, kategori, dan ekspresi.',
    },
    dataQuery: {
      label: 'Kueri data',
      sends:
        'Nama, jenis, dan label atribut dari entitas survei, nama kategori, deskripsi Anda, dan, untuk ringkasan, kueri beserta filternya. Tanpa nilai catatan.',
    },
    dataDictionary: {
      label: 'Kamus data',
      sends: 'Nama survei dan, untuk setiap entitas atau atribut tanpa deskripsi, nama, jenis, dan entitas induknya.',
    },
    assistantAnalysis: {
      label: 'Asisten analisis',
      sends:
        'Struktur survei, lalu jumlah catatan dan hasil kueri (hingga 200 grup atau 50 baris) setiap kali menjalankan kueri.',
    },
    assistantCleaning: {
      label: 'Asisten pembersihan',
      sends:
        'Struktur survei, kesalahan validasi beserta kunci dan nilai catatannya, nilai catatan yang diperiksanya dan, saat menjalankan kueri, hasilnya (jumlah catatan dan hingga 200 grup atau 50 baris). Asisten mengusulkan suntingan yang Anda tinjau.',
    },
    userActivity: {
      label: 'Ringkasan aktivitas',
      sends: 'Nama survei, nama pengguna, jenis aktivitas, jumlah, dan tanggal dari log aktivitas.',
    },
  },
}
