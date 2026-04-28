export default {
  charts: {
    downloadToPng: 'Графикийг PNG руу татах',
    warning: {
      selectOneDimensionAndOneMeasure: 'График харуулахын тулд нэг хэмжээс болон нэг хэмжигдэхүүн сонгоно уу',
      selectAtLeast2NumericAttributes: 'График харуулахын тулд наад зах нь 2 тоон шинж чанар сонгоно уу',
      tooManyItemsToShowChart: `График харуулахад хэт олон элемент байна;
хамгийн ихдээ {{maxItems}} элемент хүлээж байна.
Элементүүдийн тоог багасгахын тулд хүсэлтээ сайжруулна уу (жишээ нь шүүлтүүр нэмэх).
`,
    },
    type: {
      area: 'Талбайн график',
      bar: 'Баар график',
      line: 'Шугам график',
      pie: 'Бялуу график',
      scatter: 'Тархалтын график',
    },
  },
  dataQuery: {
    deleteConfirmMessage: 'Хүсэлт "{{name}}"-г устгах уу?',
    displayType: {
      chart: 'График',
      table: 'Хүснэгт',
    },
    manageQueries: 'Хүсэлтүүдийг удирдах',
    mode: {
      label: 'Горим:',
      aggregate: 'Нэгтгэх',
      raw: 'Түүхий',
      rawEdit: 'Түүхийг засах',
    },
    replaceQueryConfirmMessage: 'Одоогийн хүсэлтийг сонгосон хүсэлтээр солих уу?',
    showCodes: 'Кодуудыг харуулах',
  },
  editSelectedRecord: 'Сонгогдсон бичлэгийг засах',
  filterAttributeTypes: 'Шинж чанарын төрлүүдийг шүүх',
  filterRecords: {
    buttonTitle: 'Шүүх',
    expressionEditorHeader: 'Бичлэгүүдийг шүүх илэрхийлэл',
  },
  invalidRecord: 'Хүчингүй бичлэг',
  nodeDefsSelector: {
    hide: 'Зангилааны тодорхойлолтын сонгогчийг нуух',
    show: 'Зангилааны тодорхойлолтын сонгогчийг харуулах',
    nodeDefFrequency: `{{nodeDefLabel}} (давтамж)`,
  },
  records: {
    clone: 'Хувилах',
    confirmDeleteRecord: `Бичлэг "{{keyValues}}"-г устгах уу?`,
    confirmDeleteSelectedRecord_one: `Сонгогдсон бичлэгийг устгах уу?`,
    confirmDeleteSelectedRecord_other: `Сонгогдсон {{count}} бичлэгийг устгах уу?`,
    confirmMergeSelectedRecords: `### Сонгогдсон бичлэгүүдийг нэгтгэх үү?

- "эх үүсвэр" бичлэг "зорилтот" бичлэгт нэгтгэгдэнэ:
  - эх үүсвэр: [{{sourceRecordKeys}}], өөрчилсөн {{sourceRecordModifiedDate}};
  - зорилтот: [{{targetRecordKeys}}], өөрчилсөн {{targetRecordModifiedDate}};

- нэгтгэхээс өмнө үр дүнгийн урьдчилан харахыг харуулна;

- нэгтгэхийг баталгаажуулсны дараа, **эх үүсвэр бичлэг УСТГАГДАНА**`,
    confirmUpdateRecordsStep: `Сонгогдсон {{count}} бичлэг(үүд)-ийг {{stepFrom}}-аас {{stepTo}} руу шилжүүлэх үү?`,
    confirmUpdateRecordOwner: `Сонгогдсон бичлэгийн эзэмшигчийг {{ownerName}} болгож өөрчлөх үү?`,
    confirmValidateAllRecords: `Бүх бичлэгийг дахин баталгаажуулах уу?\n\nҮүнд хэдэн минут шаардагдаж магадгүй.`,
    deleteRecord: 'Бичлэг устгах',
    demoteAllRecordsFromAnalysis: 'Шинжилгээ -> Цэвэрлэгээ',
    demoteAllRecordsFromCleansing: 'Цэвэрлэгээ -> Оролт',
    editRecord: 'Бичлэгийг засах',
    exportList: 'Жагсаалт экспортлох',
    exportData: 'Өгөгдөл экспортлох',
    exportDataSummary: 'Өгөгдлийн хураангуй экспортлох',
    exportRecordDocx: 'Бичлэгийг экспортлох (Word)',
    filterPlaceholder: 'Түлхүүр эсвэл эзэмшигчээр шүүх',
    merge: {
      label: 'Нэгтгэх',
      confirmLabel: 'Нэгтгэх баталгаажуулах',
      confirmTooManyDifferencesMessage: `**Хэт олон ялгаа**.
Бичлэгүүд хоорондоо их ялгаатай байна.
Олон шинж чанарууд (~{{nodesUpdated}}) нэгтгэх үед шинэчлэгдэх болно.
Нэгтгэх урьдчилан харахыг үргэлжлүүлэх үү?`,
      noChangesWillBeApplied: `Зорилтот бичлэгт өөрчлөлт орохгүй.
Нэгтгэх боломжгүй.`,
      performedSuccessfullyMessage: 'Бичлэгүүдийг нэгтгэх үйлдэл амжилттай боллоо!',
      previewTitle: 'Нэгтгэх урьдчилан харах (бичлэг {{keyValues}})',
    },
    noRecordsAdded: 'Бичлэг нэмэгдээгүй',
    noRecordsAddedForThisSearch: 'Энэ хайлтанд бичлэг олдсонгүй',
    noSelectedRecordsInStep: 'Алхам {{step}}-д сонгогдсон бичлэг байхгүй',
    owner: 'Эзэмшигч',
    promoteAllRecordsToAnalysis: 'Цэвэрлэгээ -> Шинжилгээ',
    promoteAllRecordsToCleansing: 'Оролт -> Цэвэрлэгээ',
    step: 'Алхам',
    updateRecordsStep: 'Бичлэгийн алхамыг шинэчлэх',
    validateAll: 'Бүгдийг баталгаажуулах',
    viewRecord: 'Бичлэгийг харах',
  },
  recordsClone: {
    title: 'Бичлэг хувилах',
    fromCycle: 'Мөчлөгөөс',
    toCycle: 'Мөчлөгт',
    confirmClone: `Бичлэгүүдийг {{cycleFrom}} мөчлөгөөс {{cycleTo}} мөчлөгт хувилах уу?\n
({{cycleTo}} мөчлөгт аль хэдийн байхгүй бичлэгүүд л хувилах болно)`,
    startCloning: 'Хувилахыг эхлүүлэх',
    cloneComplete: 'Хувилах ажил дууссан. {{recordsCloned}} бичлэг {{cycleFrom}}-ээс {{cycleTo}} руу хувилах болно',
    error: {
      cycleToMissing: '"Хүртэлх мөчлөг"-ийг сонгоно уу',
      cycleToMustBeDifferentFromCycleFrom: '"Хүртэлх мөчлөг" нь "Эхлэх мөчлөг"-өөс өөр байх ёстой',
    },
    source: {
      label: 'Эх үүсвэр',
      allRecords: '{{cycleFrom}} мөчлөгт байгаа бүх бичлэгүүд, {{cycleTo}} мөчлөгт аль хэдийн байхгүй',
      selectedRecords: 'Зөвхөн сонгогдсон {{selectedRecordsCount}} бичлэг',
    },
  },
  recordDeleted_one: `Бичлэг амжилттай устгагдлаа!`,
  recordDeleted_other: `{{count}} бичлэг амжилттай устгагдлаа!`,
  recordsSource: {
    label: 'Эх үүсвэр',
  },
  recordsUpdated: '{{count}} бичлэг амжилттай шинэчлэгдлээ!',
  rowNum: 'Мөр #',
  selectedAttributes: 'Сонгогдсон шинж чанарууд:',
  selectedDimensions: 'Сонгогдсон хэмжээсүүд',
  selectedMeasures: 'Сонгогдсон хэмжигдэхүүнүүд',
  sortableItemsInfo: 'Эрэмбэлэхийн тулд чирж оруулах',
  showValidationReport: 'Баталгаажуулалтын тайланг харуулах',
  sort: 'Эрэмбэлэх',
  dataExport: {
    source: {
      label: 'Эх үүсвэр',
      allRecords: 'Бүх бичлэгүүд',
      filteredRecords: 'Зөвхөн шүүгдсэн бичлэгүүд',
      selectedRecord: 'Зөвхөн сонгогдсон бичлэг',
      selectedRecord_other: 'Зөвхөн сонгогдсон {{count}} бичлэг',
    },
    title: 'Өгөгдөл экспортлох',
  },
  dataVis: {
    errorLoadingData: 'Өгөгдөл ачаалахад алдаа гарлаа',
    noData: 'Энэ хүсэлт өгөгдөл буцаасангүй',
    noSelection:
      'Зүүн талын самбараас сонголт хийнэ үү эсвэл "Хүсэлтүүдийг удирдах"-аас одоо байгаа хүсэлтийг сонгоно уу',
  },
  viewSelectedRecord: 'Сонгогдсон бичлэгийг харах',
}
