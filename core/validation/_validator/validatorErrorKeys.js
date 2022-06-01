export const ValidatorErrorKeys = {
  invalidNumber: 'validationErrors.invalidNumber',
  invalidField: 'validationErrors.invalidField',
  invalidDate: 'validationErrors.invalidDate',
  nameDuplicate: 'validationErrors.nameDuplicate',
  nameCannotBeKeyword: 'validationErrors.nameCannotBeKeyword',
  nameRequired: 'validationErrors.nameRequired',

  aggregateFunction: {
    expressionRequired: 'validationErrors.aggregateFunction.expressionRequired',
  },

  analysis: {
    labelDefaultLangRequired: 'validationErrors.analysis.labelDefaultLangRequired',
    analysisNodeDefsRequired: 'validationErrors.analysis.analysisNodeDefsRequired',
  },

  categoryEdit: {
    childrenEmpty: 'validationErrors.categoryEdit.childrenEmpty',
    childrenInvalid: 'validationErrors.categoryEdit.childrenInvalid',
    codeCannotBeKeyword: 'validationErrors.categoryEdit.codeCannotBeKeyword',
    codeDuplicate: 'validationErrors.categoryEdit.codeDuplicate',
    codeRequired: 'validationErrors.categoryEdit.codeRequired',
    itemExtraPropDataTypeRequired: 'validationErrors.categoryEdit.itemExtraPropDataTypeRequired',
    itemExtraPropNameInvalid: 'validationErrors.categoryEdit.itemExtraPropNameInvalid',
    itemExtraPropInvalidNumber: 'validationErrors.categoryEdit.itemExtraPropInvalidNumber',
    itemExtraPropInvalidGeometryPoint: 'validationErrors.categoryEdit.itemExtraPropInvalidGeometryPoint',
    itemsInvalid: 'validationErrors.categoryEdit.itemsInvalid',
    itemsEmpty: 'validationErrors.categoryEdit.itemsEmpty',
    levelDuplicate: 'validationErrors.categoryEdit.levelDuplicate',
    levelsInvalid: 'validationErrors.categoryEdit.levelsInvalid',
  },

  categoryImport: {
    codeColumnMissing: 'validationErrors.categoryImport.codeColumnMissing',
    codeDuplicate: 'validationErrors.categoryImport.codeDuplicate',
    codeRequired: 'validationErrors.categoryImport.codeRequired',
    columnMissing: 'validationErrors.categoryImport.columnMissing',
    emptyHeaderFound: 'validationErrors.categoryImport.emptyHeaderFound',
    emptyFile: 'validationErrors.categoryImport.emptyFile',
    invalidParentItemOrder: 'validationErrors.categoryImport.invalidParentItemOrder',
  },

  dataImport: {
    recordAlreadyExisting: 'validationErrors.dataImport.recordAlreadyExisting',
    recordNotFound: 'validationErrors.dataImport.recordNotFound',
  },

  expressions: {
    cannotGetChildOfAttribute: 'validationErrors.expressions.cannotGetChildOfAttribute',
    cannotUseCurrentNode: 'validationErrors.expressions.cannotUseCurrentNode',
    circularDependencyError: 'validationErrors.expressions.circularDependencyError',
    expressionInvalid: 'validationErrors.expressions.expressionInvalid',
    unableToFindNode: 'validationErrors.expressions.unableToFindNode',
    unableToFindNodeChild: 'validationErrors.expressions.unableToFindNodeChild',
    unableToFindNodeParent: 'validationErrors.expressions.unableToFindNodeParent',
    unableToFindNodeSibling: 'validationErrors.expressions.unableToFindNodeSibling',
  },

  nodeDefEdit: {
    applyIfDuplicate: 'validationErrors.nodeDefEdit.applyIfDuplicate',
    applyIfInvalid: 'validationErrors.nodeDefEdit.applyIfInvalid',
    columnWidthCannotBeGreaterThan: 'validationErrors.nodeDefEdit.columnWidthCannotBeGreaterThan',
    columnWidthCannotBeLessThan: 'validationErrors.nodeDefEdit.columnWidthCannotBeLessThan',
    countMaxMustBePositiveNumber: 'validationErrors.nodeDefEdit.countMaxMustBePositiveNumber',
    countMinMustBePositiveNumber: 'validationErrors.nodeDefEdit.countMinMustBePositiveNumber',
    defaultValuesInvalid: 'validationErrors.nodeDefEdit.defaultValuesInvalid',
    defaultValuesNotSpecified: 'validationErrors.nodeDefEdit.defaultValuesNotSpecified',
    categoryRequired: 'validationErrors.nodeDefEdit.categoryRequired',
    childrenEmpty: 'validationErrors.nodeDefEdit.childrenEmpty',
    entitySourceRequired: 'validationErrors.nodeDefEdit.entitySourceRequired',
    expressionApplyIfOnlyLastOneCanBeEmpty: 'validationErrors.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty',
    expressionDuplicate: 'validationErrors.nodeDefEdit.expressionDuplicate',
    expressionRequired: 'validationErrors.nodeDefEdit.expressionRequired',
    formulaInvalid: 'validationErrors.nodeDefEdit.formulaInvalid',
    keysEmpty: 'validationErrors.nodeDefEdit.keysEmpty',
    keysExceedingMax: 'validationErrors.nodeDefEdit.keysExceedingMax',
    maxFileSizeInvalid: 'validationErrors.nodeDefEdit.maxFileSizeInvalid',
    nameInvalid: 'validationErrors.nodeDefEdit.nameInvalid',
    taxonomyRequired: 'validationErrors.nodeDefEdit.taxonomyRequired',
    validationsInvalid: 'validationErrors.nodeDefEdit.validationsInvalid',
  },

  record: {
    keyDuplicate: 'validationErrors.record.keyDuplicate',
    oneOrMoreInvalidValues: 'validationErrors.record.oneOrMoreInvalidValues',
    uniqueAttributeDuplicate: 'validationErrors.record.uniqueAttributeDuplicate',
    valueRequired: 'validationErrors.record.valueRequired',
  },

  surveyInfoEdit: {
    langRequired: 'validationErrors.surveyInfoEdit.langRequired',
    srsRequired: 'validationErrors.surveyInfoEdit.srsRequired',
    cyclesRequired: 'validationErrors.surveyInfoEdit.cyclesRequired',
    cyclesExceedingMax: 'validationErrors.surveyInfoEdit.cyclesExceedingMax',
    cycleDateStartMandatory: 'validationErrors.surveyInfoEdit.cycleDateStartMandatory',
    cycleDateStartInvalid: 'validationErrors.surveyInfoEdit.cycleDateStartInvalid',
    cycleDateStartBeforeDateEnd: 'validationErrors.surveyInfoEdit.cycleDateStartBeforeDateEnd',
    cycleDateEndInvalid: 'validationErrors.surveyInfoEdit.cycleDateEndInvalid',
    cycleDateEndMandatoryExceptForLastCycle: 'validationErrors.surveyInfoEdit.cycleDateEndMandatoryExceptForLastCycle',
    cycleDateStartAfterPrevDateEnd: 'validationErrors.surveyInfoEdit.cycleDateStartAfterPrevDateEnd',
  },

  taxonomyEdit: {
    codeDuplicate: 'validationErrors.taxonomyEdit.codeDuplicate',
    codeRequired: 'validationErrors.taxonomyEdit.codeRequired',
    familyRequired: 'validationErrors.taxonomyEdit.familyRequired',
    genusRequired: 'validationErrors.taxonomyEdit.genusRequired',
    scientificNameDuplicate: 'validationErrors.taxonomyEdit.scientificNameDuplicate',
    scientificNameRequired: 'validationErrors.taxonomyEdit.scientificNameRequired',
    taxaEmpty: 'validationErrors.taxonomyEdit.taxaEmpty',
    vernacularNamesDuplicate: 'validationErrors.taxonomyEdit.vernacularNamesDuplicate',
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'validationErrors.taxonomyImportJob.duplicateExtraPropsColumns',
    invalidExtraPropColumn: 'validationErrors.taxonomyImportJob.invalidExtraPropColumn',
    missingRequiredColumns: 'validationErrors.taxonomyImportJob.missingRequiredColumns',
  },

  user: {
    emailInvalid: 'validationErrors.user.emailInvalid',
    emailRequired: 'validationErrors.user.emailRequired',
    emailNotFound: 'validationErrors.user.emailNotFound',
    groupRequired: 'validationErrors.user.groupRequired',
    nameRequired: 'validationErrors.user.nameRequired',
    titleRequired: 'validationErrors.user.titleRequired',
    passwordRequired: 'validationErrors.user.passwordRequired',
    passwordInvalid: 'validationErrors.user.passwordInvalid',
    passwordUnsafe: 'validationErrors.user.passwordUnsafe',
    passwordsDoNotMatch: 'validationErrors.user.passwordsDoNotMatch',

    userNotFound: 'validationErrors.user.userNotFound',
    passwordChangeRequired: 'validationErrors.user.passwordChangeRequired',
    passwordResetNotAllowedWithPendingInvitation: 'validationErrors.user.passwordResetNotAllowedWithPendingInvitation',
  },

  userAccessRequest: {
    emailRequired: 'validationErrors.userAccessRequest.emailRequired',
    emailInvalid: 'validationErrors.userAccessRequest.emailInvalid',
    firstNameRequired: 'validationErrors.userAccessRequest.firstNameRequired',
    lastNameRequired: 'validationErrors.userAccessRequest.lastNameRequired',
    purposeRequired: 'validationErrors.userAccessRequest.purposeRequired',
    surveyNameRequired: 'validationErrors.userAccessRequest.surveyNameRequired',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'validationErrors.userAccessRequestAccept.accessRequestAlreadyProcessed',
    accessRequestNotFound: 'validationErrors.userAccessRequestAccept.accessRequestNotFound',
    emailRequired: 'validationErrors.userAccessRequestAccept.emailRequired',
    emailInvalid: 'validationErrors.userAccessRequestAccept.emailInvalid',
    roleRequired: 'validationErrors.userAccessRequestAccept.roleRequired',
    surveyNameRequired: 'validationErrors.userAccessRequestAccept.surveyNameRequired',
  },
}
