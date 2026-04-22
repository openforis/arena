export default {
  // Common
  invalidEmail: 'Хүчингүй имэйл',
  invalidField: '"{{field}}" хүчингүй байна',
  invalidNumber: 'Хүчингүй тоо',
  invalidDate: 'Хүчингүй огноо',
  minLengthNotRespected: 'Хамгийн багадаа {{minLength}} тэмдэгтийн урт хангагдаагүй',
  nameDuplicate: 'Нэр давхцсан',
  nameCannotBeKeyword: `Нэр "{{value}}" ашиглах боломжгүй: энэ нь нөөцлөгдсөн үг юм`,
  nameInvalid:
    'Нэр "{{name}}" хүчингүй байна: энэ нь хамгийн ихдээ 40 тэмдэгтээс бүрдсэн, зөвхөн бага үсэг, тоо агуулсан, үсгээр эхэлсэн, зөвхөн "-" ба "_" тэмдэгттэй байх ёстой',
  nameRequired: 'Нэр шаардлагатай',
  requiredField: '{{field}} шаардлагатай',
  rowsDuplicate: 'мөр: {{row}} давхцсан мөр: {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: 'Судалгааны үндсэн хэл дээрх шошго шаардлагатай',
    analysisNodeDefsRequired: 'Наад зах нь нэг тооцоолсон шинж чанар шаардлагатай',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'Наад зах нь нэг хүчингүй хүүхэд',
    codeCannotBeKeyword: `Код "{{value}}" ашиглах боломжгүй: энэ нь нөөцлөгдсөн үг юм`,
    codeDuplicate: 'Код давхцсан',
    codeRequired: 'Код шаардлагатай',
    itemExtraPropDataTypeRequired: '$t(extraProp.label) "{{key}}"-д өгөгдлийн төрөл шаардлагатай',
    itemExtraPropNameInvalid: '$t(extraProp.label) "{{key}}"-д хүчингүй нэр',
    itemExtraPropInvalidNumber: '$t(extraProp.label) "{{key}}"-д хүчингүй тоо',
    itemExtraPropInvalidGeometryPoint: '$t(extraProp.label) "{{key}}"-д хүчингүй геометрийн цэг',
    itemsInvalid: 'Наад зах нь нэг хүчингүй элемент',
    itemsEmpty: 'Наад зах нь нэг элементийг тодорхойлно уу',
    levelDuplicate: 'Түвшний нэр давхцсан',
    levelsInvalid: 'Наад зах нь нэг хүчингүй түвшин',
    nameNotSpecified: 'Ангиллын нэр заагаагүй',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Нийтлэгдсэн ангиллын элементүүдийг устгах боломжгүй. Импортлогдсон файлд дутуу элементүүд: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Нийтлэгдсэн ангиллын түвшингүүдийг устгах боломжгүй. Импортлогдсон файлд дутуу түвшингүүд: {{deletedLevelNames}}',
    codeColumnMissing: 'Наад зах нь нэг "код" багана байх ёстой',
    codeRequired: '{{columnName}}: код шаардлагатай',
    codeDuplicate: '{{columnName}}: давхцсан код "{{code}}"',
    columnMissing: 'Дутуу багана: {{columnNameMissing}}',
    emptyHeaderFound: 'Файл хоосон толгой хэсэг агуулсан байна',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile:
      'ZIP файл нь зөвхөн .csv эсвэл .xlsx файлуудыг агуулсан байх ёстой (ангилал бүрт нэг), ямар нэгэн хавтасгүйгээр',
    invalidParentItemOrder: 'Код {{parentItemCodes}}-тэй элемент нь хүүхдүүдийнхээ өмнө байх ёстой',
    nameDuplicate: 'Ижил нэртэй ангилал аль хэдийн байна: {{name}}',
    srsNotDefined: 'Судалгаанд код {{srs}}-тэй SRS тодорхойлогдоогүй',
  },

  dataImport: {
    emptyFile: 'Таны импортлох гэж буй файл хоосон байна',
    invalidHeaders: 'Хүчингүй баганууд: {{invalidHeaders}}',
    invalidBoolean: 'Багана {{headers}}-д хүчингүй боол утга: {{value}}',
    invalidCode: `'{{attributeName}}' шинж чанарт хүчингүй код: {{code}}`,
    invalidCoordinate: 'Багана {{headers}}-д хүчингүй координат: {{value}}',
    invalidDate:
      'Багана {{headers}}-д хүчингүй огноо: {{value}}. Огноог ҮҮ-СА-ӨД эсвэл ӨД/СА/ЖИЛ форматаар байх ёстой. Жишээ нь: 2023-01-15 эсвэл 15/01/2023',
    invalidNumber: 'Багана {{headers}}-д хүчингүй тоо: {{value}}',
    invalidTaxonCode: 'Багана {{headers}}-д хүчингүй таксоны код: {{value}}',
    invalidTime:
      'Багана {{headers}}-д хүчингүй цаг: {{value}}. Цагийг ЦАГ:МИНУТ форматаар байх ёстой. Жишээ нь: 09:45 эсвэл 16:30',
    missingRequiredHeaders: 'Шаардлагатай баганууд дутуу: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Утгуудыг шинэчлэхэд алдаа гарлаа: {{details}}',
    multipleRecordsMatchingKeys: 'Түлхүүр "{{keyValues}}"-д тохирох олон бичлэг олдов',
    recordAlreadyExisting: 'Түлхүүр "{{keyValues}}"-тэй бичлэг аль хэдийн байна',
    recordInAnalysisStepCannotBeUpdated:
      'Түлхүүр "{{keyValues}}"-тэй бичлэг нь шинжилгээний алхамд байгаа тул шинэчлэх боломжгүй',
    recordKeyMissingOrInvalid: 'Түлхүүр шинж чанар "{{keyName}}"-д дутуу эсвэл хүчингүй утга',
    recordNotFound: 'Түлхүүр "{{keyValues}}"-тэй бичлэг олдсонгүй',
  },

  expressions: {
    cannotGetChildOfAttribute: 'шинж чанар {{parentName}}-ийн хүүхэд зангилаа {{childName}}-г авах боломжгүй',
    cannotUseCurrentNode: 'одоогийн зангилаа {{name}}-г энэ илэрхийлэлд ашиглах боломжгүй',
    circularDependencyError: 'зангилаа {{name}}-г холбох боломжгүй, учир нь энэ нь одоогийн зангилааг холбож байна',
    expressionInvalid: 'Хүчингүй илэрхийлэл: {{details}}',
    unableToFindNode: 'зангилаа олох боломжгүй: {{name}}',
    unableToFindNodeChild: 'хүүхэд зангилаа олох боломжгүй: {{name}}',
    unableToFindNodeParent: 'эцэг зангилаа олох боломжгүй: {{name}}',
    unableToFindNodeSibling: 'ах дүү зангилаа олох боломжгүй: {{name}}',
  },

  extraPropEdit: {
    nameInvalid: 'Нэр хүчингүй',
    nameRequired: 'Нэр шаардлагатай',
    dataTypeRequired: 'Өгөгдлийн төрөл шаардлагатай',
    valueRequired: 'Утга шаардлагатай',
  },

  message: {
    bodyRequired: 'Үндсэн хэсэг шаардлагатай',
    subjectRequired: 'Сэдэв шаардлагатай',
    notificationTypeRequired: 'Мэдэгдлийн төрөл шаардлагатай',
    targetsRequired: 'Наад зах нь нэг зорилтот шаардлагатай',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'Объект шаардлагатай',
    applyIfDuplicate: '"$t(nodeDefEdit.expressionsProp.applyIf)" нөхцөл давхцсан',
    applyIfInvalid: 'Хүчингүй "$t(nodeDefEdit.advancedProps.relevantIf)" нөхцөл',
    columnWidthCannotBeGreaterThan: 'Баганын өргөн {{max}}-аас их байх боломжгүй',
    columnWidthCannotBeLessThan: 'Баганын өргөн {{min}}-ээс бага байх боломжгүй',
    countMaxMustBePositiveNumber: 'Хамгийн их тоо эерэг бүхэл тоо байх ёстой',
    countMinMustBePositiveNumber: 'Хамгийн бага тоо эерэг бүхэл тоо байх ёстой',
    categoryRequired: 'Ангилал шаардлагатай',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: 'Хүчингүй "Үндсэн утгууд"',
    defaultValuesNotSpecified: 'Үндсэн утга заагаагүй',
    entitySourceRequired: 'Объектын эх үүсвэр шаардлагатай',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Зөвхөн сүүлийн илэрхийлэл нь хоосон "$t(nodeDefEdit.expressionsProp.applyIf)" нөхцөлтэй байж болно',
    expressionDuplicate: 'Илэрхийлэл давхцсан',
    expressionRequired: 'Илэрхийлэл шаардлагатай',
    formulaInvalid: 'Томьёо хүчингүй байна',
    keysEmpty: 'Наад зах нь нэг түлхүүр шинж чанарыг тодорхойлно уу',

    keysExceedingMax: 'Түлхүүр шинж чанаруудын хамгийн их тооноос хэтэрсэн',
    maxFileSizeInvalid: 'Хамгийн их файлын хэмжээ 0-ээс их ба {{max}}-ээс бага байх ёстой',
    nameInvalid: 'Нэр хүчингүй байна (зөвхөн бага үсэг, тоо, доогуур зураас агуулсан, үсгээр эхэлсэн байх ёстой)',
    taxonomyRequired: 'Таксоном шаардлагатай',
    validationsInvalid: 'Хүчингүй "Баталгаажуулалтууд"',
    countMaxInvalid: 'Хүчингүй "Хамгийн их тоо"',
    countMinInvalid: 'Хүчингүй "Хамгийн бага тоо"',
  },

  record: {
    keyDuplicate: 'Бичлэгийн түлхүүр давхцсан',
    entityKeyDuplicate: 'Объектын түлхүүр давхцсан',
    entityKeyValueNotSpecified: '"{{keyDefName}}" түлхүүрийн утга заагаагүй',
    missingAncestorForEntity: 'Эдгээр түлхүүрүүдтэй "{{ancestorName}}" олох боломжгүй: {{keyValues}}',
    oneOrMoreInvalidValues: 'Нэг буюу хэд хэдэн утга хүчингүй байна',
    uniqueAttributeDuplicate: 'Давхцсан утга',
    valueInvalid: 'Хүчингүй утга',
    valueRequired: 'Шаардлагатай утга',
  },

  recordClone: {
    differentKeyAttributes: 'Түлхүүр шинж чанарууд {{cycleFrom}} мөчлөг болон {{cycleTo}} мөчлөгт ялгаатай байна',
  },

  surveyInfoEdit: {
    langRequired: 'Хэл шаардлагатай',
    srsRequired: 'Орон зайн лавлах систем шаардлагатай',
    cycleRequired: 'Мөчлөг шаардлагатай',
    cyclesRequired: 'Наад зах нь нэг мөчлөг тодорхойлогдсон байх ёстой',
    cyclesExceedingMax: 'Судалгаа хамгийн ихдээ 10 мөчлөгтэй байж болно',
    cycleDateStartBeforeDateEnd: 'Мөчлөгийн эхлэх огноо дуусах огнооноос өмнө байх ёстой',
    cycleDateStartAfterPrevDateEnd: 'Мөчлөгийн эхлэх огноо өмнөх мөчлөгийн дуусах огнооноос хойш байх ёстой',
    cycleDateStartInvalid: 'Мөчлөгийн эхлэх огноо хүчингүй',
    cycleDateStartMandatory: 'Мөчлөгийн эхлэх огноо заавал байх ёстой',
    cycleDateEndInvalid: 'Мөчлөгийн дуусах огноо хүчингүй',
    cycleDateEndMandatoryExceptForLastCycle:
      'Мөчлөгийн дуусах огноо сүүлийн мөчлөгөөс бусад бүх мөчлөгт заавал байх ёстой',
    fieldManualLinksInvalid: 'Талбайн гарын авлагын холбоос хүчингүй',
  },

  surveyPreloadedMapLayer: {
    fileRequired: 'Файл шаардлагатай',
    fileNameDuplicate: 'Ижил нэртэй файл аль хэдийн орсон байна',
    labelsRequired: 'Наад зах нь нэг шошго шаардлагатай',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Хүчингүй баганууд: {{invalidHeaders}}',
    cannotFindNodeDef: "'{{name}}' нэртэй шинж чанар эсвэл объектын тодорхойлолтыг олох боломжгүй",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Нийтлэгдсэн код өөрчлөгдсөн: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Давхцсан код {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Код шаардлагатай',
    familyRequired: 'Овог шаардлагатай',
    genusRequired: 'Төрөл шаардлагатай',
    scientificNameDuplicate: 'Давхцсан шинжлэх ухааны нэр {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Шинжлэх ухааны нэр шаардлагатай',
    taxaEmpty: 'Хоосон таксонууд',
    vernacularNamesDuplicate: `'{{name}}' гэсэн нутгийн нэр давхцсан '{{lang}}' хэлээр`,
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Нэмэлт мэдээллийн баганууд давхцсан: {{duplicateColumns}}',
    invalidExtraPropColumn:
      'Нэмэлт мэдээллийн баганын нэр "{{columnName}}" хүчингүй: энэ нь нөөцлөгдсөн үг байх боломжгүй',
    missingRequiredColumns: 'Шаардлагатай багана(ууд) дутуу: {{columns}}',
    reservedScientificName:
      '"{{scientificName}}" шинжлэх ухааны нэр нь нөөцлөгдсөн тул ашиглах боломжгүй; энэ нь таксономид автоматаар нэмэгдэнэ.',
  },

  user: {
    emailRequired: 'Имэйл шаардлагатай',
    emailInvalid: 'Имэйл хүчингүй',
    emailNotFound: 'Имэйл олдсонгүй',
    groupRequired: 'Бүлэг шаардлагатай',
    nameRequired: 'Нэр шаардлагатай',
    titleRequired: 'Цол шаардлагатай',
    passwordRequired: 'Нууц үг шаардлагатай',
    passwordInvalid: 'Нууц үгт хоосон зай байх ёсгүй',
    passwordUnsafe: 'Нууц үг наад зах нь 8 тэмдэгтээс бүрдсэн, бага үсэг, том үсэг, тоо агуулсан байх ёстой',
    passwordsDoNotMatch: `Нууц үгнүүд таарахгүй байна`,

    userNotFound: 'Хэрэглэгч олдсонгүй. Имэйл болон нууц үг зөв эсэхийг шалгана уу',
    passwordChangeRequired: 'Нууц үг солих шаардлагатай',
    passwordResetNotAllowedWithPendingInvitation: `Нууц үг сэргээхийг зөвшөөрөхгүй: хэрэглэгч судалгаанд уригдсан боловч урилгыг хараахан хүлээн аваагүй байна`,
  },

  userAccessRequest: {
    countryRequired: 'Улс шаардлагатай',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'Нэр шаардлагатай',
    institutionRequired: 'Байгууллага шаардлагатай',
    lastNameRequired: 'Овог шаардлагатай',
    purposeRequired: 'Зорилго шаардлагатай',
    surveyNameRequired: 'Судалгааны нэр шаардлагатай',
    invalidRequest: 'Хүчингүй хэрэглэгчийн хандалтын хүсэлт',
    userAlreadyExisting: 'Имэйл {{email}}-тэй хэрэглэгч аль хэдийн байна',
    requestAlreadySent: `Имэйл {{email}}-тэй хэрэглэгчийн хандалтын хүсэлт аль хэдийн илгээгдсэн`,
    invalidReCaptcha: 'Хүчингүй ReCaptcha',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'Хэрэглэгчийн хандалтын хүсэлт аль хэдийн боловсруулагдсан',
    accessRequestNotFound: 'Хэрэглэгчийн хандалтын хүсэлт олдсонгүй',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Үүрэг шаардлагатай',
    surveyNameRequired: 'Судалгааны нэр шаардлагатай',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Хуучин нууц үг шаардлагатай',
    oldPasswordWrong: 'Хуучин нууц үг буруу байна',
    newPasswordRequired: 'Шинэ нууц үг шаардлагатай',
    confirmPasswordRequired: 'Нууц үгээ баталгаажуулах шаардлагатай',
    confirmedPasswordNotMatching: 'Шинэ нууц үг болон баталгаажуулсан нууц үг таарахгүй байна',
  },

  userInvite: {
    messageContainsLinks: 'Урилгын мессеж холбоос агуулж болохгүй',
    messageTooLong: 'Урилгын мессеж хэт урт байна (хамгийн ихдээ {{maxLength}} тэмдэгт)',
  },

  user2FADevice: {
    nameDuplicate: 'Ижил нэртэй төхөөрөмж аль хэдийн байна',
    nameRequired: 'Төхөөрөмжийн нэр шаардлагатай',
  },
}
