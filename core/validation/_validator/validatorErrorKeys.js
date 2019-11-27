export const ValidatorErrorKeys = {
  invalidNumber: 'validationErrors.invalidNumber',
  invalidField: 'validationErrors.invalidField',
  invalidDate: 'validationErrors.invalidDate',
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
    levelsInvalid: 'validationErrors.categoryEdit.levelsInvalid',
  },

  categoryImport: {
    codeColumnMissing: 'validationErrors.categoryImport.codeColumnMissing',
    codeDuplicate: 'validationErrors.categoryImport.codeDuplicate',
    codeRequired: 'validationErrors.categoryImport.codeRequired',
    columnMissing: 'validationErrors.categoryImport.columnMissing',
    emptyHeaderFound: 'validationErrors.categoryImport.emptyHeaderFound',
    emptyFile: 'validationErrors.categoryImport.emptyFile',
  },

  expressions: {
    cannotGetChildOfAttribute:
      'validationErrors.expressions.cannotGetChildOfAttribute',
    cannotUseCurrentNode: 'validationErrors.expressions.cannotUseCurrentNode',
    circularDependencyError:
      'validationErrors.expressions.circularDependencyError',
    expressionInvalid: 'validationErrors.expressions.expressionInvalid',
    unableToFindNode: 'validationErrors.expressions.unableToFindNode',
    unableToFindNodeChild: 'validationErrors.expressions.unableToFindNodeChild',
    unableToFindNodeParent:
      'validationErrors.expressions.unableToFindNodeParent',
    unableToFindNodeSibling:
      'validationErrors.expressions.unableToFindNodeSibling',
  },

  nodeDefEdit: {
    applyIfDuplicate: 'validationErrors.nodeDefEdit.applyIfDuplicate',
    applyIfInvalid: 'validationErrors.nodeDefEdit.applyIfInvalid',
    countMaxMustBePositiveNumber:
      'validationErrors.nodeDefEdit.countMaxMustBePositiveNumber',
    countMinMustBePositiveNumber:
      'validationErrors.nodeDefEdit.countMinMustBePositiveNumber',
    defaultValuesInvalid: 'validationErrors.nodeDefEdit.defaultValuesInvalid',
    defaultValuesNotSpecified:
      'validationErrors.nodeDefEdit.defaultValuesNotSpecified',
    categoryRequired: 'validationErrors.nodeDefEdit.categoryRequired',
    childrenEmpty: 'validationErrors.nodeDefEdit.childrenEmpty',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'validationErrors.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty',
    expressionDuplicate: 'validationErrors.nodeDefEdit.expressionDuplicate',
    expressionRequired: 'validationErrors.nodeDefEdit.expressionRequired',
    keysEmpty: 'validationErrors.nodeDefEdit.keysEmpty',
    keysExceedingMax: 'validationErrors.nodeDefEdit.keysExceedingMax',
    nameInvalid: 'validationErrors.nodeDefEdit.nameInvalid',
    taxonomyRequired: 'validationErrors.nodeDefEdit.taxonomyRequired',
    validationsInvalid: 'validationErrors.nodeDefEdit.validationsInvalid',
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
    cyclesRequired: 'validationErrors.surveyInfoEdit.cyclesRequired',
    cyclesExceedingMax: 'validationErrors.surveyInfoEdit.cyclesExceedingMax',
    cycleDateStartMandatory:
      'validationErrors.surveyInfoEdit.cycleDateStartMandatory',
    cycleDateStartInvalid:
      'validationErrors.surveyInfoEdit.cycleDateStartInvalid',
    cycleDateStartBeforeDateEnd:
      'validationErrors.surveyInfoEdit.cycleDateStartBeforeDateEnd',
    cycleDateEndInvalid: 'validationErrors.surveyInfoEdit.cycleDateEndInvalid',
    cycleDateEndMandatoryExceptForLastCycle:
      'validationErrors.surveyInfoEdit.cycleDateEndMandatoryExceptForLastCycle',
    cycleDateStartAfterPrevDateEnd:
      'validationErrors.surveyInfoEdit.cycleDateStartAfterPrevDateEnd',
  },

  taxonomyEdit: {
    codeDuplicate: 'validationErrors.taxonomyEdit.codeDuplicate',
    codeRequired: 'validationErrors.taxonomyEdit.codeRequired',
    familyRequired: 'validationErrors.taxonomyEdit.familyRequired',
    genusRequired: 'validationErrors.taxonomyEdit.genusRequired',
    scientificNameDuplicate:
      'validationErrors.taxonomyEdit.scientificNameDuplicate',
    scientificNameRequired:
      'validationErrors.taxonomyEdit.scientificNameRequired',
    taxaEmpty: 'validationErrors.taxonomyEdit.taxaEmpty',
  },

  taxonomyImportJob: {
    missingRequiredColumns:
      'validationErrors.taxonomyImportJob.missingRequiredColumns',
  },

  user: {
    emailInvalid: 'validationErrors.user.emailInvalid',
    emailRequired: 'validationErrors.user.emailRequired',
    groupRequired: 'validationErrors.user.groupRequired',

    passwordRequired: 'validationErrors.user.passwordRequired',
    passwordInvalid: 'validationErrors.user.passwordInvalid',
    passwordUnsafe: 'validationErrors.user.passwordUnsafe',
    userNameRequired: 'validationErrors.user.userNameRequired',
    passwordsDoNotMatch: 'validationErrors.user.passwordsDoNotMatch',

    // Cognito exceptions
    UserNotFoundException: 'validationErrors.user.userDoesNotExist',
    NotAuthorizedException: 'validationErrors.user.userNotAuthorized',
    CodeMismatchException: 'validationErrors.user.verificationCodeInvalid',
  },
}
