// mn.js
export default {
  subPage: 'Дэд хуудас',
  addChildTo: '{{nodeDefLabel}}-д нэмэх',
  addChildToTitle: '{{nodeDefLabel}}-д шинэ зангилаа нэмэх',
  addChildToTypes: {
    boolean: 'Булиан',
    code: 'Код',
    coordinate: 'Координат',
    date: 'Огноо',
    decimal: 'Аравтын бутархай',
    geo: 'Газарзүйн орон зайн',
    entity: 'Хүснэгт эсвэл маягт',
    file: 'Файл',
    integer: 'Бүхэл тоо',
    taxon: 'Таксон',
    text: 'Текст',
    time: 'Цаг',
    // layout elments
    formHeader: 'Маягтын толгой',
  },
  clone: `'{{nodeDefLabel}}' хуулах`,
  compressFormItems: `'{{nodeDefLabel}}'-н маягтын зүйлсийг шахах`,
  confirmUpdateDependentEnumeratedEntities: `Хэрэв та үргэлжлүүлбэл, зарим тоологдсон объектууд ({{entityDefs}}) дахин тоологдох болно, 
тэдгээрт оруулсан одоо байгаа утгуудыг (хэрэв байгаа бол) устгана. 
Үргэлжлүүлэх үү?`,
  convert: `'{{nodeDefLabel}}' хөрвүүлэх`,
  delete: `'{{nodeDefLabel}}' устгах`,
  edit: `'{{nodeDefLabel}}' засах`,
  schemaSummary_csv: 'Схемийн хураангуй (CSV)',
  schemaSummary_xlsx: 'Схемийн хураангуй (Excel)',
  hidePages: 'Хуудсыг нуух',
  showPages: 'Хуудсыг харуулах',
  move: `'{{nodeDefLabel}}' зөөх`,
  movePageUp: 'Хуудсыг дээш зөөх',
  movePageDown: 'Хуудсыг доош зөөх',
  formEditActions: {
    preview: 'Урьдчилан харах',
  },
  formEntryActions: {
    confirmDemote: 'Та энэ бичлэгийг {{name}}-д буулгахыг хүсч байгаадаа итгэлтэй байна уу?',
    confirmPromote: `Та энэ бичлэгийг **{{name}}-д дэвшүүлэхийг** хүсч байгаадаа итгэлтэй байна уу? 
Та үүнийг дахин засах боломжгүй болно`,
    confirmPromoteWithErrors: `**Энэ бичлэгт алдаа байна**. 
Дэвшүүлэхийг баталгаажуулах`,
    confirmDelete: 'Та энэ бичлэгийг устгахыг хүсч байгаадаа итгэлтэй байна уу?\n\nБуцаах боломжгүй анхааруулга',
    closePreview: 'Урьдчилан харахыг хаах',
    demoteTo: '{{stepPrev}}-д буулгах',
    promoteTo: '{{stepNext}}-д дэвшүүлэх',
    step: 'Алхам {{id}} ({{name}})',
  },
  nodeDefEditFormActions: {
    columns: 'Баганууд',
    confirmConvert: 'Атрибут "{{name}}"-г "{{toType}}"-д хөрвүүлэх үү?',
    confirmDelete:
      'Та энэ зангилааны тодорхойлолтыг: {{ name }} бүрмөсөн устгахыг хүсч байгаадаа итгэлтэй байна уу?\n\nБуцаах боломжгүй анхааруулга',
  },
  nodeDefCode: {
    code: 'Код',
    label: 'Шошго',
    typeCodeOrLabel: 'Код эсвэл шошго бичих',
    option: 'Сонголт {{value}}',
  },
  nodeDefBoolean: {
    labelValue: {
      trueFalse: {
        true: 'Үнэн',
        false: 'Худал',
      },
      yesNo: {
        true: 'Тийм',
        false: 'Үгүй',
      },
    },
  },
  nodeDefCoordinate: {
    coordinate: 'Координат',
    srs: 'SRS',
    x: 'X',
    y: 'Y',
    showOnMap: 'Газрын зураг дээр харуулах',
    accuracy: 'Нарийвчлал',
    altitude: 'Өндөр',
    altitudeAccuracy: 'Өндрийн нарийвчлал',
  },
  nodeDefGeo: {
    confirmDelete: 'Энэ Газарзүйн орон зайн утгыг устгах уу?',
    geoJSON: 'GeoJSON',
    invalidGeoJsonFileUploaded: 'Буруу GeoJSON файл байршуулсан',
  },
  nodeDefEntityForm: {
    addNewEntity: 'Шинэ {{name}} нэмэх',
    confirmDelete: 'Та энэ объектыг устгахыг хүсч байгаадаа итгэлтэй байна уу?',
    select: '{{name}} сонгох:',
    selectedEntity: 'Сонгосон {{name}}:',
  },
  nodeDefTaxon: {
    code: 'Код',
    scientificName: 'Шинжлэх ухааны нэр',
    vernacularName: 'Нутаг усны нэр',
    vernacularNameSelectionKept: 'Нутаг усны нэр сонголтыг хэвээр хадгалсан',
    visibleFields: 'Харагдах талбарууд',
  },
  nodeDefFile: {
    errorLoadingPreview: 'Урьдчилан харахыг ачаалахад алдаа гарлаа',
    fileUuid: 'Файлын uuid',
    fileName: 'Файлын нэр',
  },
  nodeDefsTreeSelectMode: {
    allNodeDefs: 'Бүх зангилаа',
    onlyPages: 'Зөвхөн хуудсууд',
  },
  step: {
    entry: 'Оролт',
    cleansing: 'Цэвэрлэгээ',
    analysis: 'Шинжилгээ',
  },
  confirmNodeDelete: 'Та энэ {{nodeDefType}} ({{nodeDefLabel}})-г устгахыг хүсч байгаадаа итгэлтэй байна уу?',
  exportLabels_csv: 'Шошгыг CSV-руу экспортлох',
  exportLabels_xlsx: 'Шошгыг Excel-руу экспортлох',
  importLabels: 'Шошгыг Excel эсвэл CSV-ээс импортлох',
}
