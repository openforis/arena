export default {
  // Common
  invalidEmail: 'Invalid email',
  invalidField: '"{{field}}" is invalid',
  invalidNumber: 'Invalid number',
  invalidDate: 'Invalid date',
  minLengthNotRespected: 'Minimum length of {{minLength}} characters not respected',
  nameDuplicate: 'Name is duplicate',
  nameCannotBeKeyword: `Name "{{value}}" cannot be used: it's a reserved word`,
  nameInvalid:
    'Name is invalid: it must contain only lowercase letters and numbers, starting with a letter, and only "-" and "_" symbols',
  nameRequired: 'Name is required',
  requiredField: '{{field}} is required',
  rowsDuplicate: 'row: {{row}} duplicate row: {{duplicateRow}}',

  analysis: {
    labelDefaultLangRequired: 'Label in survey default language is required',
    analysisNodeDefsRequired: 'At least one calculated attribute is required',
  },

  categoryEdit: {
    childrenEmpty: '$t(common.childrenEmpty)',
    childrenInvalid: 'At least one invalid child',
    codeCannotBeKeyword: `Code "{{value}}" cannot be used: it's a reserved word`,
    codeDuplicate: 'Code is duplicate',
    codeRequired: 'Code is required',
    itemExtraPropDataTypeRequired: 'Data type required for $t(extraProp.label) "{{key}}"',
    itemExtraPropNameInvalid: 'Invalid name for $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidNumber: 'Invalid number for $t(extraProp.label) "{{key}}"',
    itemExtraPropInvalidGeometryPoint: 'Invalid geometry point for $t(extraProp.label) "{{key}}"',
    itemsInvalid: 'At least one invalid item',
    itemsEmpty: 'Define at least one item',
    levelDuplicate: 'Level name is duplicate',
    levelsInvalid: 'At least one invalid level',
    nameNotSpecified: 'Category name not specified',
  },

  categoryImport: {
    cannotDeleteItemsOfPublishedCategory:
      'Cannot delete published category items. Items missing in imported file: {{deletedItemCodes}}',
    cannotDeleteLevelsOfPublishedCategory:
      'Cannot delete levels of published category. Levels missing in imported file: {{deletedLevelNames}}',
    codeColumnMissing: 'There should be at least one "code" column',
    codeRequired: '{{columnName}}: a code is required',
    codeDuplicate: '{{columnName}}: duplicate code "{{code}}"',
    columnMissing: 'Missing column: {{columnNameMissing}}',
    emptyHeaderFound: 'The file contains an empty header',
    emptyFile: '$t(validationErrors:dataImport.emptyFile)',
    invalidImportFile: 'ZIP file must contain only .csv files (one for each category), without any directories',
    invalidParentItemOrder: 'Item with codes {{parentItemCodes}} must come before its children',
    nameDuplicate: 'A category with the same name already exists: {{name}}',
    srsNotDefined: 'SRS with code {{srs}} not defined in survey',
  },

  dataImport: {
    emptyFile: 'The file you are trying to import is empty',
    invalidHeaders: 'Invalid columns: {{invalidHeaders}}',
    invalidBoolean: 'Invalid boolean in column {{headers}}: {{value}}',
    invalidCode: `Invalid code for attribute '{{attributeName}}': {{code}}`,
    invalidCoordinate: 'Invalid coordinate in column {{headers}}: {{value}}',
    invalidDate:
      'Invalid date in column {{headers}}: {{value}}. Dates should be formatted as yyyy-MM-dd or dd/MM/yyyy. E.g. 2023-01-15 or 15/01/2023',
    invalidNumber: 'Invalid number in column {{headers}}: {{value}}',
    invalidTaxonCode: 'Invalid code in column {{headers}}: {{value}}',
    missingRequiredHeaders: 'Missing required columns: {{missingRequiredHeaders}}',
    errorUpdatingValues: 'Error updating values',
    multipleRecordsMatchingKeys: 'Multiple records found matching keys "{{keyValues}}"',
    recordAlreadyExisting: 'Record with keys "{{keyValues}}" already existing',
    recordInAnalysisStepCannotBeUpdated: 'Record with keys "{{keyValues}}" is in Analysis step and cannot be updated',
    recordKeyMissing: 'Missing value for key attribute "{{keyName}}"',
    recordNotFound: 'Record with keys "{{keyValues}}" not found',
  },

  expressions: {
    cannotGetChildOfAttribute: 'cannot get child node {{childName}} of attribute {{parentName}}',
    cannotUseCurrentNode: 'cannot use current node {{name}} in this expression',
    circularDependencyError: 'cannot reference node {{name}} because it references the current node',
    expressionInvalid: 'Invalid expression: {{details}}',
    unableToFindNode: 'unable to find node: {{name}}',
    unableToFindNodeChild: 'unable to find child node: {{name}}',
    unableToFindNodeParent: 'unable to find parent node: {{name}}',
    unableToFindNodeSibling: 'unable to find sibling node: {{name}}',
  },

  nodeDefEdit: {
    analysisParentEntityRequired: 'Entity is required',
    applyIfDuplicate: '"$t(nodeDefEdit.expressionsProp.applyIf)" condition is duplicate',
    applyIfInvalid: 'Invalid "$t(nodeDefEdit.advancedProps.relevantIf)" condition',
    columnWidthCannotBeGreaterThan: 'Column width cannot be greater than {{max}}',
    columnWidthCannotBeLessThan: 'Column width cannot be less than {{min}}',
    countMaxMustBePositiveNumber: 'Max Count must be a positive integer',
    countMinMustBePositiveNumber: 'Min Count must be a positive integer',
    categoryRequired: 'Category is required',
    childrenEmpty: '$t(common.childrenEmpty)',
    defaultValuesInvalid: 'Invalid "Default Values"',
    defaultValuesNotSpecified: 'Default value not specified',
    entitySourceRequired: 'Entity Source required',
    expressionApplyIfOnlyLastOneCanBeEmpty:
      'Only last expression can have empty "$t(nodeDefEdit.expressionsProp.applyIf)" condition',
    expressionDuplicate: 'Expression duplicate',
    expressionRequired: 'Expression required',
    formulaInvalid: 'Formula is invalid',
    keysEmpty: 'Define at least one key attribute',
    keysExceedingMax: 'Exceeding maximum number of key attributes',
    minCountInvalid: 'Min count expression is invalid',
    maxFileSizeInvalid: 'Max file size must be greater than 0 and less than {{max}}',
    maxCountInvalid: 'Max count expression is invalid',
    nameInvalid:
      'Name is invalid (it must contain only lowercase letters, numbers and underscores, starting with a letter)',
    taxonomyRequired: 'Taxonomy is required',
    validationsInvalid: 'Invalid "Validations"',
  },

  record: {
    keyDuplicate: 'Duplicate record key',
    entityKeyDuplicate: 'Duplicate key',
    entityKeyValueNotSpecified: 'Entity key value for entity "{{entityName}}" not specified',
    missingAncestorForEntity: 'Cannot find ancestor "{{ancestorName}}" for entity "{{entityName}}"',
    uniqueAttributeDuplicate: 'Duplicate value',
    valueInvalid: 'Invalid value',
    valueRequired: 'Required value',
  },

  recordClone: {
    differentKeyAttributes: 'Key attributes are different in Cycle {{cycleFrom}} and Cycle {{cycleTo}}',
  },

  surveyInfoEdit: {
    langRequired: 'Language is required',
    srsRequired: 'Spatial Reference System is required',
    cycleRequired: 'Cycle is required',
    cyclesRequired: 'At least one cycle must be defined',
    cyclesExceedingMax: 'A survey can have at most 10 cycles',
    cycleDateStartBeforeDateEnd: 'Cycle start date must be before its end date',
    cycleDateStartAfterPrevDateEnd: 'Cycle start date must be after previous cycle end date',
    cycleDateStartInvalid: 'Cycle start date is invalid',
    cycleDateStartMandatory: 'Cycle start date is mandatory',
    cycleDateEndInvalid: 'Cycle end date is invalid',
    cycleDateEndMandatoryExceptForLastCycle: 'Cycle end date is mandatory for all but the last cycle',
  },

  surveyLabelsImport: {
    invalidHeaders: 'Invalid columns: {{invalidHeaders}}',
    cannotFindNodeDef: "Cannot find attribute or entity definition with name '{{name}}'",
  },

  taxonomyEdit: {
    codeChangedAfterPublishing: `Published code has changed: '{{oldCode}}' => '{{newCode}}'`,
    codeDuplicate: 'Duplicate code {{value}}; $t(validationErrors:rowsDuplicate)',
    codeRequired: 'Code is required',
    familyRequired: 'Family is required',
    genusRequired: 'Genus is required',
    scientificNameDuplicate: 'Duplicate scientific name {{value}}; $t(validationErrors:rowsDuplicate)',
    scientificNameRequired: 'Scientific name is required',
    taxaEmpty: 'Empty taxa',
    vernacularNamesDuplicate: `Duplicate vernacular name '{{name}}' for language '{{lang}}'`,
  },

  taxonomyImportJob: {
    duplicateExtraPropsColumns: 'Duplicate Extra Info columns: {{duplicateColumns}}',
    invalidExtraPropColumn: 'Invalid Extra Info column name "{{columnName}}": it cannot be a reserved word',
    missingRequiredColumns: 'Missing required column(s): {{columns}}',
  },

  user: {
    emailRequired: 'Email is required',
    emailInvalid: 'Email is invalid',
    emailNotFound: 'Email not found',
    groupRequired: 'Group is required',
    nameRequired: 'Name is required',
    titleRequired: 'Title is required',
    passwordRequired: 'Password is required',
    passwordInvalid: 'Password should not contain white spaces',
    passwordUnsafe:
      'Password should be at least 8 characters long and contain lowercase characters, uppercase characters and numbers',
    passwordsDoNotMatch: `Passwords don't match`,

    userNotFound: 'User not found. Make sure email and password are correct',
    passwordChangeRequired: 'Password change required',
    passwordResetNotAllowedWithPendingInvitation: `Password reset not allowed: user has been invited to a survey but the invitation hasn't been accepted yet`,
  },

  userAccessRequest: {
    emailRequired: '$t(validationErrors:user.emailRequired)',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    purposeRequired: 'Purpose is required',
    surveyNameRequired: 'Survey name is required',
    invalidRequest: 'Invalid user access request',
    userAlreadyExisting: 'User with email {{email}} already existing',
    requestAlreadySent: `Access request for user with email {{email}} already sent`,
    invalidReCaptcha: 'Invalid ReCaptcha',
  },

  userAccessRequestAccept: {
    accessRequestAlreadyProcessed: 'User access request already processed',
    accessRequestNotFound: 'User access request not found',
    emailRequired: '$t(validationErrors:user.emailRequired)',
    emailInvalid: '$t(validationErrors:user.emailInvalid)',
    roleRequired: 'Role is required',
    surveyNameRequired: 'Survey name is required',
  },

  userPasswordChange: {
    oldPasswordRequired: 'Old password is required',
    oldPasswordWrong: 'Old password is wrong',
    newPasswordRequired: 'New password is required',
    confirmPasswordRequired: 'Confirm password is required',
    confirmedPasswordNotMatching: 'New password and confirm password do not match',
  },
}
