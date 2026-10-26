import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Идэвхтэй',
    add: 'Нэмэх',
    advancedFunctions: 'Нарийвчилсан функцууд',
    and: 'ба',
    appName: 'Арена',
    appNameFull: '$t(common.openForis) Арена',
    apply: 'Хэрэгжүүлэх',
    aggregateFunction: 'Нэгдсэн функц',
    aggregateFunction_other: 'Нэгдсэн функцууд',
    attribute: 'Шинж чанар',
    attribute_other: 'Шинж чанарууд',
    avg: 'Дундаж',
    ascending: 'Өсөх',
    areaBased: 'талбай дээр суурилсан',
    back: 'Буцах',
    baseUnit: 'Суурь нэгж',
    cancel: 'Цуцлах',
    cancelConfirm: `**Хадгалгдаагүй өөрчлөлтүүд байна**.

Хадгалахгүй орхих уу?`,
    cantUndoWarning: 'Энэ үйлдлийг буцаах боломжгүй',
    cantBeDeletedUsedItem: 'Энэ {{item}} нь зарим зангилааны тодорхойлолтуудад ашиглагдсан тул устгах боломжгүй',
    chain: 'Гинж',
    chain_other: 'Гинжүүд',
    childrenEmpty: 'Наад зах нь нэг хүүхэд элементийг тодорхойлно уу',
    clear: 'Арилгах',
    clone: 'Хувилах',
    close: 'Хаах',
    cloneFrom: 'Үүнээс хувилах',
    cnt: 'Тоо',
    code: 'Код',
    collapse: 'Хумих',
    confirm: 'Батлах',
    convert: 'Хөрвүүлэх',
    copy: 'Хуулах',
    createdWith: 'Үүсгэсэн',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Мөчлөг',
    cycle_other: 'Мөчлөгүүд',
    dateCreated: 'Үүсгэсэн огноо',
    dateLastModified: 'Сүүлд өөрчилсөн огноо',
    delete: 'Устгах',
    deleted: 'Устгагдсан!',
    descending: 'Буурах',
    description: 'Тайлбар',
    description_other: 'Тайлбарууд',
    designerNotes: 'Дизайнерын тэмдэглэл',
    designerNotesInfo: `Дизайнерын тэмдэглэл зөвхөн судалгааны маягт дизайнерт харагдах бөгөөд өгөгдөл оруулах маягтанд харагдахгүй.`,
    details: 'Дэлгэрэнгүй',
    dimension: 'Хэмжээс',
    dimension_other: 'Хэмжээсүүд',
    done: 'Болсон',
    download: 'Татах',
    draft: 'Ноорог',
    edit: 'Засах',
    elapsed: 'Өнгөрсөн хугацаа',
    email: 'Имэйл',
    email_other: 'Имэйлүүд',
    emailSentConfirmation: `{{email}} руу имэйл илгээсэн.

    Хүлээн авагчид Спам/Хог шуудангийн хавтсыг шалгахыг анхааруулна уу.`,
    emailSentToSelfConfirmation: `Та {{email}} руу имэйл хүлээн авсан байх ёстой.

Спам/Хог шуудангийн хавтсыг шалгана уу.`,
    empty: 'Хоосон',
    entity: 'Объект',
    error: 'Алдаа',
    error_other: 'Алдаанууд',
    errorFound: '1 алдаа олдов',
    errorFound_other: '{{count}} алдаа олдов',
    errorMessage: 'Алдааны мессеж',
    errorMessage_other: 'Алдааны мессежүүд',
    expand: 'Дэлгэх',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Экспортлох',
    exportAll: 'Бүгдийг экспортлох',
    exportToCSV: 'CSV руу экспортлох',
    exportToExcel: 'Excel руу экспортлох',
    exportToExcelTooManyItems: 'Excel руу экспортлоход хэт олон элемент байна; CSV экспортлолтыг ашиглана уу.',
    expression: 'Илэрхийлэл',
    false: 'Худал',
    file: 'Файл',
    file_other: 'Файлууд',
    formContainsErrors: 'Маягт алдаатай байна',
    formContainsErrorsCannotContinue: 'Маягт алдаатай байна. Үргэлжлүүлэхийн өмнө засарна уу.',
    formContainsErrorsCannotSave: 'Маягт алдаатай байна. Хадгалахын өмнө засарна уу.',
    from: 'Эхлэл',
    function: 'Функц',
    goToHomePage: 'Нүүр хуудас руу очих',
    goToSurveys: 'Судалгааны жагсаалт руу очих',
    group: 'Бүлэг',
    help: 'Тусламж',
    hide: 'Нуух',
    id: 'id',
    import: 'Импортлох',
    importFromExcelOrCSVFile: 'Excel (.xlsx) эсвэл CSV файлаас импортлох',
    info: 'Мэдээлэл',
    invalid: 'ХҮЧИНГҮЙ',
    item: 'Элемент',
    item_other: 'Элементүүд',
    itemAlreadyAdded: 'Элемент нэмэгдсэн байна',
    label: 'Шошго',
    label_other: 'Шошгууд',
    language: 'Хэл',
    language_other: 'Хэлнүүд',
    leavePageConfirmMessage: `Маягтанд хадгалгдаагүй өөрчлөлтүүд байна.

Батлахдаа, бүх өөрчлөлтүүд алдагдана.
Үргэлжлүүлэх үү?`,
    local: 'Орон нутгийн',
    loading: 'Ачаалж байна...',
    lock: 'Түгжих',
    unlock: 'Түгжээг тайлах',
    max: 'Хамгийн их',
    med: 'Дундаж',
    manage: 'Удирдах',
    message_other: 'Мессежүүд',
    measure: 'Хэмжилт',
    measure_other: 'Хэмжилтүүд',
    measurePrevSteps: 'Өмнөх алхмуудыг хэмжих',
    measurePrevSteps_other: 'Өмнөх алхмуудыг хэмжих',
    min: 'Хамгийн бага',
    moveUp: 'Дээш зөөх',
    moveDown: 'Доош зөөх',
    name: 'Нэр',
    new: 'Шинэ',
    next: 'Дараах',
    no: 'Үгүй',
    noItems: `$t(common.no) $t(common.item_other)`,
    notification: 'Мэдэгдэл',
    notification_other: 'Мэдэгдлүүд',
    notSpecified: '---Заагаагүй---',
    orderBy: 'Эрэмбэлэх',
    of: '-ийн',
    ok: 'Тийм',
    openForis: 'Нээлттэй Форис',
    openForisShort: 'OF',
    openInNewWindow: 'Шинэ цонхонд нээх',
    options: 'Сонголтууд',
    owner: 'Эзэмшигч',
    path: 'Зам',
    pause: 'Түр зогсоох',
    preview: 'Урьдчилан харах горим',
    previous: 'Өмнөх',
    publish: 'Нийтлэх',
    publishConfirm: `#### Та {{survey}} судалгааг нийтлэх гэж байна ####

###### Нийтлэх үйл явц дараах мэдээллийг *буцаах боломжгүйгээр устгах* болно ######
- Устгагдсан хэлнүүдтэй холбоотой шошгууд.
- Устгагдсан мөчлөгүүдтэй холбоотой бичлэгүүд.
- Устгагдсан маягтын талбаруудтай холбоотой өгөгдөл.

###### Нийтэлсний дараа: ######
- Маягтын талбаруудыг нэгээс олон болгох боломжгүй.
- Ангиллын элементүүдийн кодыг өөрчлөх боломжгүй.
- Ангиллын элементүүдийг устгах боломжгүй.
- Таксономын кодыг өөрчлөх боломжгүй.
- Таксонуудыг устгах боломжгүй.

**Үргэлжлүүлэхдээ итгэлтэй байна уу?**`,
    publishRecordValuesUpdateConfirm: `#### {{survey}}-г нийтлэх нь бүртгэгдсэн өгөгдлийг шинэчлэх болно ####

{{reasons}}

Энэ үйлдэл нь оруулсан өгөгдлийг бүрмөсөн өөрчлөх эсвэл устгах магадлалтай.

Одоо байгаа өгөгдлийг шинэчлэхгүйгээр нийтлэхийн тулд доорх "Өгөгдлийн шинэчлэлтийг алгасах" гэснийг сонгоно уу (зөвлөдөггүй).`,
    publishRecordValuesUpdateConfirmHeader: 'Одоо байгаа бичлэгийн өгөгдөл шинэчлэгдэнэ',
    publishRecordValuesUpdateConfirmOk: 'Нийтлэх ба өгөгдлийг шинэчлэх',
    publishRecordValuesUpdateConfirmInputLabel:
      'Баталгаажуулахын тулд судалгааны нэр "{{strongConfirmRequiredText}}"-г бичнэ үү',
    publishRecordValuesUpdateReasonAttributeChanged:
      'Дараах атрибутууд өөрчлөгдөх бөгөөд одоо байгаа бичлэгүүдэд тэдгээрийн утга автоматаар дахин тооцоологдоно: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'Дараах атрибутууд нь өөрчлөгдсөн ангилал эсвэл таксономийн нэмэлт шинж чанарыг ашигладаг тул одоо байгаа бичлэгүүдэд утга нь дахин тооцоологдоно: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Өгөгдлийн шинэчлэлтийг алгасах',
    publishSkipDataUpdateConfirmOk: 'Өгөгдлийн шинэчлэлтийг алгасаад нийтлэх',
    publishSkipDataUpdateImplications: 'Өгөгдлийн шинэчлэлтийг алгасах нь дараахыг илэрхийлнэ:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Одоо байгаа бичлэгүүд шинэ судалгааны тодорхойлолттой нийцэхгүй болж болно',
    publishSkipDataUpdateImplicationStaleValues:
      'Нөлөөлөлд өртсөн утгууд гараар дахин оруулах хүртэл дахин тооцоологдохгүй',
    publishSkipDataUpdateImplicationChains:
      'Эдгээр атрибутыг ашигладаг боловсруулалтын дараалал (chain) хуучирсан үр дүн гаргаж болзошгүй',
    raiseTicketInSupportForum: `Асуудал гарвал манай <b>Дэмжлэгийн Форум</b>: $t(links.supportForum) руу 'arena' шошготой тасалбар үүсгэнэ үү.`,
    record: 'Бичлэг',
    record_other: 'Бичлэгүүд',
    remaining: 'Үлдсэн хугацаа',
    remote: 'Алсын',
    required: 'Шаардлагатай',
    requiredField: 'шаардлагатай талбар',
    reset: 'Дахин тохируулах',
    refresh: 'Шинэчлэх',
    pressRefreshToReloadPage: 'Хуудсыг дахин ачаалахын тулд Шинэчлэх товчийг дарна уу.',
    resume: 'Үргэлжлүүлэх',
    retry: 'Дахин оролдох',
    role: 'Үүрэг',
    save: 'Хадгалах',
    saveAndBack: 'Хадгалах ба буцах',
    saved: 'Хадгалсан!',
    samplingPolygon: 'Түүвэрлэх олон өнцөгт',
    show: 'Харуулах',
    select: 'Сонгох',
    selectOne: 'Нэгийг сонгоно уу...',
    selectAll: 'Бүгдийг сонгох',
    selected: 'Сонгогдсон',
    showLabels: 'Шошго харуулах',
    showLabelsAndNames: 'Шошго ба нэр харуулах',
    showNames: 'Нэр харуулах',
    sort: 'Эрэмбэлэх',
    sortAsc: 'Өсөх эрэмбэ',
    sortDesc: 'Буурах эрэмбэ',
    sortNone: 'Эрэмбэ арилгах',
    srs: 'SRS',
    status: 'Төлөв',
    sum: 'Нийлбэр',
    test: 'Турших',
    to: 'Хүртэл',
    totalItems: 'Нийт элемент',
    true: 'Үнэн',
    trySplittingFileIntoSmallerChunks: 'Файлыг жижиг хэсгүүдэд хуваахыг оролдоно уу.',
    type: 'Төрөл',
    undefinedName: 'Тодорхойгүй нэр',
    unique: 'Өвөрмөц',
    upload: 'Байршуулах',
    uploadErrorConfirm: {
      message: `Файл хуулах явцад алдаа гарлаа: {{error}}.\n
Дахин оролдох уу?`,
    },
    uploadFileChangedError: 'Сонгосон файл сонгосноос хойш өөрчлөгдсөн бололтой байна. Түүнийг дахин сонгоно уу.',
    uploadingFile: 'Файл байршуулж байна ({{progressPercent}}%)',
    value: 'Утга',
    view: 'Харах',
    warning: 'Анхааруулга',
    warning_other: 'Анхааруулгууд',
    yes: 'Тийм',
    date: {
      aMomentAgo: 'Саяхан',
      hour: 'цаг',
      hour_other: 'цаг',
      day: 'өдөр',
      day_other: 'өдөр',
      minute: 'минут',
      minute_other: 'минут',
      week: 'долоо хоног',
      week_other: 'долоо хоног',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} }) өмнө`,
    },
    paginator: {
      firstPage: 'Эхний хуудас',
      goToPage: 'Хуудас руу очих',
      itemsPerPage: 'Нэг хуудсанд ногдох элемент',
      lastPage: 'Сүүлийн хуудас',
      nextPage: 'Дараагийн хуудас',
      page: 'Хуудас',
      previousPage: 'Өмнөх хуудас',
    },
    table: {
      visibleColumns: 'Харагдах баганууд',
    },
  },
  confirm: {
    strongConfirmInputLabel: 'Батлахын тулд дараах текстийг бичнэ үү: **{{strongConfirmRequiredText}}**',
  },
  dropzone: {
    acceptedFilesMessage:
      '(Зөвхөн {{acceptedExtensions}} өргөтгөлтэй, хамгийн ихдээ {{maxSize}} хэмжээтэй файлуудыг хүлээн авна)',
    error: {
      fileNotValid: 'Сонгосон файл хүчингүй байна',
      fileTooBig: 'Сонгосон файл хэт том байна',
      invalidFileExtension: 'Хүчингүй файлын өргөтгөл: {{extension}}',
    },
    message: 'Файлыг энд чирж оруулах, эсвэл сонгохын тулд дарна уу',
    selectedFile: 'Сонгогдсон файл',
    selectedFile_other: 'Сонгогдсон файлууд',
  },
  error: {
    pageNotFound: 'Хуудас олдсонгүй',
  },
  geo: {
    area: 'Талбай',
    vertices: 'Оройнууд',
    perimeter: 'Периметр',
  },
  files: {
    header: 'Файлууд',
    missing: ' Дутуу файлууд: {{count}}',
    totalSize: 'Нийт хэмжээ: {{size}}',
    fileName: 'Файлын нэр',
    fileSize: 'Файлын хэмжээ',
  },
  sidebar: {
    logout: 'Гарах',
  },
  header: {
    theme: {
      label: 'Загвар',
      light: 'Цайвар',
      dark: 'Бараан',
      system: 'Системийн тохиргоо',
    },
    myProfile: 'Миний профайл',
    qrCodeLoginDialog: {
      title: 'Arena Mobile-д QR код ашиглан нэвтрэх',
      instructions: `1. Гар утсан дээрээ **Arena Mobile** аппыг нээнэ үү
2. **Тохиргоо** цэс рүү орно уу
3. **Серверт холбогдох**-ыг сонгоно уу
4. **QR кодоор нэвтрэх**-ийг дарна уу
5. Энэ дэлгэц дээр харагдаж буй QR кодыг уншуулна уу`,
      success: 'Амжилттай нэвтэрлээ!',
      error: 'QR код үүсгэхэд алдаа гарлаа: {{error}}',
    },
  },
  nodeDefsTypes: {
    integer: 'Бүхэл тоо',
    decimal: 'Бутархай тоо',
    text: 'Текст',
    date: 'Огноо',
    time: 'Цаг',
    boolean: 'Боол',
    code: 'Код',
    coordinate: 'Координат',
    geo: 'Газарзүйн',
    taxon: 'Таксон',
    file: 'Файл',
    entity: 'Объект',
  },

  // ====== App modules and views
  appModules: {
    home: 'Нүүр хуудас',
    landing: 'Тавтай морил',
    dashboard: 'Хяналтын самбар',
    surveyNew: 'Шинэ судалгаа',
    surveys: 'Судалгаанууд',
    templateNew: 'Шинэ загвар',
    templates: 'Загварууд',
    usersAccessRequest: 'Хэрэглэгчийн хандалтын хүсэлтүүд',
    collectImportReport: 'Цуглуулгын импортын тайлан',

    surveyInfo: 'Судалгааны мэдээлэл',
    designer: 'Судалгаа',
    formDesigner: 'Маягтын дизайнер',
    surveyHierarchy: 'Иерархи',
    surveyDependencyTree: 'Хамаарлын мод',
    surveyCompare: 'Харьцуулах / файлаас шинэчлэх',
    category: 'Ангилал',
    categories: 'Ангилалууд',
    nodeDef: 'Зангилааны тодорхойлолт',
    taxonomy: 'Таксоном',
    taxonomies: 'Таксономууд',

    data: 'Өгөгдөл',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
    recordValidationReport: 'Бичлэгийн баталгаажуулалтын тайлан',
    explorer: 'Хайгч',
    map: 'Газрын зураг',
    charts: 'Графикууд',
    export: 'Өгөгдөл экспортлох',
    import: 'Өгөгдөл импортлох',
    validationReport: 'Баталгаажуулалтын тайлан',

    users: 'Хэрэглэгчид',
    user: 'Хэрэглэгчийн профайл',
    userPasswordChange: 'Нууц үг солих',
    userInvite: 'Хэрэглэгч урих',
    userNew: 'Шинэ хэрэглэгч',
    usersSurvey: 'Хэрэглэгчдийн жагсаалт',
    userGroup: 'Хэрэглэгчийн бүлэг',
    userGroup_other: 'Хэрэглэгчийн бүлгүүд',
    userGroupNew: 'Шинэ хэрэглэгчийн бүлэг',
    usersList: 'Хэрэглэгчдийн жагсаалт (бүгд)',
    user2FADevice: '2FA төхөөрөмж',
    user2FADevice_other: '2FA төхөөрөмжүүд',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Шинжилгээ',
    chain: 'Гинж',
    chain_other: 'Гинжүүд',
    virtualEntity: 'Виртуал объект',
    entities: 'Виртуал объектууд',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Жишээнүүд',
    message: 'Мессеж',
    message_other: '$t(common.message_other)',

    systemAdmin: 'Системийн удирдлага',
    jobMonitor: 'Ажлын хяналт',
    systemLogs: 'Системийн бүртгэл',

    help: 'Тусламж',
    about: 'Тухай',
    changelog: 'Өөрчлөлтийн түүх',
    whatsNew: 'Шинэ боломжууд',
    disclaimer: 'Хариуцлагаас татгалзах',
    userManual: 'Хэрэглэгчийн гарын авлага',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'Энэ хэсэг нь зөвхөн судалгаа нийтлэгдсэн үед л боломжтой.',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Хамаарлын төрлүүд',
    dependencyTypes: {
      applicable: 'Хэрэглэх боломжтой',
      defaultValues: 'Үндсэн утгууд',
      editable: 'Засах боломжтой',
      fileName: 'Файлын нэр',
      itemsFilter: 'Элементүүдийн шүүлтүүр',
      maxCount: 'Хамгийн их тоо',
      minCount: 'Хамгийн бага тоо',
      parentCode: 'Эх кодекс',
      validations: 'Баталгаажуулалтууд',
      visible: 'Харагдах',
    },
    selectAtLeastOneDependencyType: 'Наад зах нь нэг хамаарлын төрлийг сонгоно уу',
    noDependenciesToDisplay: 'Харуулах хамаарал байхгүй',
  },
  designerView: {
    formPreview: 'Маягтын урьдчилан харах',
  },
  recordView: {
    justDeleted: 'Энэ бичлэг саяхан устгагдсан',
    sessionExpired: 'Бичлэгийн сесс дууссан',
    errorLoadingRecord: 'Бичлэг ачааллахад алдаа гарлаа: {{details}}',
    recordEditModalTitle: 'Бичлэг: {{keyValues}}',
    recordNotFound: 'Бичлэг олдсонгүй',
    keyAttributeEditing: {
      lock: 'Түлхүүр атрибутын засварыг түгжих',
      unlock: 'Түлхүүр атрибутыг засахыг зөвшөөрөх',
    },
    qualifierAttributeEditing: {
      lock: 'Квалификатор атрибутын засварыг түгжих',
      unlock: 'Квалификатор атрибутыг засахыг зөвшөөрөх',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Энэ өөрчлөн нэгтгэсэн функцийг устгах уу?',
      sqlExpression: 'SQL илэрхийлэл',
    },
    editRecord: 'Бичлэгийг засах',
  },
  mapView: {
    changeMarkerColor: 'Тэмдэглэгээний өнгө өөрчлөх',
    createRecord: 'Шинэ бичлэг үүсгэх',
    editRecord: 'Бичлэгийг засах',
    elevation: 'Өндөр (м)',
    location: 'Байршил',
    locationEditInfo: 'Байршлыг шинэчлэхийн тулд газрын зураг дээр давхар товших эсвэл тэмдэглэгээг чирэх',
    locationNotValidOrOutOfRange: 'Байршил хүчингүй эсвэл UTM бүсийн хязгаараас хэтэрсэн',
    locationUpdated: 'Байршил шинэчлэгдсэн',
    options: {
      showLocationMarkers: 'Байршлын тэмдэглэгээг харуулах',
      showMarkersLabels: `Тэмдэглэгээний шошгыг харуулах`,
      showSamplingPolygon: `Түүвэрлэх олон өнцөгт`,
      showControlPoints: `Хяналтын цэгүүд`,
      showPlotReferencePoint: `Газрын зургийн лавлах цэг`,
      showUtmGrid: 'UTM торыг харуулах',
    },
    rulerTooltip: `Зай хэмжиж эхлэхийн тулд товчийг дарна уу.
- замыг хэмжихийн тулд олон удаа дарна уу
- хэмжилтийг дуусгахын тулд давхар дарах эсвэл ESC товчийг дарна уу
- хэмжилтийг нуухын тулд товчийг дахин дарна уу`,
    samplingPointDataLayerName: 'Түүвэрлэх цэгийн өгөгдөл - түвшин {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (ачаалж байна...)',
    samplingPointItemPopup: {
      title: 'Түүвэрлэх цэгийн элемент',
      levelCode: 'Түвшин {{level}} код',
    },
    selectedPeriod: 'Сонгогдсон хугацаа',
  },
  samplingPolygonOptions: {
    circle: 'Дугуй',
    controlPointOffsetEast: 'Лавлах цэгийн зүүн зүгт шилжилт (м)',
    controlPointOffsetNorth: 'Лавлах цэгийн хойд зүгт шилжилт (м)',
    lengthLatitude: 'Өргөргийн урт (м)',
    lengthLongitude: 'Уртрагийн урт (м)',
    numberOfControlPoints: 'Хяналтын цэгийн тоо',
    numberOfPointsEast: 'Зүүн зүгт хяналтын цэгийн тоо',
    numberOfPointsNorth: 'Хойд зүгт хяналтын цэгийн тоо',
    offsetEast: 'Зүүн зүгт шилжилт (м)',
    offsetNorth: 'Хойд зүгт шилжилт (м)',
    radius: 'Радиус (м)',
    rectangle: 'Тэгш өнцөгт',
    samplingPolygon: 'Түүвэрлэх олон өнцөгт',
    shape: 'Хэлбэр',
  },
  kmlUploader: {
    opacity: 'тунгалаг байдал',
    selectFile: 'Файл сонгох',
    title: 'KML/KMZ/Shapefile сонголтууд',
  },
  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Харьцуулах хугацааг сонгоно уу',
    falseColor: 'Худал өнгө',
  },
  surveysView: {
    chains: 'Гинжүүд',
    confirmUpdateSurveyOwner: `Судалгаа "{{surveyName}}"-ийн эзэмшигчийг "{{ownerName}}" болгож өөрчлөх үү?`,
    cycles: 'Мөчлөгүүд',
    datePublished: 'Нийтэлсэн огноо',
    editUserExtraProps: 'Хэрэглэгчийн нэмэлт шинж чанаруудыг засах',
    editUserExtraPropsForSurvey: 'Судалгаа "{{surveyName}}"-ийн хэрэглэгчийн нэмэлт шинж чанаруудыг засах',
    filter: 'Шүүх',
    filterPlaceholder: 'Нэр, шошго эсвэл эзэмшигчээр шүүх',
    languages: 'Хэлнүүд',
    nodes: 'Зангилаанууд',
    noSurveysMatchingFilter: 'Заасан шүүлтүүрт тохирох судалгаа байхгүй',
    onlyOwn: 'Зөвхөн өөрийн судалгаанууд',
    records: 'Бичлэгүүд',
    recordsCreatedWithMoreApps: 'Илүү олон програмаар үүсгэсэн бичлэгүүд:',
    status: {
      published: 'Нийтэлсэн',
      draft: 'Ноорог',
      'published-draft': 'Нийтэлсэн/Ноорог',
    },
  },
  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Хүлээн авсан',
      CREATED: 'Хүлээгдэж байна',
    },
    acceptRequest: {
      accept: 'Хүлээн авах',
      acceptRequestAndCreateSurvey: 'Хүсэлтийг хүлээн авч судалгаа үүсгэх',
      confirmAcceptRequestAndCreateSurvey:
        '**{{email}}**-ийн хандалтын хүсэлтийг **{{role}}**-ын хувиар хүлээн авч, **{{surveyName}}** гэсэн шинэ судалгаа үүсгэх үү?',
      error: 'Хандалтын хүсэлтийг хүлээн авахад алдаа гарлаа: {{error}}',
      requestAcceptedSuccessfully: 'Хандалтын хүсэлтийг амжилттай хүлээн авлаа. $t(common.emailSentConfirmation)',
      surveyLabel: 'Судалгааны шошго',
      surveyLabelInitial: '(Судалгааны нэр, шошгыг шаардлагатай бол өөрчлөх)',
      surveyName: 'Судалгааны нэр',
      template: 'Загвар',
    },
  },
  userView: {
    scale: 'Хэмжээс',
    rotate: 'Эргүүлэх',
    dragAndDrop: 'Зургийг дээр нь чирж оруулах эсвэл',
    upload: 'байршуулахын тулд энд дарна уу',
    remove: 'Профайл зургийг устгах уу?',
    sendNewInvitation: 'Шинэ урилга илгээх',
    removeFromSurvey: 'Судалгаанаас хасах',
    confirmRemove: 'Та {{user}}-г {{survey}} судалгаанаас хасахдаа итгэлтэй байна уу?',
    removeUserConfirmation: 'Хэрэглэгч {{user}} нь {{survey}} судалгаанаас хасагдсан',
    maxSurveysUserCanCreate: 'Хэрэглэгчийн үүсгэх боломжтой хамгийн их судалгааны тоо',
    preferredUILanguage: {
      label: 'Хэрэглэгчийн интерфэйсийн хүссэн хэл',
      auto: 'Автоматаар илрүүлсэн ({{detectedLanguage}})',
    },
    newPassword: 'Нууц үг',
    confirmPassword: 'Нууц үгээ баталгаажуулах',
    manageTwoFactorDevices: {
      label: '2FA удирдах',
      title: 'Хоёр хүчин зүйлийн баталгаажуулалтын төхөөрөмжүүдийг удирдах',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Хэрэглэгчийн нууц үг солих: {{user}}',
    oldPassword: 'Хуучин нууц үг',
    newPassword: 'Шинэ нууц үг',
    confirmPassword: 'Шинэ нууц үгээ баталгаажуулах',
    changePassword: 'Нууц үг солих',
    passwordChangedSuccessfully: 'Нууц үг амжилттай солигдлоо!',
    notAuthorizedToChangePasswordOfAnotherUser: 'Та өөр хэрэглэгчийн нууц үгийг солих эрхгүй байна',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Хэрэглэгч {{email}}-г Систем Администратороор урих уу?',
    confirmInviteSystemAdmin_other: 'Хэрэглэгч {{email}}-г Систем Администратороор урих уу?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}} хаяг алгассан (тэдгээр нь энэ судалгаанд өмнө нь уригдсан байсан): {{skippedEmails}}`,
    invalidEmailsWarning:
      '{{emails}} имэйл хаягт хүрч чадсангүй, энэ хаяг байхгүй байж магадгүй. Үүнийг доорх жагсаалтад үлдээсэн: засах эсвэл устгаад дахин урьж үзнэ үү.',
    invalidEmailsWarning_other:
      '{{emails}} имэйл хаягуудад хүрч чадсангүй, эдгээр хаяг байхгүй байж магадгүй. Тэдгээрийг доорх жагсаалтад үлдээсэн: засах эсвэл устгаад дахин урьж үзнэ үү.',
    groupPermissions: {
      label: 'Эрхүүд',
      systemAdmin: `
        <li>Системийн бүрэн хандалтын эрх</li>`,
      surveyManager: `
        <li>Судалгаанууд:
          <ul>
            <li>үүсгэх</li>
            <li>хувилах</li>
            <li>өөрийн судалгааг засах</li>
            <li>өөрийн судалгааг устгах</li>
          </ul>
        </li>
        <li>Хэрэглэгчид:
          <ul>
            <li>өөрийн судалгаанд хэрэглэгч урих</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Судалгаанууд:
          <ul>
            <li>хувилах</li>
            <li>өөрийн судалгааг засах</li>
            <li>өөрийн судалгааг устгах</li>
          </ul>
        </li>
        <li>Хэрэглэгчид:
          <ul>
            <li>өөрийн судалгаанд хэрэглэгч урих</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Судалгаанууд:
          <ul>
            <li>өөрийн судалгааг засах</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Өгөгдөл:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>Газрын зургийн хэрэгсэлд хандах</li>
          </ul>
        </li>
        <li>Шинжилгээ:
          <ul>
            <li>бүх хэрэгсэлд бүрэн хандалтын эрх</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Өгөгдөл:
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>өгөгдлийн баталгаажуулалтын хэрэгсэлд хандах</li>
        <li>бичлэгүүдийг "Шинжилгээ" үе шат руу илгээх</li>`,
      dataEditor: `
        <li>Өгөгдөл:
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>шинэ бичлэг нэмэх (өөрийн судалгаанууд)</li>
        <li>одоо байгаа бичлэгүүдийг засах (өөрийн судалгаанууд)</li>
        <li>бичлэгүүдийг "Цэвэрлэгээ" үе шат руу илгээх</li>`,
    },
    messageOptional: 'Мессеж (заавал биш)',
    messageInfo: `Мессеж нь хэрэглэгч рүү илгээгдсэн имэйлд харагдана.
Энэ нь энгийн текст эсвэл Markdown хэл байж болно (https://www.markdownguide.org).`,
    sendInvitation: 'Урилга илгээх',
    surveyNotPublishedWarning: `**Анхааруулга**: судалгаа нийтлэгдээгүй байна.
      Хэрэглэгчдийг зөвхөн ***$t(auth:authGroups.systemAdmin.label)*** болон ***$t(auth:authGroups.surveyAdmin.label)*** үүргээр урих боломжтой.
      Хэрэв та өөр үүрэгтэй хэрэглэгчдийг урихыг хүсвэл эхлээд судалгаагаа нийтлэх хэрэгтэй.`,
    typeEmail: 'Имэйл хаягийг бичээд, Нэмэх товчийг дарна уу',
  },
  user: {
    mapApiKeys: {
      title: 'Газрын зураг API түлхүүрүүд',
      mapProviders: {
        planet: 'Планет',
      },
      keyIsCorrect: 'Энэ API түлхүүр хүчинтэй',
      keyIsNotCorrect: 'Энэ API түлхүүр ХҮЧИНГҮЙ',
    },
    title: 'Цол',
    titleValues: {
      mr: 'Ноён',
      ms: 'Хатагтай',
      preferNotToSay: 'Хэлэхгүй байхыг хүсэж байна',
    },
  },
  chainView: {
    baseUnit: {
      confirmDelete:
        'Суурь нэгжийг устгаснаар та бүх "талбай дээр суурилсан хувьсагч" сонголтуудыг болино. Үргэлжлүүлэх үү?',
    },
    downloadSummaryJSON: 'Хураангуй татах (JSON)',
    mauFile: {
      upload: 'MAU.zip байршуулах',
      download: 'MAU.zip татах',
      delete: 'MAU.zip устгах',
      confirmCycleAssociation: 'MAU.zip файл нь одоогийн мөчлөгтэй ({{cycle}}) холбогдоно. Үргэлжлүүлэх үү?',
      confirmReplace: 'Энэ хэлхээнд MAU.zip файл аль хэдийн байршуулагдсан байна. Үүнийг солих уу?',
      confirmDelete: 'Энэ хэлхээнд байршуулсан MAU.zip файлыг устгах уу?',
      uploadComplete: 'MAU.zip файл амжилттай байршуулагдлаа',
      deleteComplete: 'MAU.zip файл устгагдлаа',
      invalidFileExtension: '.zip файл сонгоно уу',
    },
    phase1Category: '1-р үе шатны ангилал',
    phase1CategoryInfo: '1-р үе шатны түүврийг агуулсан ангиллыг сонгоно уу.',
    phase2JoinEntity: {
      label: 'Холболтын объект (2-р үе шат)',
      info: 'Суурь нэгжийг 1-р үе шатны ангилалтай холбоход ашиглах объект: суурь нэгж өөрөө, эсвэл түүний эцэг объектуудын аль нэг.',
    },
    phase2AsSamplingPointData: {
      label: 'Sampling Point Data холбоосыг ашиглан холбох',
      info: '2-р үе шатны объектын түлхүүр(үүд) нь 1-р үе шатанд ашигласантай ижил Sampling Point Data хүснэгтээс уншигдана.',
    },
    phase1JoinAttribute: {
      label: 'Холболтын шинж чанар (1-р үе шат)',
      info: '$t(chainView.phase1Category) хүснэгтийн баганыг (нэмэлт шинж чанар эсвэл "code") 2-р үе шатны холболтын объекттой холбоход ашиглана.',
    },
    phase2JoinAttribute: {
      label: 'Холболтын шинж чанар (2-р үе шат)',
      info: '1-р үе шатны хүснэгттэй холбохын тулд 2-р үе шатны объектын шинж чанарыг сонгоно уу; түүний утгыг өмнөх 1-р үе шатны холболтын шинж чанартай харьцуулна.',
    },
    formLabel: 'Боловсруулах гинжийн шошго',
    basic: 'Үндсэн',
    records: 'Бичлэгүүд',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Зөвхөн шинжилгээний алхамын өгөгдлийг RStudio руу илгээх',
    submitOnlySelectedRecordsIntoR: 'Зөвхөн сонгогдсон бичлэгүүдийг RStudio руу илгээх',
    includeEntitiesWithoutData: 'Өгөгдөлгүй объектуудыг оруулах',
    cannotStartRStudio: {
      common: 'RStudio-г эхлүүлэх боломжгүй',
      noRecords: '$t(chainView.cannotStartRStudio.common): илгээх бичлэг байхгүй',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): эхлээд судалгааг нийтлэх',
    },
    nonResponseBiasCorrection: 'Хариу өгөхгүй байх хазайлт засварлах',
    nonResponseBiasCorrectionInfo: `Жинлэлтийн ангиллын тохируулгын аргыг хэрэгжүүлэхийн тулд 'design_psu' болон 'design_ssu'-г давхаргын ангиллын хүснэгтэд нэмэлт тоон шинж чанар болгон нэмнэ үү.`,
    pValue: 'P-утга',
    resultsBackFromRStudio: 'RStudio-оос үр дүнг буцааж уншсан',
    resultsBackFromRStudioInfo: `RStudio-д тооцоолсон үр дүнгийн шинж чанаруудыг Arena сервер рүү буцааж импортлох шаардлагатай бол энэ сонголтыг идэвхжүүлнэ үү.
Энэ үйл явц удаан байж болзошгүй.`,
    samplingDesign: 'Түүвэрлэлтийн загвар',
    samplingDesignDetails: 'Түүвэрлэлтийн загварын дэлгэрэнгүй мэдээлэл',
    samplingStrategyLabel: 'Түүвэрлэлтийн стратеги',
    samplingStrategy: {
      simpleRandom: 'Энгийн санамсаргүй түүвэрлэлт',
      systematic: 'Системчилсэн түүвэрлэлт',
      stratifiedRandom: 'Үечилсэн санамсаргүй түүвэрлэлт',
      stratifiedSystematic: 'Үечилсэн системчилсэн түүвэрлэлт',
      twoPhase: 'Хоёр үе шаттай түүвэрлэлт',
    },
    statisticalAnalysis: {
      header: 'Статистик шинжилгээ',
      entityToReport: 'Тайлагнах объект',
      entityWithoutData: 'Объект {{name}} өгөгдөлгүй байна',
      filter: 'Шүүлтүүр (R скрипт)',
      reportingMethod: 'Тайлагнах арга',
      reportingMethods: {
        dimensionsCombined: 'Хэмжээсүүдийг нэгтгэсэн',
        dimensionsSeparate: 'Хэмжээсүүдийг тусад нь',
      },
      reportingArea: 'Нийт тайлагнах талбай (га) (Заавал биш)',
      reportingAreaInfo: `Үечилсэн түүвэрлэлтийн хувьд үечилсэн шинж чанарын ангиллын хүснэгтэд давхаргуудын талбайг оруулна уу (баганын нэр 'area')`,
    },
    stratumAttribute: 'Үеийн шинж чанар',
    stratumAttributeInfo: 'Түүврийг давхаргад хуваахад ашиглах хувьсагчийг сонгоно уу.',
    stratumAttribute2ndPhaseInfo: `Эцсийн, дэлгэрэнгүй дэд түүврийг гаргаж авахаас өмнө 1-р үе шатны түүврийг дэд давхаргад хуваахад ашиглах хувьсагчийг сонгоно уу. Зөвхөн 1-р үе шатны ангиллын багана болж мөн орсон нэртэй атрибутууд харагдана.`,
    postStratificationAttribute: 'Дараах үечилсэн шинж чанар',
    areaWeightingMethod: 'Талбайн жинлэх арга',
    clusteringEntity: 'Бүлэглэх объект',
    clusteringEntityInfo: `Анхдагч түүврийн нэгжийг тодорхойлох объект. Тэмдэглэл: Энэ нь зөвхөн R survey багцын хүрээнд кластерийн шинжилгээнд ашиглагдана.`,
    clusteringOnlyVariances: 'Зөвхөн хэлбэлзэлд зориулсан бүлэглэлт',
    errorNoLabel: 'Гинж нь хүчинтэй шошготой байх ёстой',
    dateExecuted: 'Гүйцэтгэсэн огноо',
    deleteChain: 'Гинжийг устгах',
    deleteConfirm: `Энэ боловсруулах гинжийг устгах уу?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Боловсруулах гинж устгагдсан',
    cloneFromAnotherSurvey: 'Өөр судалгаанаас хуулах',
    cloneFromAnotherSurveyDialog: {
      title: 'Өөр судалгаанаас гинжийг хуулах',
      sourceSurvey: 'Эх судалгаа',
      sourceChain: 'Эх гинж',
      entityCheck: 'Объектын нийцтэй байдал',
      entityMissing: 'зорилтот судалгаанд байхгүй',
      skipMissingEntities: 'Зорилтот судалгаанд байхгүй объектуудын шинжилгээний шинж чанаруудыг алгасах',
      noAnalysisAttributes: 'Энэ гинж шинжилгээний шинж чанаргүй байна',
      cloneComplete: 'Гинж амжилттай хуулагдсан',
      missingEntities: 'Хуулах боломжгүй: дараах объектууд зорилтот судалгаанд байхгүй байна: {{entities}}',
    },
    cannotSelectNodeDefNotBelongingToCycles: `Зангилааны тодорхойлолт "{{label}}" нь боловсруулах гинжийн бүх мөчлөгт хамаарахгүй тул сонгох боломжгүй.`,
    cannotSelectCycle:
      'Энэ мөчлөгийг сонгох боломжгүй, учир нь зарим зангилааны тодорхойлолтууд энэ мөчлөгт хамаарахгүй.',
    copyRStudioCode: `#### Та RStudio Сервер нээх гэж байна ####
##### ОК товчийг дарна уу, энэ командуудыг таны санах ойд хуулах болно. #####
###### RStudio Сервер нээгдэх болно; RStudio консол идэвхжсэн үед дараах мөрүүдийг хуулж гүйлгэж гинжийн кодыг импортлоно уу: ######
{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### RStudio руу боловсруулах гинж ####
###### ОК товчийг дарна уу, энэ командуудыг таны санах ойд хуулах болно. ######
###### Өөрийн машин дээр RStudio-г эхлүүлнэ үү (та 'rstudioapi' багц суулгасан байх ёстой). ######
###### RStudio консол идэвхжсэн үед дараах мөрүүдийг хуулж гүйлгэж гинжийн кодыг импортлоно уу: ######
{{rStudioCode}}
`,
    entities: {
      new: 'Виртуал объект',
    },
    reportingDataCategory: 'Тайлагнах өгөгдлийн ангиллын хүснэгтийн нэр',
    reportingDataAttribute: '{{level}}-д зориулсан шинж чанар',
    reportingDataTableAndJoinsWithAttributes: 'Тайлагнах өгөгдлийн хүснэгт болон шинж чанаруудтай нэгдэл',
    showSamplingAttributes: 'Түүвэрлэх шинж чанаруудыг харуулах',
  },
  instancesView: {
    title: 'Жишээнүүд',
    terminate: 'Дуусгах',
  },
  chain: {
    quantitative: 'Тоон',
    categorical: 'Ангиллын',
    addQuantitative: 'Тоон шинж чанар нэмэх',
    addCategorical: 'Ангиллын шинж чанар нэмэх',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'объект болон түүнтэй холбоотой бүх үр дүнгийн хувьсагчид RStudio скриптүүдэд хасагдана',
    entityWithoutData: 'Объект {{name}} өгөгдөлгүй байна; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle: 'Объект {{name}} нь сонгогдсон мөчлөгт байхгүй; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Хүчингүй эсвэл хугацаа нь дууссан токен',
    },
  },
  itemsTable: {
    unused: 'Ашиглагдаагүй',
    noItemsAdded: 'Элемент нэмэгдээгүй',
  },
  expression: {
    functionHasTooFewArguments: 'Функц {{fnName}}-д наад зах нь {{minArity}} аргумент шаардлагатай ({{numArgs}} авсан)',
    functionHasTooManyArguments:
      'Функц {{fnName}} нь хамгийн ихдээ {{maxArity}} аргумент хүлээн авдаг ({{numArgs}} авсан)',
    identifierNotFound: 'Шинж чанар эсвэл объект "{{name}}" олдсонгүй',
    invalid: 'Хүчингүй илэрхийлэл: {{details}}',
    invalidAttributeValuePropertyName: 'Хүчингүй шинж чанарын утгын шинж чанарын нэр: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Хүчингүй нэмэлт шинж чанарын нэр: {{propName}}',
    invalidCategotyName: 'Хүчингүй ангиллын нэр: {{name}}',
    invalidTaxonomyExtraProp: 'Хүчингүй таксономын нэмэлт шинж чанарын нэр: {{propName}}',
    invalidTaxonomyName: 'Хүчингүй таксономын нэр: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Хүчингүй таксоны нутгийн нэрийн хэлний код: {{vernacularLangCode}}',
    missingFunctionParameters: 'Функцын дутуу параметрүүд',
    undefinedFunction: 'Тодорхойгүй функц: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
Тухай
========

$t(common.appNameFull)
--------
 
 * Хөгжүүлсэн: $t(links.openforis)
 * Хувилбар: {{version}}
 * Вэбсайт: $t(links.openforisArenaWebsite)
 * Arena видео хичээлүүд FAO elearning Академид: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Arena видео хичээлүүд YouTube-д: $t(links.arenaVideoTutorialsInYouTube)
 * Дэмжлэгийн форум: $t(links.supportForum)
 * Arena GitHub-д: $t(links.arenaInGitHub)
 * Arena R Скриптүүд GitHub-д: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Хэл(нүүд)',
  },
  taxonomy: {
    header: 'Таксоном',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Таксоном {{taxonomyName}}-г устгах уу?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Өөр судалгаанаас таксоном хуулах',
      sourceSurvey: 'Эх сурвалж судалгаа',
      sourceTaxonomy: 'Эх сурвалж таксоном',
      loadingSurveys: 'Судалгаанууд ачаалж байна...',
      noSurveysAvailable: 'Судалгаа алга байна',
      selectSurveyFirst: 'Эхлээд судалгаа сонгоно уу',
      loadingTaxonomies: 'Таксоном ачаалж байна...',
      noTaxonomiesAvailable: 'Сонгосон судалгаанд таксоном алга байна',
    },
    edit: {
      taxonomyListName: 'Таксономын жагсаалтын нэр',
      taxaNotImported: 'Таксонуудыг импортлоогүй',
      family: 'Овог',
      genus: 'Төрөл',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Ижил нэр / Латин',
      extraPropsNotDefined: 'Энэ таксономын нэмэлт шинж чанарууд тодорхойлогдоогүй',
      importMissingPublishedTaxa:
        '{{count}} нийтлэгдсэн таксон импортлосон файлд олдоогүй тул өөрчлөгдөлгүй үлдлээ. Кодууд: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} дахин)',
    },
    taxaCount: 'Таксоны тоо',
    vernacularNameLabel: 'Нутгийн нэрийн шошго',
  },
  categoryList: {
    batchImport: 'Ангилалуудыг багцаар импортлох (ZIP-ээс)',
    batchImportCompleteSuccessfully: `{{importedCategories}} ангилал амжилттай импортлогдлоо!
{{insertedCategories}} шинэ
{{updatedCategories}} шинэчлэгдсэн`,
    cloneFromAnotherSurvey: {
      title: 'Өөр судалгаанаас ангилал хуулах',
      sourceSurvey: 'Эх сурвалж судалгаа',
      sourceCategory: 'Эх сурвалж ангилал',
      loadingSurveys: 'Судалгаанууд ачаалж байна...',
      noSurveysAvailable: 'Судалгаа алга байна',
      selectSurveyFirst: 'Эхлээд судалгаа сонгоно уу',
      loadingCategories: 'Ангилал ачаалж байна...',
      noCategoriesAvailable: 'Сонгосон судалгаанд ангилал алга байна',
    },
    itemsCount: 'Элементүүдийн тоо',
    structure: 'Бүтэц',
    types: {
      flat: 'Хавтгай',
      hierarchical: 'Иерархи',
      reportingData: 'Тайлагнах өгөгдөл',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Дээж цэгийн өгөгдөл',
    },
  },
  categoryEdit: {
    header: 'Ангилал',
    addLevel: 'Түвшин нэмэх',
    categoryName: 'Ангиллын нэр',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    confirmDelete: 'Ангилал {{categoryName}}-г устгах уу?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'Ангилал **хоосон** тул устгагдах болно. Үргэлжлүүлэх үү?',
    confirmDeleteLevel: `Түвшин '{{levelName}}'-г бүх элементүүдтэй хамт устгах уу?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Элементийг устгах уу?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Элементийг бүх хүүхдүүдтэй нь хамт устгах уу?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Тайлагнах өгөгдөл болгох',
      confirmMessage: `Энэ ангиллыг Тайлагнах өгөгдлийн ангилал болгон хөрвүүлэх үү?

Түвшингүүдийг level_1, level_2... level_N болгон нэрлэх бөгөөд элементүүдэд нэмэлт 'area' шинж чанар нэмэгдэнэ.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Энэ Тайлагнах өгөгдлийн ангиллыг энгийн ангилал болгон хөрвүүлэх үү?`,
    },
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Дээж цэгийн өгөгдөл рүү хөрвүүлэх',
      confirmMessage: `Энэ ангиллыг Дээж цэгийн өгөгдлийн ангилал болгон хөрвүүлэх үү?

Ангиллын нэр '${samplingPointDataCategoryName}' болж өөрчлөгдөж, элементүүдэд '${locationItemExtraDefName}' нэмэлт талбар нэмэгдэнэ.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'GeoPackage ангилал руу хөрвүүлэх',
      confirmMessage: `Энэ ангиллыг GeoPackage ангилал болгон хөрвүүлэх үү?

Элементүүдэд '${locationItemExtraDefName}' нэмэлт талбар нэмэгдэнэ.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Энгийн ангилал болгон хөрвүүлэх',
      confirmMessage: `Энэ GeoPackage ангиллыг энгийн ангилал болгон хөрвүүлэх үү?

'${locationItemExtraDefName}' нэмэлт талбарын цоожийг тайлах бөгөөд түүнийг бусад нэмэлт талбар шиг нэрийг нь өөрчлөх, төрлийг нь солих эсвэл устгах боломжтой болно. Өгөгдөлд нөлөөлөхгүй.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Энгийн ангилал болгон хөрвүүлэх',
      confirmMessage: `Энэ Дээж цэгийн өгөгдлийн ангиллыг энгийн ангилал болгон хөрвүүлэх үү?

Ангиллын нэрийг цэвэрлэх бөгөөд (шинэ нэр өгөх шаардлагатай болно), '${locationItemExtraDefName}' нэмэлт талбарын цоожийг мөн тайлах бөгөөд түүнийг бусад нэмэлт талбар шиг нэрийг нь өөрчлөх, төрлийг нь солих эсвэл устгах боломжтой болно. Өгөгдөлд нөлөөлөхгүй.`,
    },
    geoPackageCategory: 'Энэ ангилал нь гео чадвартай',
    geoPackageCategoryInfo: `Энэ ангилалд GeoPackage файл болгон экспортлох боломжийг олгодог '${locationItemExtraDefName}' нэртэй нэмэлт талбар байдаг.`,
    samplingPointDataCategoryType: 'Энэ бол Дээж цэгийн өгөгдлийн ангилал юм',
    samplingPointDataCategoryTypeInfo: `Энэ бол дээж цэгийн өгөгдлийн урьдчилан тодорхойлсон ангилал юм. Үүнд GeoPackage файл болгон экспортлох боломжийг олгодог '${locationItemExtraDefName}' нэртэй нэмэлт талбар байдаг.`,
    samplingPointDataCategoryLocationMissing: `'${locationItemExtraDefName}' нэртэй нэмэлт талбар алга байна`,
    createCategory: {
      menuLabel: 'Ангилал нэмэх',
      simple: 'Энгийн ангилал',
      otherTypes: 'Ангиллын бусад төрлүүд',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Дээж цэгийн өгөгдлийн ангилал',
      description:
        'Дээж цэгийн өгөгдлийн урьдчилан тодорхойлсон ангилал бөгөөд элемент бүрт байршлын талбарыг агуулна.',
      message: `Шинэ Дээж цэгийн өгөгдлийн ангилал үүсгэх үү?

Элементүүдэд '${locationItemExtraDefName}' нэмэлт талбар нэмэгдэнэ.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Гео чадвартай ангилал',
      description: 'Элементүүдэд байршлын талбар нэмж, ангиллыг GeoPackage файл болгон экспортлох боломжтой болгоно.',
      message: `Шинэ гео чадвартай ангилал үүсгэх үү?

Элементүүдэд '${locationItemExtraDefName}' нэмэлт талбар нэмэгдэнэ.`,
    },
    deleteItem: 'Элемент устгах',
    level: {
      title: 'Түвшин {{levelPosition}}',
      noItemsDefined: 'Элемент тодорхойлогдоогүй',
      selectItemFromPreviousLevel: 'Өмнөх түвшнээс элемент сонгох',
    },

    importSummary: {
      columns: 'Багана',
      columnTypeSummary: 'Түвшин {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Тайлбар ({{language}})',
      columnTypeLabel: 'Шошго ({{language}})',
      columnType: {
        code: 'код',
        description: 'тайлбар',
        label: 'шошго',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Өгөгдлийн төрөл',
      title: 'Ангиллын импортын хураангуй',
    },
    reportingData: 'Тайлагнах өгөгдөл',
    exportToGeoPackage: 'GeoPackage рүү экспортлох',
    exportToGeoPackageSkippedItems: 'Хүчинтэй байршилгүй {{count}} элементийг алгаслаа.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Whisp шинжилгээ үүсгэх',
      confirmMessage: `Бүх түүвэрлэлтийн цэгт Whisp шинжилгээ үүсгэх үү?

- байршилтай түүвэрлэлтийн цэг бүрийг шинжилгээнд зориулж Open Foris Whisp руу илгээнэ
- үр дүнг түүвэрлэлтийн цэгийн өгөгдөлтэй нэгтгэж '${samplingPointDataWhispCategoryName}' ангилалд хадгална
- хэрэв '${samplingPointDataWhispCategoryName}' ангилал аль хэдийн байгаа бол түүний агуулгыг солино
- шинжилгээ арын горимд ажиллах бөгөөд түүвэрлэлтийн цэгийн тооноос хамааран хэдэн минут үргэлжилж болно`,
    },
    templateFor_samplingPointDataImport_csv: 'Түүвэрлэлтийн цэгийн загвар (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Түүвэрлэлтийн цэгийн загвар (Excel)',
  },
  extraProp: {
    label: 'Нэмэлт талбар',
    label_other: 'Нэмэлт',
    addExtraProp: 'Талбар нэмэх',
    dataTypes: {
      geometryPoint: 'Геометрийн цэг',
      number: 'Тоо',
      text: 'Текст',
    },
    editor: {
      title: '$t(extraProp.label_other)-г засах',
      confirmDelete: 'Нэмэлт шинж чанар "{{name}}"-г устгах уу?',
      confirmSave: `Нэмэлт шинж чанарын тодорхойлолтуудад өөрчлөлт хадгалах уу?

  **Анхааруулгууд**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Нэр {{nameOld}}-ээс {{nameNew}} болж өөрчлөгдсөн',
        dataTypeChanged: 'Өгөгдлийн төрөл {{dataTypeOld}}-ээс {{dataTypeNew}} болж өөрчлөгдсөн',
      },
    },
    name: 'Шинж чанар {{position}} нэр',
    value: 'Утга',
  },
  record: {
    ancestorNotFound: 'Бичлэгт дээд зангилаа олдсонгүй',
    keyDuplicate: 'Бичлэгийн түлхүүр давхцсан',
    oneOrMoreInvalidValues: 'Нэг буюу хэд хэдэн утга хүчингүй байна',
    uniqueAttributeDuplicate: 'Давхцсан утга',

    attribute: {
      customValidation: 'Хүчингүй утга',
      uniqueDuplicate: 'Давхцсан утга',
      valueInvalid: 'Хүчингүй утга',
      valueRequired: 'Шаардлагатай утга',
    },
    entity: {
      keyDuplicate: 'Объектын түлхүүр давхцсан',
    },
    nodes: {
      count: {
        invalid: '{{nodeDefName}} зангилаа нь яг {{count}} байх ёстой',
        maxExceeded: '{{nodeDefName}} зангилаа нь {{maxCount}}-ээс бага эсвэл тэнцүү байх ёстой',
        minNotReached: '{{nodeDefName}} зангилаа нь {{minCount}}-ээс их эсвэл тэнцүү байх ёстой',
      },
    },
  },

  // ====== Common components
  expressionEditor: {
    and: 'БА',
    or: 'ЭСВЭЛ',
    group: 'Бүлэг ()',
    var: 'Хувьсагч',
    const: 'Тогтмол утга',
    call: 'Функц',
    operator: 'Оператор',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Эх координатын шинж чанар',
      distanceAttribute: 'Зайны шинж чанар',
      bearingAttribute: 'Азимутын шинж чанар',
    },

    coordinateAttributeWithPosition: 'Координат шинж чанар {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'Эхний огнооны шинж чанар',
      firstTimeAttribute: 'Эхний цагийн шинж чанар',
      secondDateAttribute: 'Хоёр дахь огнооны шинж чанар',
      secondTimeAttribute: 'Хоёр дахь цагийн шинж чанар',
    },
    error: {
      selectOneVariable: 'Нэг хувьсагч сонгоно уу',
    },

    header: {
      editingExpressionForNodeDefinition: '"{{nodeDef}}"-ийн {{qualifier}} илэрхийллийг засах',
      editingFunctionForNodeDefinition: '"{{nodeDef}}"-ийн "{{functionName}}" функцийг засах',
    },

    qualifier: {
      'default-values': 'үндсэн утга',
      'default-values-apply-if': 'үндсэн утга хэрэглэх бол',
      'editable-if': 'хэрэв засварлах боломжтой бол',
      'max-count': 'хамгийн их тоо',
      'min-count': 'хамгийн бага тоо',
      'relevant-if': 'хэрэв хамааралтай бол',
      validations: 'баталгаажуулалтын дүрэм',
      'validations-apply-if': 'баталгаажуулалтын дүрэм хэрэглэх бол',
      'visible-if': 'хэрэв харагдах бол',
    },

    selectAFunction: 'Функц сонгох',

    valueType: {
      constant: 'Тогтмол',
      expression: 'Илэрхийлэл',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: '<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>',
    openforisArenaWebsite:
      '<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>',
    supportForum: '<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>',
    arenaVideoTutorialsInFaoElearningAcademy:
      '<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>',
    arenaVideoTutorialsInYouTube:
      '<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>',
    arenaInGitHub:
      '<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>',
    arenaRScriptsInGitHub:
      '<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>',
  },
  aiExpression: {
    title: 'Тайлбараас илэрхийлэл үүсгэх',
    hint: 'Илэрхийлэл юу хийх ёстойг энгийн үгээр тайлбарлана уу. AI үүнийг Arena-ийн синтакс руу хөрвүүлнэ. Үүсгэхийн тулд Ctrl+Enter дарна уу.',
    placeholder: 'жишээ нь: модны өндөр 0-ээс их, 200-аас бага байх ёстой',
    generate: 'Үүсгэх',
    generating: 'Үүсгэж байна…',
    use: 'Энэ илэрхийллийг ашиглах',
    useAnyway: 'Ямар ч байсан ашиглах',
    tryAgain: 'Өөр тайлбар оруулж үзэх',
    parseError:
      'Үүсгэсэн илэрхийллийг зөв задлан шинжилж чадсангүй: {{message}}. Та үүнийг хэрэглээд гараар засах эсвэл тайлбараа өөрөөр бичиж үзэх боломжтой.',
    explain: {
      title: 'Энэ илэрхийллийг тайлбарлах',
      thinking: 'AI-аас энэ илэрхийллийг тайлбарлахыг хүсэж байна…',
      error: 'Тайлбарыг авч чадсангүй: {{message}}',
      timeout: 'AI хариу өгөхөд хэт удлаа. Дахин оролдоно уу.',
    },
  },
  aiTranslation: {
    translateButton_one: 'Өөр {{count}} хэл рүү орчуулах',
    translateButton_other: 'Өөр {{count}} хэл рүү орчуулах',
    translateButton: 'Бусад хэл рүү орчуулах',
    success_one: '{{count}} хэл рүү орчууллаа. Хянаад хадгална уу.',
    success_other: '{{count}} хэл рүү орчууллаа. Хянаад хадгална уу.',
    success: 'Орчууллаа. Хянаад хадгална уу.',
    failed: 'Орчуулга амжилтгүй боллоо: {{message}}',
    timeout: 'Орчуулгын хүсэлтийн хугацаа дууслаа. Дахин оролдоно уу.',
  },
  aiActivityLog: {
    title: 'Үйл ажиллагааны бүртгэлийн хураангуй',
    summarizeButton: 'Хураангуйлах',
    thinking: 'Үйл явдлуудыг нэгтгэж, AI-аас хураангуй хүсэж байна…',
    error: 'Хураангуйг авч чадсангүй: {{message}}',
  },
  aiChatbot: {
    open: 'Тусламж ба баримт бичиг',
    title: 'Тусламж ба баримт бичиг',
    empty: 'Open Foris Arena-ийн талаар юу ч асуугаарай.',
    placeholder: 'Асуултаа бичнэ үү…',
    send: 'Илгээх',
    stop: 'Зогсоох',
    clear: 'Цэвэрлэх',
    showReasoning: 'Үндэслэлийг харуулах',
    error: 'Чатботын алдаа: {{message}}',
    language: 'Хариултын хэл',
  },
}
