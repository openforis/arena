export default {
  title: `Yang baru di Arena`,
  since: 'Sejak versi {{version}}',
  experimental: 'Eksperimental',
  dontShowAgain: `Jangan tampilkan lagi`,
  showChangelog: `Semua perubahan dan perbaikan (changelog)`,
  slideCounter: '{{current}} dari {{total}}',
  noItems: 'Tidak ada fitur baru untuk ditampilkan.',
  items: {
    appInfoAndNodeDateFunctions: {
      title: 'Fungsi ekspresi baru: info aplikasi dan tanggal node',
      description: `Fungsi baru untuk nilai bawaan, relevansi, dan aturan validasi:

- **appId()**, **appIdLabel()**, **appPlatform()**, **appVersion()**: aplikasi yang menyunting catatan (\`arena\` / \`am\`, **Arena** / **Arena Mobile**), platformnya (\`web\`, \`android\` atau \`ios\`) dan versinya. Fungsi ini dievaluasi saat catatan dibuat dan lagi saat catatan disunting dengan aplikasi, platform, atau versi aplikasi lain: mis. atribut **Hanya baca** dengan nilai bawaan \`appIdLabel()\` dan **Nilai bawaan dievaluasi hanya sekali** menyimpan aplikasi yang membuat catatan.
- **nodeDateCreated(node)**, **nodeDateModified(node)**: tanggal dan waktu pembuatan dan perubahan terakhir sebuah atribut atau entitas; untuk entitas, waktu terakhir nilai apa pun di dalamnya berubah, mis. \`nodeDateModified(parent(this))\`.

Di editor ekspresi dasar, pilih fungsi tersebut dalam daftar **Fungsi**: pembuat fungsi tanggal node menampilkan atribut yang dapat dijangkau dari node saat ini dan entitas leluhurnya.`,
    },
    googleSignIn: {
      title: 'Masuk dengan akun Google Anda',
      description: `Di halaman masuk, klik **Masuk dengan Google** untuk masuk dengan akun Google Anda (Gmail atau Google Workspace) tanpa mengetik kata sandi.

Pertama kali, akun Google ditautkan ke akun Arena Anda melalui alamat emailnya: gunakan alamat email yang sama dengan akun Arena Anda. Pengguna yang diundang juga dapat menerima undangan dengan Google. Tautkan atau lepaskan tautan akun Google Anda di **Profil saya > Metode masuk**; masuk dengan email dan kata sandi tetap tersedia.`,
    },
    twoFactorAuth: {
      title: 'Autentikasi dua faktor',
      description: `Lindungi akun Anda dengan **autentikasi dua faktor (2FA)**: setelah kata sandi, Arena meminta kode verifikasi yang dibuat oleh aplikasi autentikator di ponsel Anda (mis. Google Authenticator atau Authy).

Di **Profil saya > Masuk & keamanan**, klik **Kelola 2FA**, tambahkan perangkat, dan pindai kode QR dengan aplikasi tersebut. Simpan kode cadangan yang ditampilkan di akhir: masing-masing memungkinkan Anda masuk satu kali jika ponsel Anda hilang.`,
    },
    aiFeatures: {
      title: 'Fitur AI',
      description: `Di **Profil saya > Fitur AI**, pilih **Apa yang dapat dilihat AI**:

- **Hanya bantuan**: pertanyaan Anda dan kutipan dari panduan pengguna Arena;
- **+ Desain survei**: juga entitas, atribut, label, kategori, dan ekspresi (tanpa nilai catatan);
- **+ Data catatan**: juga nilai catatan dan hasil kueri.

Dengan **Sesuaikan**, Anda dapat mengaktifkan atau menonaktifkan fitur satu per satu. Di **Penyedia**, gunakan penyedia **Bawaan Arena** atau tambahkan penyedia Anda sendiri: **Server lokal** di komputer atau jaringan Anda (mis. LM Studio atau Ollama) atau penyedia cloud dengan kunci API Anda (OpenAI, Anthropic, Google Gemini, dan lainnya).`,
    },
    aiAssistant: {
      title: 'Asisten AI',
      description: `Klik tombol **Asisten AI** di header untuk membuka panel yang bekerja pada layar yang sedang Anda gunakan:

- **Desain**: membangun dan mengubah survei di perancang formulir;
- **Analisis**: menjawab pertanyaan tentang data dengan kueri;
- **Pembersihan**: mencari kesalahan dalam catatan dan mengusulkan perbaikan;
- **Bantuan**: menjawab pertanyaan tentang Arena.

Perubahan yang diusulkan hanya diterapkan setelah Anda meninjaunya. **Saran** (mis. label yang belum tersedia dalam suatu bahasa) muncul di panel: klik salah satunya agar asisten melakukannya.`,
    },
    surveyAiPolicy: {
      title: 'Kebijakan AI survei',
      description: `Di **Info Survei > Kebijakan AI**, administrator survei memilih di mana AI boleh memproses konten survei, secara terpisah untuk **Desain survei** dan **Data catatan**: **Nonaktif**, **Di perangkat ini** (server AI lokal), **Server organisasi**, atau **Cloud**.

Yang lebih ketat antara kebijakan ini dan batasan server Arena berlaku untuk setiap pengguna survei.`,
    },
    mobileUploadEmailNotification: {
      title: 'Notifikasi email untuk catatan yang diunggah dari Arena Mobile',
      description: `Di **Info Survei → Keamanan**, centang **Beri tahu administrator survei melalui email saat catatan diunggah dari Arena Mobile**: setelah setiap unggahan, setiap administrator survei menerima email berisi daftar catatan yang diunggah, dengan nilai kuncinya, apakah catatan baru atau diperbarui, pengguna yang membuatnya, tanggal, serta jumlah kesalahan dan peringatan validasi.

Satu email dikirim per unggahan, meskipun satu perangkat mengunggah banyak catatan. Opsi ini tersedia jika **Izinkan mengunggah catatan dari Arena Mobile ke server** dicentang, dan berlaku setelah survei diterbitkan.`,
    },
    surveyGuestRole: {
      title: 'Peran baru: Tamu, untuk melihat catatan tanpa menyuntingnya',
      description: `Undang pengguna dengan peran baru **Tamu** (**Pengguna > Undang pengguna**): mereka dapat melihat semua catatan survei, juga di **Arena Mobile**, tetapi tidak dapat menyunting atau menghapusnya, maupun menambahkan catatan baru.

Tambahkan tamu ke **grup pengguna** (**Pengguna > Grup Pengguna**) dengan kualifikasi untuk menampilkan hanya sebagian data: catatan yang atribut kualifikasinya cocok dengan nilai grup (mis. plot di suatu wilayah). Grup dengan pengaturan **Dapat melihat catatan dari** juga memberikan akses ke catatan grup lain.

Survei yang sudah ada mendapatkan peran baru ini secara otomatis.`,
    },
    areaOfInterest: {
      title: 'Area minat: periksa apakah suatu lokasi berada di dalam area',
      description: `Di **Info Survei → Peta**, tambahkan satu atau beberapa **area minat** (mis. kabupaten di suatu wilayah percontohan), masing-masing dengan nama dan poligon dalam format GeoJSON. Periksa area tersebut di peta saat menambahkannya, satu per satu atau sekaligus (**Tampilkan semua di peta**), dan tampilkan sebagai lapisan di **Data > Peta**.

Fungsi ekspresi baru \`geoDistanceToAOIBoundary(location, 'area_name')\` mengembalikan jarak dalam meter antara suatu lokasi dan batas area: negatif di dalam, positif di luar. Bandingkan dengan akurasi GPS (\`location.accuracy\`) untuk mengklasifikasikan lokasi sebagai di dalam, di luar, atau tidak pasti, mis. dalam nilai bawaan atribut hanya baca dan dalam aturan validasi dengan tingkat *peringatan*. \`geoAOIContaining(location)\` mengembalikan nama area yang memuat lokasi tersebut. Keduanya juga berfungsi secara offline di **Arena Mobile**.

Terima kasih kepada **[ASSEDEV Alerte Environnement](https://assedev.fr)** atas permintaannya.`,
    },
    dataQueryTotals: {
      title: 'Total dan persentase di Penjelajah Data',
      description: `Di **Data > Penjelajah**, dalam mode **Agregat** dengan satu ukuran (mis. jumlah volume pohon per spesies), buka menu **Tampilan** dan pilih **Tampilkan total dan persentase**: setiap baris menampilkan persentasenya terhadap total, dan baris **Total** ditambahkan di bagian bawah tabel.

Opsi **Tampilkan nama** dan **Tampilkan kode** juga ada di menu **Tampilan**.`,
    },
    mapWorkspace: {
      title: 'Ruang kerja peta baru',
      description: `**Data > Peta** memiliki tata letak baru: menu **Peta dasar**, **Tambah data**, **Tampilan**, dan **Alat** serta kotak pencarian untuk koordinat dan kunci catatan di bagian atas, tab **Lapisan**, **Catatan**, dan **Legenda** di samping, serta bilah status dengan koordinat penunjuk dan skala.

Telusuri catatan di peta, tambahkan file Anda sendiri (KML, Shapefile, GeoJSON) atau layanan WMS / WMTS, ukur jarak dan luas, dan ambil tangkapan layar.`,
    },
    dataMatrixExport: {
      title: `Ekspor data sebagai matriks`,
      description: `Di **Data > Penjelajah**, pilih entitas jamak (mis. spesies dari setiap catatan), klik **Ekspor** dan pilih **Ekspor sebagai: Matriks data** untuk mendapatkan tabel dengan satu baris per spesies (atau atribut lainnya) dan satu kolom per catatan, dengan nilai yang Anda pilih di dalam sel (mis. tutupan).

Ini adalah format yang dibutuhkan oleh alat analisis vegetasi seperti **Turboveg**, **Juice**, dan **Synbiosys**. Tetapkan filter di Penjelajah untuk mengekspor hanya sebagian catatan.`,
    },
    mobilePreview: {
      title: 'Pratinjau survei di Arena Mobile',
      description: `Di perancang formulir, buka menu di samping tombol **Pratinjau** dan pilih **Pratinjau (seluler)** untuk mencoba survei draf seperti tampilannya di **Arena Mobile**, di ponsel atau tablet, dalam orientasi potret atau lanskap.

Pratinjau berjalan di peramban: beberapa fitur perangkat sungguhan (mis. peta dan kamera) tidak tersedia.`,
    },
    requiredIf: {
      title: 'Atribut wajib bersyarat',
      description: `Di perancang formulir, pada tab **Validasi** sebuah atribut, pilih **Wajib jika kondisi terpenuhi** dan tulis kondisinya: atribut hanya wajib diisi jika kondisi bernilai benar.

Selama entri data, kesalahan "Nilai wajib diisi" hanya ditampilkan jika kondisi terpenuhi.`,
    },
    themeSelector: {
      title: 'Tema terang dan gelap',
      description: `Gunakan menu **Tema** di header (juga di halaman masuk) untuk beralih antara tema **Terang** dan **Gelap**, atau mengikuti **Bawaan sistem**.`,
    },
    surveyCompare: {
      title: 'Bandingkan dan perbarui survei',
      description: `Di **Dasbor**, gunakan **Fungsi lanjutan > Bandingkan / perbarui dari file** untuk membandingkan survei ini dengan survei yang diekspor dari server Arena lain (mis. server uji) atau dengan survei lain di server ini.

Tinjau perbedaannya dan terapkan hanya perubahan yang Anda pilih: perubahan disimpan sebagai draf sampai Anda menerbitkan survei.`,
    },
    usersBackup: {
      title: 'Cadangkan dan pulihkan pengguna',
      description: `Di **Pengguna**, gunakan **Cadangkan / Pulihkan** untuk mengekspor semua pengguna, beserta peran survei dan grup penggunanya, lalu memulihkannya ke server Arena lain.

Sebelum memulihkan, Anda dapat memilih tindakan untuk setiap pengguna.`,
    },
    samplingPointDataWhisp: {
      title: 'Analisis Whisp untuk titik sampel',
      description: `Di kategori **data titik sampel**, gunakan **Buat analisis Whisp** untuk menganalisis semua lokasi titik sampel dengan **Open Foris Whisp**.

Analisis berjalan di latar belakang dan hasilnya disimpan dalam kategori baru.`,
    },
    dashboardUpgrade: {
      title: 'Dasbor baru',
      description: `**Dasbor** memiliki tampilan baru: catatan dan kontributor secara sekilas, peta data yang dikumpulkan, dan tren catatan yang ditambahkan dari waktu ke waktu.`,
    },
    clearNonApplicableValues: {
      title: 'Nilai yang tidak relevan dikosongkan',
      description: `Selama entri data, jika suatu perubahan membuat kolom lain tidak lagi relevan, nilainya dikosongkan setelah meminta konfirmasi Anda.

Administrator survei dapat mempertahankan perilaku lama dengan **Pertahankan nilai atribut yang tidak relevan** (**Info Survei > Keamanan**).`,
    },
    systemLogs: {
      title: 'Log sistem',
      description: `Di **Administrasi Sistem > Log Sistem**, ikuti log server secara langsung, dengan filter teks dan tingkat.`,
    },
    dataQueryAiGenerate: {
      title: 'Buat kueri Penjelajah Data dengan AI',
      description: `Di **Penjelajah Data**, jelaskan data yang Anda cari dalam bahasa sehari-hari (mis. *"jumlah pohon per spesies di setiap provinsi"*) dan biarkan AI menyusun kuerinya untuk Anda.

AI juga dapat menyarankan nama dan deskripsi saat Anda menyimpan kueri.

*Memerlukan fitur AI yang diaktifkan di profil pengguna Anda.*`,
    },
    recordPrint: {
      title: 'Cetak catatan',
      description: `Ekspor catatan sebagai dokumen **Word** atau **PDF** yang dapat dicetak, termasuk gambar, menggunakan tombol PDF di editor catatan.

Anda dapat memilih orientasi halaman (potret atau lanskap).`,
    },
    attributeClone: {
      title: 'Kloning atribut di perancang formulir',
      description: `Di **perancang formulir**, gunakan menu sebuah atribut untuk **mengkloning** atribut tersebut ke entitas yang sama atau entitas lain, dengan semua propertinya.`,
    },
    odkImport: {
      title: 'Impor survei dan data dari ODK',
      description: `Buat survei baru dari **formulir ODK** (XForm, .xml): di **Beranda > Survei Baru > Impor**, pilih **ODK (.xml)** sebagai **Sumber**, lalu klik **Mulai impor**. Pertanyaan formulir menjadi atribut, repeat menjadi entitas jamak, dan daftar pilihan menjadi kategori, dengan label dalam semua bahasa formulir. Sebelum menerbitkan, tentukan atribut kunci dari entitas akar dan perbaiki kesalahan yang dicantumkan oleh **Terbitkan**, jika ada.

Kemudian impor data yang dikumpulkan dengan **ODK Collect** di **Data > Impor Data > ODK / ODK Collect**: file .zip dengan satu folder per kiriman (ekspor ODK Briefcase). Kiriman yang sudah diimpor akan dilewati.`,
    },
    positionTracking: {
      title: 'Pelacakan posisi: rekam jalur yang ditempuh di lapangan',
      description: `Centang **Pelacakan posisi** di tab **Dasar** pada atribut **Geospasial** tunggal: di **Arena Mobile**, nilai atribut adalah jalur yang ditempuh pengguna saat mengisi catatan, yang direkam dengan melacak posisi perangkat.

Jalur tidak dapat disunting secara manual. Opsi ini hanya berlaku untuk Arena Mobile.`,
    },
    dynamicEnumerator: {
      title: 'Enumerasi dinamis entitas',
      description: `Gunakan **ekspresi** untuk memilih item kategori mana yang menghasilkan baris entitas jamak yang dienumerasi: mis. \`unique(plot.land_use)\` membuat baris hanya untuk penggunaan lahan yang benar-benar ditemukan di plot.`,
    },
  },
}
