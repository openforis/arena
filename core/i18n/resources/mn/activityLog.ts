import * as ActivityLog from '@common/activityLog/activityLog'

export default {
  messages: {
    // Survey
    [ActivityLog.type.surveyCreate]: 'судалгааг үүсгэсэн',
    [ActivityLog.type.surveyPropUpdate]: 'судалгааны {{key}}-г шинэчилсэн',
    [ActivityLog.type.surveyPublish]: 'судалгааг нийтэлсэн',
    [ActivityLog.type.surveyCollectImport]: 'судалгааг Collect-оос импортолсон',

    // NodeDef
    [ActivityLog.type.nodeDefCreate]: '{{parentName}} объектод {{type}} зангилааны тодорхойлолт нэмсэн',
    [ActivityLog.type.nodeDefUpdate]: '{{name}} зангилааны тодорхойлолтын {{keys}}-г шинэчилсэн',
    [ActivityLog.type.nodeDefMarkDeleted]: '{{name}} зангилааны тодорхойлолтыг устгасан',

    // Category
    [ActivityLog.type.categoryInsert]: 'ангилал нэмсэн',
    [ActivityLog.type.categoryPropUpdate]: '{{categoryName}} ангиллын {{key}}-г шинэчилсэн',
    [ActivityLog.type.categoryDelete]: '{{categoryName}} ангиллыг устгасан',
    [ActivityLog.type.categoryLevelInsert]: '{{categoryName}} ангилалд {{index}} индекс дээр түвшин нэмсэн',
    [ActivityLog.type.categoryLevelPropUpdate]: '{{categoryName}} ангиллын {{index}} түвшний {{key}}-г шинэчилсэн',
    [ActivityLog.type.categoryLevelDelete]: '{{categoryName}} ангиллын {{index}} түвшинг устгасан',
    [ActivityLog.type.categoryItemInsert]: '{{categoryName}} ангиллын {{levelIndex}} түвшинд элемент нэмсэн',
    [ActivityLog.type.categoryItemPropUpdate]: '{{categoryName}} ангиллын {{code}} элементийн {{key}}-г шинэчилсэн',
    [ActivityLog.type.categoryItemDelete]:
      '{{categoryName}} ангиллын {{levelIndex}} түвшний {{code}} элементийг устгасан',
    [ActivityLog.type.categoryImport]: '{{categoryName}} ангилалд CSV файл импортолсон',

    // Taxonomy
    [ActivityLog.type.taxonomyCreate]: 'таксономи нэмсэн',
    [ActivityLog.type.taxonomyPropUpdate]: '{{taxonomyName}} таксономийн {{key}}-г шинэчилсэн',
    [ActivityLog.type.taxonomyDelete]: '{{taxonomyName}} таксономийг устгасан',
    [ActivityLog.type.taxonomyTaxaImport]: '{{taxonomyName}} таксономид CSV файл импортолсон',
    [ActivityLog.type.taxonInsert]: '{{taxonomyName}} таксономид таксон нэмсэн',

    // Record
    [ActivityLog.type.recordCreate]: 'бичлэг нэмсэн',
    [ActivityLog.type.recordDelete]: '{{keys}} бичлэгийг устгасан',
    [ActivityLog.type.recordImport]: 'бичлэг импортолсон',
    [ActivityLog.type.recordStepUpdate]: '{{keys}} бичлэгийн үе шатыг {{stepFrom}}-аас {{stepTo}} болгож шинэчилсэн',
    [ActivityLog.type.recordMerge]: '{{sourceRecordKeys}} бичлэгийг {{targetRecordKeys}} бичлэгтэй нэгтгэсэн',

    // Node
    [ActivityLog.type.nodeCreate]: '{{recordKeys}} бичлэгийн {{parentPath}}-д {{name}} зангилаа нэмсэн',
    [ActivityLog.type.nodeValueUpdate]: '{{recordKeys}} бичлэгийн {{parentPath}} дахь {{name}} зангилааг шинэчилсэн',
    [ActivityLog.type.nodeDelete]: '{{recordKeys}} бичлэгээс {{name}} зангилааг устгасан',

    // User
    [ActivityLog.type.userInvite]: '{{email}} хэрэглэгчийг {{groupName}} үүрэгтэйгээр урьсан',
    [ActivityLog.type.userUpdate]: '{{name}} хэрэглэгчийг шинэчилсэн',
    [ActivityLog.type.userRemove]: '{{name}} хэрэглэгчийг судалгаанаас хассан',

    // Analysis
    [ActivityLog.type.chainCreate]: 'боловсруулах гинж нэмсэн',
    [ActivityLog.type.chainPropUpdate]: '{{label}} боловсруулах гинжийн {{key}}-г шинэчилсэн',
    [ActivityLog.type.analysisNodeDefPropUpdate]:
      '{{name}} тооцоолсон зангилааны тодорхойлолтын {{key}}-г {{value}} болгож шинэчилсэн',
    [ActivityLog.type.chainStatusExecSuccess]: '{{label}} боловсруулах гинжийг амжилттай ажиллуулсан',
    [ActivityLog.type.chainDelete]: '{{label}} боловсруулах гинжийг устгасан',
  },
}
