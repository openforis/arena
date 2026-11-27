export default {
  // Common
  invalidEmail: 'Email tidak valid',
  invalidField: '"{{field}}" tidak valid',
  invalidNumber: 'Angka tidak valid',
  invalidDate: 'Tanggal tidak valid',
  minLengthNotRespected: 'Panjang minimum {{minLength}} karakter tidak terpenuhi',
  nameDuplicate: 'Nama duplikat',
  nameCannotBeKeyword: `Nama "{{value}}" tidak dapat digunakan: nama tersebut adalah kata yang dicadangkan`,
  nameInvalid:
    'Nama "{{name}}" tidak valid: panjangnya maksimal 40 karakter dan hanya boleh berisi huruf kecil, angka, serta simbol "-" dan "_", diawali dengan huruf',
  nameRequired: 'Nama wajib diisi',
  requiredField: '{{field}} wajib diisi',
  rowsDuplicate: 'baris: {{row}} baris duplikat: {{duplicateRow}}',

  aggregateFunction: {
    expressionFunctionNotAllowed: `Fungsi "{{name}}" tidak diizinkan`,
    expressionInvalid: `"{{text}}" tidak diizinkan dalam ekspresi`,
    expressionRequired: 'Ekspresi wajib diisi',
    expressionUnbalancedParentheses: 'Tanda kurung tidak seimbang',
    expressionUnknownColumn: `"{{name}}" bukan kolom dari entitas`,
    expressionUnterminatedQuote: 'Teks berkutip tidak ditutup',
  },

  analysis: {
    labelDefaultLangRequired: 'Label dalam bahasa default survei wajib diisi',
    analysisNodeDefsRequired: 'Setidaknya satu atribut terhitung diperlukan',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Setidaknya satu anak tidak valid',
    codeCannotBeKeyword: `Kode "{{value}}" tidak dapat digunakan: kode tersebut adalah kata yang dicadangkan`,
    codeDuplicate: 'Kode duplikat',
    codeRequired: 'Kode wajib diisi',
    itemExtraPropDataTypeRequired: 'Jenis data wajib diisi untuk $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Nama tidak valid untuk $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Angka tidak valid untuk $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Titik geometri tidak valid untuk $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'Setidaknya satu item tidak valid',
    itemsEmpty: 'Tentukan setidaknya satu item',
    levelDuplicate: 'Nama tingkat duplikat',
    levelsInvalid: 'Setidaknya satu tingkat tidak valid',
    nameNotSpecified: 'Nama kategori tidak ditentukan',
  },

  category: {
    samplingPointDataCategoryAlreadyExists:
      'Kategori Data Titik Sampel sudah ada dalam survei ini; hanya boleh ada satu.',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Tidak dapat menghapus item kategori yang sudah diterbitkan. Item yang tidak ada dalam file impor: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Tidak dapat menghapus tingkat kategori yang sudah diterbitkan. Tingkat yang tidak ada dalam file impor: {{deletedLevelNames}}',
    codeColumnMissing: 'Harus ada setidaknya satu kolom "code"',
    codeRequired: '{{columnName}}: kode wajib diisi',
    codeDuplicate: '{{columnName}}: kode duplikat "{{code}}"',
    columnMissing: 'Kolom tidak ada: {{columnNameMissing}}',
    emptyHeaderFound: 'File berisi header kosong',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'File ZIP hanya boleh berisi file .csv atau .xlsx (satu untuk setiap kategori), tanpa direktori apa pun',
    invalidParentItemOrder: 'Item dengan kode {{parentItemCodes}} harus berada sebelum anak-anaknya',
    nameDuplicate: 'Kategori dengan nama yang sama sudah ada: {{name}}',
    srsNotDefined: 'SRS dengan kode {{srs}} tidak ditetapkan dalam survei',
    uuidDuplicate:
      'Kategori ini sudah pernah dikloning ke survei ini (saat ini bernama "{{name}}"). Kategori tidak dapat dikloning lagi.',
  },

  dataImport: {
    emptyFile: 'File yang ingin Anda impor kosong',
    emptyFileName: 'Nama file kosong di kolom {{headers}}',
    invalidHeaders: 'Kolom tidak valid: {{invalidHeaders}}',
    invalidBoolean: 'Nilai boolean tidak valid di kolom {{headers}}: {{value}}',
    invalidCode: `Kode tidak valid untuk atribut '{{attributeName}}': {{code}}`,
    invalidCoordinate: 'Koordinat tidak valid di kolom {{headers}}: {{value}}',
    invalidDate:
      'Tanggal tidak valid di kolom {{headers}}: {{value}}. Tanggal harus berformat YYYY-MM-DD atau DD/MM/YYYY. Contoh: 2023-01-15 atau 15/01/2023',
    invalidNumber: 'Angka tidak valid di kolom {{headers}}: {{value}}',
    invalidTaxonCode: 'Kode tidak valid di kolom {{headers}}: {{value}}',
    invalidTime:
      'Waktu tidak valid di kolom {{headers}}: {{value}}. Waktu harus berformat HH:mm atau HH:mm:ss. Contoh: 09:45, 16:30 atau 09:45:30',
    missingRequiredHeaders: 'Kolom wajib tidak ada: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Kesalahan saat memperbarui nilai: {{details}}',
    multipleRecordsMatchingKeys: 'Ditemukan beberapa catatan yang cocok dengan kunci "{{keyValues}}"',
    recordAlreadyExisting: 'Catatan dengan kunci "{{keyValues}}" sudah ada',
    recordInAnalysisStepCannotBeUpdated:
      'Catatan dengan kunci "{{keyValues}}" berada pada tahap Analisis dan tidak dapat diperbarui',
    recordKeyMissingOrInvalid: 'Nilai untuk atribut kunci "{{keyName}}" tidak ada atau tidak valid',
    recordNotEditable:
      'Catatan dengan kunci "{{keyValues}}" tidak dapat diperbarui: Anda tidak diizinkan menyuntingnya',
    recordNotFound: 'Catatan dengan kunci "{{keyValues}}" tidak ditemukan',
  },

  expressions: {
    cannotGetChildOfAttribute: 'tidak dapat mengambil node anak {{childName}} dari atribut {{parentName}}',
    cannotUseCurrentNode: 'tidak dapat menggunakan node saat ini {{name}} dalam ekspresi ini',
    circularDependencyError:
      'tidak dapat mereferensikan node {{name}} karena node tersebut mereferensikan node saat ini',
    expressionInvalid: 'Ekspresi tidak valid: {{details}}',
    unableToFindNode: 'tidak dapat menemukan node: {{name}}',
    unableToFindNodeChild: 'tidak dapat menemukan node anak: {{name}}',
    unableToFindNodeParent: 'tidak dapat menemukan node induk: {{name}}',
    unableToFindNodeSibling: 'tidak dapat menemukan node saudara: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Nama tidak valid',
    nameRequired: 'Nama wajib diisi',
    dataTypeRequired: 'Jenis data wajib diisi',
    valueRequired: 'Nilai wajib diisi',
  },

  message: {
    bodyRequired: 'Isi pesan wajib diisi',
    subjectRequired: 'Subjek wajib diisi',
    notificationTypeRequired: 'Jenis notifikasi wajib diisi',
    targetsRequired: 'Setidaknya satu target diperlukan',
  },

  nodeValueParser: {
    attributeNotEditable: '"{{attributeName}}" tidak dapat disunting (hanya-baca atau terhitung).',
    unsupportedType: '"{{attributeName}}": nilai berjenis {{type}} tidak dapat ditetapkan di sini.',
  },
  nodeDefEdit: {
    analysisParentEntityRequired: 'Entitas wajib diisi',
    applyIfDuplicate: 'Kondisi "$t(nodeDefEdit:expressionsProp.applyIf)" duplikat',
    applyIfInvalid: 'Kondisi "$t(nodeDefEdit:advancedProps.relevantIf)" tidak valid',
    columnWidthCannotBeGreaterThan: 'Lebar kolom tidak boleh lebih dari {{max}}',
    columnWidthCannotBeLessThan: 'Lebar kolom tidak boleh kurang dari {{min}}',
    countMaxMustBePositiveNumber: 'Jumlah Maks. harus berupa bilangan bulat positif',
    countMinMustBePositiveNumber: 'Jumlah Min. harus berupa bilangan bulat positif',
    categoryRequired: 'Kategori wajib diisi',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: '"Nilai Default" tidak valid',
    defaultValuesNotSpecified: 'Nilai default tidak ditentukan',
    entitySourceRequired: 'Sumber Entitas wajib diisi',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Hanya ekspresi terakhir yang boleh memiliki kondisi "$t(nodeDefEdit:expressionsProp.applyIf)" kosong',
    expressionDuplicate: 'Ekspresi duplikat',
    expressionRequired: 'Ekspresi wajib diisi',
    formulaInvalid: 'Rumus tidak valid',
    keysEmpty: 'Tentukan setidaknya satu atribut kunci',

    keysExceedingMax: 'Melebihi jumlah maksimum atribut kunci',
    mapMarkerColorInvalid: 'Warna penanda peta harus berupa kode warna seperti #ff0000',
    maxFileSizeInvalid: 'Ukuran file maks. harus lebih besar dari 0 dan kurang dari {{max}}',
    nameInvalid: 'Nama tidak valid (hanya boleh berisi huruf kecil, angka, dan garis bawah, diawali dengan huruf)',
    taxonomyRequired: 'Taksonomi wajib diisi',
    validationsInvalid: '"Validasi" tidak valid',
    countMaxInvalid: '"Jumlah maks." tidak valid',
    countMinInvalid: '"Jumlah min." tidak valid',
    readOnlyCannotHaveEditableIf: 'Node hanya-baca tidak boleh memiliki kondisi "Dapat disunting jika"',
    requiredIfInvalid: 'Kondisi "Wajib jika" tidak valid',
    requiredIfNotAllowed:
      'Kondisi "Wajib jika" hanya diizinkan untuk atribut tunggal non-kunci yang tidak selalu wajib',
    qualifierCannotHaveApplicableExpression:
      'Atribut kualifikasi tidak boleh memiliki kondisi "$t(nodeDefEdit:advancedProps.relevantIf)"',
    qualifierCannotHaveEditabilityRule: 'Atribut kualifikasi tidak boleh memiliki aturan dapat-disunting',
    qualifierCannotHaveDefaultValues: 'Atribut kualifikasi tidak boleh memiliki nilai default',
    qualifierCannotHaveValidations: 'Atribut kualifikasi tidak boleh memiliki aturan validasi',
  },

  record: {
    keyDuplicate: 'Kunci catatan duplikat',
    entityKeyDuplicate: 'Kunci duplikat',
    entityKeyValueNotSpecified: 'Nilai kunci untuk "{{keyDefName}}" tidak ditentukan',
    missingAncestorForEntity: 'Tidak dapat menemukan "{{ancestorName}}" dengan kunci berikut: {{keyValues}}',
    oneOrMoreInvalidValues: 'Satu atau beberapa nilai tidak valid',
    uniqueAttributeDuplicate: 'Nilai duplikat',
    valueInvalid: 'Nilai tidak valid',
    valueRequired: 'Nilai wajib diisi',
  },

  recordClone: {
    differentKeyAttributes: 'Atribut kunci berbeda pada Siklus {{cycleFrom}} dan Siklus {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'Bahasa wajib diisi',
    langInvalid: 'Kode bahasa tidak valid: {{lang}}',
    srsInvalid: 'Kode sistem referensi spasial tidak valid: {{code}}',
    srsRequired: 'Sistem Referensi Spasial wajib diisi',
    cycleRequired: 'Siklus wajib diisi',
    cyclesRequired: 'Setidaknya satu siklus harus ditentukan',
    cyclesExceedingMax: 'Survei dapat memiliki paling banyak 10 siklus',
    cycleKeysInvalid: 'Siklus harus diberi nomor berurutan, dimulai dari 1',
    cycleDateStartBeforeDateEnd: 'Tanggal mulai siklus harus sebelum tanggal berakhirnya',
    cycleDateStartAfterPrevDateEnd: 'Tanggal mulai siklus harus setelah tanggal berakhir siklus sebelumnya',
    cycleDateStartInvalid: 'Tanggal mulai siklus tidak valid',
    cycleDateStartMandatory: 'Tanggal mulai siklus wajib diisi',
    cycleDateEndInvalid: 'Tanggal berakhir siklus tidak valid',
    cycleDateEndMandatoryExceptForLastCycle:
      'Tanggal berakhir siklus wajib diisi untuk semua siklus kecuali yang terakhir',
    fieldManualLinksInvalid: 'Tautan panduan lapangan tidak valid',
    areaOfInterestInvalid: 'Area minat harus berupa poligon dalam format GeoJSON dengan koordinat WGS84',
  },

  surveyAreaOfInterest: {
    fileRequired: 'File wajib diisi',
    nameDuplicate: 'Area minat lain dengan nama yang sama sudah ada',
    nameRequired: 'Nama wajib diisi',
  },

  surveyPreloadedMapLayer: {
    fileRequired: 'File wajib diisi',
    fileNameDuplicate: 'File lain dengan nama yang sama sudah ada',
    labelsRequired: 'Setidaknya satu label diperlukan',
  },

  surveyDocImage: {
    documentPlaceRequired: 'Tempat dokumen wajib diisi',
    fileRequired: 'File wajib diisi',
    fileNameDuplicate: 'File lain dengan nama yang sama sudah ada',
    labelsRequired: 'Setidaknya satu label diperlukan',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Kolom tidak valid: {{invalidHeaders}}',
    cannotFindNodeDef: "Tidak dapat menemukan definisi atribut atau entitas dengan nama '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Kode yang sudah diterbitkan telah berubah: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Kode duplikat {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Kode wajib diisi',
    familyRequired: 'Famili wajib diisi',
    genusRequired: 'Genus wajib diisi',
    scientificNameDuplicate: 'Nama ilmiah duplikat {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Nama ilmiah wajib diisi',
    taxaEmpty: 'Takson kosong',
    vernacularNamesDuplicate: `Nama lokal '{{name}}' duplikat untuk bahasa '{{lang}}'`,
  },

  taxonomyImport: {
    nameDuplicate: 'Taksonomi dengan nama yang sama sudah ada: {{name}}',
    uuidDuplicate:
      'Taksonomi ini sudah pernah dikloning ke survei ini (saat ini bernama "{{name}}"). Taksonomi tidak dapat dikloning lagi.',
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Kolom Info Tambahan duplikat: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Nama kolom Info Tambahan "{{columnName}}" tidak valid: tidak boleh berupa kata yang dicadangkan',
    missingRequiredColumns: 'Kolom wajib tidak ada: {{columns}}',
    reservedScientificName:
      'Nama ilmiah "{{scientificName}}" dicadangkan dan tidak dapat digunakan; nama ini akan disisipkan secara otomatis ke dalam taksonomi.',
  },

  user: {
    emailDuplicate: 'Pengguna dengan email yang sama sudah ada',
    emailRequired: 'Email wajib diisi',
    emailInvalid: 'Email tidak valid',
    emailNotFound: 'Email tidak ditemukan',
    groupRequired: 'Grup wajib diisi',
    nameRequired: 'Nama wajib diisi',
    titleRequired: 'Sapaan wajib diisi',
    passwordRequired: 'Kata sandi wajib diisi',
    passwordInvalid: 'Kata sandi tidak boleh berisi spasi',
    passwordUnsafe:
      'Kata sandi harus terdiri dari setidaknya 8 karakter dan berisi huruf kecil, huruf besar, serta angka',
    passwordsDoNotMatch: `Kata sandi tidak cocok`,

    userNotFound: 'Pengguna tidak ditemukan. Pastikan email dan kata sandi sudah benar',
    passwordChangeRequired: 'Kata sandi harus diubah',
    passwordResetNotAllowedWithPendingInvitation: `Atur ulang kata sandi tidak diizinkan: pengguna telah diundang ke survei tetapi undangan belum diterima`,
    twoFactorTokenRequired: 'Kode verifikasi wajib diisi',
  },

  userAccessRequest: {
    countryRequired: 'Negara wajib diisi',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    firstNameRequired: 'Nama depan wajib diisi',
    institutionRequired: 'Institusi wajib diisi',
    lastNameRequired: 'Nama belakang wajib diisi',
    purposeRequired: 'Tujuan wajib diisi',
    surveyNameRequired: 'Nama survei wajib diisi',
    invalidRequest: 'Permintaan akses pengguna tidak valid',
    userAlreadyExisting: 'Pengguna dengan email {{email}} sudah ada',
    requestAlreadySent: `Permintaan akses untuk pengguna dengan email {{email}} sudah dikirim`,
    emailNotReachable: 'Email konfirmasi tidak dapat dikirim ke {{email}}; periksa apakah alamatnya sudah benar',
    invalidReCaptcha: 'ReCaptcha tidak valid',
    surveyNameAlreadyUsed: 'Survei bernama {{surveyName}} sudah ada: usulkan nama survei lain',
    registrationNotAvailable: 'Pendaftaran tidak tersedia saat ini; silakan coba lagi nanti',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Permintaan akses pengguna sudah diproses',
    accessRequestNotFound: 'Permintaan akses pengguna tidak ditemukan',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Peran wajib diisi',
    surveyNameRequired: 'Nama survei wajib diisi',
  },

  userGroupEdit: {
    nameDuplicate: 'Grup dengan nama yang sama sudah ada: {{name}}',
    qualifiersInvalid: 'Satu atau beberapa kualifikasi memiliki kunci yang tidak valid atau duplikat',
    qualifierNameDuplicate: 'Kualifikasi dengan nama yang sama sudah ada dalam grup ini: {{name}}',
    qualifierNameInvalid: 'Nama kualifikasi tidak valid',
    qualifierNameRequired: 'Nama kualifikasi wajib diisi',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Kata sandi lama wajib diisi',
    oldPasswordWrong: 'Kata sandi lama salah',
    newPasswordRequired: 'Kata sandi baru wajib diisi',
    confirmPasswordRequired: 'Konfirmasi kata sandi wajib diisi',
    confirmedPasswordNotMatching: 'Kata sandi baru dan konfirmasi kata sandi tidak cocok',
  },

  userInvite: {
    messageContainsLinks: 'Pesan undangan tidak boleh berisi tautan',
    messageTooLong: 'Pesan undangan terlalu panjang (maksimal {{maxLength}} karakter)',
  },

  user2FADevice: {
    nameDuplicate: 'Perangkat dengan nama yang sama sudah ada',
    nameRequired: 'Nama perangkat wajib diisi',
  },
}
