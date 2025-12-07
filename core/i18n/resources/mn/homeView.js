export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Идэвхтэй судалгаа сонгогдоогүй</title>
      <p><label>Судалгааны жагсаалтаас</label><linkToSurveys>Сонгох</linkToSurveys> эсвэл <linkToNewSurvey>Шинэ судалгаа үүсгэх</linkToNewSurvey></p>`,
    activeUsers: 'Идэвхтэй хэрэглэгчид',
    activityLog: {
      title: 'Үйл ажиллагааны бүртгэл',
      size: '$t(homeView:dashboard.activityLog.title) хэмжээ: {{size}}',
    },
    deleteActivityLog: 'Үйлдлийн түүхийг цэвэрлэх',
    deleteActivityLogConfirm: {
      headerText: 'Энэхүү судалгааны үйлдлийн түүхийн БҮХ өгөгдлийг цэвэрлэх үү?',
      message: `
  - **{{surveyName}}** судалгааны үйлдлийн түүхийн БҮХ өгөгдөл устгагдана;\n\n
  - судалгааны Мэдээллийн санд (DB) эзэлж буй зай багасна;\n\n
  - энэ нь судалгааны оруулсан өгөгдөлд нөлөөлөхгүй;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Баталгаажуулахын тулд энэхүү судалгааны нэрийг оруулна уу:',
    },
    exportWithData: 'Экспорт + өгөгдөл (Нөөц)',
    exportWithDataNoActivityLog: 'Экспорт + өгөгдөл (ҮЙЛ АЖИЛЛАГААНЫ БҮРТГЭЛГҮЙ)',
    exportWithDataNoResultAttributes: 'Экспорт + өгөгдөл (Үр дүнгийн Атрибут ҮГҮЙ)',
    surveyPropUpdate: {
      main: `<title>Аренад тавтай морилно уу</title>
  
        <p>Эхлээд та судалгааны <strong>нэр</strong> болон <strong>шошгыг</strong> тохируулах хэрэгтэй.</p>
        
        <p><linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon> эсвэл судалгааны нэр дээр дарна уу: <basicLink>{{surveyName}}</basicLink></p>
        `,
      secondary: `
        <p>Хэрэв нэр, шошго зөв байвал эхний шинж чанарыг үүсгэнэ үү
        <linkWithIcon>Судалгаа \u003E Маягтын дизайнер</linkWithIcon>
        </p>
        `,
    },
    nodeDefCreate: {
      main: `<title>{{surveyName}}-ийн эхний шинж чанарыг үүсгэцгээе</title>
        
        <p> <linkWithIcon>Судалгаа \u003E Маягтын дизайнер</linkWithIcon> руу орно уу</p>
        <br />
        `,
    },
    storageSummary: {
      title: 'Хадгалалтын ашиглалт',
      availableSpace: 'Боломжтой ({{size}})',
      usedSpace: 'Ашиглагдсан ({{size}})',
      usedSpaceOutOf: `{{percent}}%-ийг ашигласан (нийт {{total}}-ээс {{used}})`,
    },
    storageSummaryDb: {
      title: 'Хадгалалтын ашиглалт (Өгөгдлийн сан)',
    },
    storageSummaryFiles: {
      title: 'Хадгалалтын ашиглалт (файлууд)',
    },
    samplingPointDataCompletion: {
      title: 'Түүвэрлэлтийн цэгийн өгөгдлийн гүйцэтгэл',
      totalItems: 'Нийт элемент: {{totalItems}}',
      remainingItems: 'Үлдсэн элемент',
    },
    step: {
      entry: 'Өгөгдөл оруулах',
      cleansing: 'Өгөгдөл цэвэрлэх',
      analysis: 'Өгөгдөл шинжилгээ',
    },
    // records' summary
    recordsByUser: 'Хэрэглэгчээр бичлэгүүд',
    recordsAddedPerUserWithCount: 'Хэрэглэгчээр нэмэгдсэн бичлэгүүд (Нийт {{totalCount}})',
    dailyRecordsByUser: 'Хэрэглэгчээр өдөр тутмын бичлэгүүд',
    totalRecords: 'Нийт бичлэг',
    selectUsers: 'Хэрэглэгч сонгох...',
    noRecordsAddedInSelectedPeriod: 'Сонгогдсон хугацаанд бичлэг нэмэгдээгүй',
  },
  surveyDeleted: 'Судалгаа {{surveyName}} устгагдсан',
  surveyInfo: {
    basic: 'Үндсэн мэдээлэл',
    configuration: {
      title: 'Тохиргоо',
      filesTotalSpace: 'Файлуудын нийт зай (ГБ)',
    },
    confirmDeleteCycleHeader: 'Энэ мөчлөгийг устгах уу?',
    confirmDeleteCycle: `Та мөчлөг {{cycle}}-г устгахдаа итгэлтэй байна уу?\n\n$t(common.cantUndoWarning)\n\n
Хэрэв энэ мөчлөгтэй холбоотой бичлэгүүд байвал тэдгээр нь устгагдана.`,
    cycleForArenaMobile: 'Арена Мобайл-д зориулсан мөчлөг',
    fieldManualLink: 'Талбайн гарын авлагын холбоос',
    editInfo: 'Мэдээллийг засах',
    viewInfo: 'Мэдээллийг харах',
    preferredLanguage: 'Хүссэн хэл',
    sampleBasedImageInterpretation: 'Дээж дээр суурилсан зураг тайлбарлах',
    sampleBasedImageInterpretationEnabled: 'Дээж дээр суурилсан зураг тайлбарлах идэвхжсэн',
    security: {
      title: 'Аюулгүй байдал',
      dataEditorViewNotOwnedRecordsAllowed: 'Өгөгдөл засварлагч өөрийн бус бичлэгүүдийг үзэх боломжтой',
      visibleInMobile: 'Арена Мобайл-д харагдана',
      allowRecordsDownloadInMobile: 'Серверээс Арена Мобайл руу бичлэг татахыг зөвшөөрөх',
      allowRecordsUploadFromMobile: 'Арена Мобайл-аас сервер руу бичлэг байршуулахыг зөвшөөрөх',
    },
    srsPlaceholder: 'Код эсвэл шошго бичих',
    unpublish: 'Нийтлэлээ болих ба өгөгдлийг устгах',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Та энэ судалгааг нийтлэлээ болиход итгэлтэй байна уу?',
      unpublishWarning: `**{{surveyName}}** судалгааг нийтлэлээ болисноор бүх өгөгдөл нь устгагдана.\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Баталгаажуулахын тулд энэ судалгааны нэрийг оруулна уу:',
    },
    userExtraProps: {
      title: 'Хэрэглэгчийн нэмэлт шинж чанарууд',
      info: `Судалгаатай холбоотой хэрэглэгч бүрд хуваарилж болох нэмэлт шинж чанарууд.
Эдгээр шинж чанаруудыг үндсэн утгууд, баталгаажуулалтын дүрмүүд болон хэрэглээний илэрхийлэлд ашиглаж болно.
Жишээ нь: *userProp('property_name') == 'some_value'*`,
    },
  },
  deleteSurveyDialog: {
    confirmDelete: 'Та энэ судалгааг устгахдаа итгэлтэй байна уу?',
    deleteWarning: `**{{surveyName}}** судалгааг устгаснаар бүх өгөгдөл нь устгагдана.\n\n

$t(common.cantUndoWarning)`,
    confirmName: 'Баталгаажуулахын тулд энэ судалгааны нэрийг оруулна уу:',
  },
  surveyList: {
    active: '$t(common.active)',
    activate: 'Идэвхжүүлэх',
  },
  collectImportReport: {
    excludeResolvedItems: 'Шийдэгдсэн элементүүдийг хасах',
    expression: 'Илэрхийлэл',
    resolved: 'Шийдэгдсэн',
    exprType: {
      applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
      codeParent: 'Эх код',
      defaultValue: 'Үндсэн утга',
      validationRule: 'Баталгаажуулалтын дүрэм',
    },
    title: 'Цуглуулгын импортын тайлан',
  },
  recordsSummary: {
    recordsAddedInTheLast: 'Сүүлийн хугацаанд нэмэгдсэн бичлэгүүд:',
    fromToPeriod: '{{from}}-аас {{to}} хүртэл',
    record: '{{count}} Бичлэг',
    record_other: '{{count}} Бичлэг',
    week: '{{count}} Долоо хоног',
    week_other: '{{count}} Долоо хоног',
    month: '{{count}} Сар',
    month_other: '{{count}} Сар',
    year: '{{count}} Жил',
    year_other: '{{count}} Жил',
  },
}
