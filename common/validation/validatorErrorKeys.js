module.exports = {
  invalidNumber: 'validationErrors.invalidNumber',
  invalidField: 'validationErrors.invalidField',
  nameDuplicate: 'validationErrors.nameDuplicate',
  nameCannotBeKeyword: 'validationErrors.nameCannotBeKeyword',
  nameRequired: 'validationErrors.nameRequired',

  categoryEdit: {
    childrenEmpty: 'validationErrors.categoryEdit.childrenEmpty',
    childrenInvalid: 'validationErrors.categoryEdit.childrenInvalid',
    codeCannotBeKeyword: 'validationErrors.categoryEdit.codeCannotBeKeyword',
    codeDuplicate: 'validationErrors.categoryEdit.codeDuplicate',
    codeRequired: 'validationErrors.categoryEdit.codeRequired',
    itemsInvalid: 'validationErrors.categoryEdit.itemsInvalid',
    itemsEmpty: 'validationErrors.categoryEdit.itemsEmpty',
    levelDuplicate: 'validationErrors.categoryEdit.levelDuplicate',
  },

  categoryImport: {
    codeColumnMissing: 'validationErrors.categoryImport.codeColumnMissing',
    codeDuplicate: 'validationErrors.categoryImport.codeDuplicate',
    codeRequired: 'validationErrors.categoryImport.codeRequired',
    columnMissing: 'validationErrors.categoryImport.columnMissing',
    emptyHeaderFound: 'validationErrors.categoryImport.emptyHeaderFound',
  },

  nodeDefEdit: {
    applyIfDuplicate: 'validationErrors.nodeDefEdit.applyIfDuplicate',
    countMaxMustBePositiveNumber: 'validationErrors.nodeDefEdit.countMaxMustBePositiveNumber',
    countMinMustBePositiveNumber: 'validationErrors.nodeDefEdit.countMinMustBePositiveNumber',
    defaultValuesNotSpecified: 'validationErrors.nodeDefEdit.defaultValuesNotSpecified',
    categoryRequired: 'validationErrors.nodeDefEdit.categoryRequired',
    childrenEmpty: 'validationErrors.nodeDefEdit.childrenEmpty',
    expressionRequired: 'validationErrors.nodeDefEdit.expressionRequired',
    keysEmpty: 'validationErrors.nodeDefEdit.keysEmpty',
    keysExceedingMax: 'validationErrors.nodeDefEdit.keysExceedingMax',
    nameInvalid: 'validationErrors.nodeDefEdit.nameInvalid',
    taxonomyRequired: 'validationErrors.nodeDefEdit.taxonomyRequired',
  },

  record: {
    keyDuplicate: 'validationErrors.record.keyDuplicate',
    entityKeyDuplicate: 'validationErrors.record.entityKeyDuplicate',
    nodesMaxCountExceeded: 'validationErrors.record.nodesMaxCountExceeded',
    nodesMinCountNotReached: 'validationErrors.record.nodesMinCountNotReached',
    oneOrMoreInvalidValues: 'validationErrors.record.oneOrMoreInvalidValues',
    valueInvalid: 'validationErrors.record.valueInvalid',
    valueRequired: 'validationErrors.record.valueRequired',
  },

  surveyInfoEdit: {
    langRequired: 'validationErrors.surveyInfoEdit.langRequired',
    srsRequired: 'validationErrors.surveyInfoEdit.srsRequired',
  },

  taxonomyEdit: {
    codeDuplicate: 'validationErrors.taxonomyEdit.codeDuplicate',
    codeRequired: 'validationErrors.taxonomyEdit.codeRequired',
    familyRequired: 'validationErrors.taxonomyEdit.familyRequired',
    genusRequired: 'validationErrors.taxonomyEdit.genusRequired',
    scientificNameDuplicate: 'validationErrors.taxonomyEdit.scientificNameDuplicate',
    scientificNameRequired: 'validationErrors.taxonomyEdit.scientificNameRequired',
    taxaEmpty: 'validationErrors.taxonomyEdit.taxaEmpty',
  },

  taxonomyImportJob: {
    missingRequiredColumns: 'validationErrors.taxonomyImportJob.missingRequiredColumns'
  },

  user: {
    emailInvalid: 'validationErrors.user.emailInvalid',
    emailRequired: 'validationErrors.user.emailRequired',
    groupRequired: 'validationErrors.user.groupRequired',
  }
}