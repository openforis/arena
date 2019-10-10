module.exports = {

  common: {
    add: 'Add',
    apply: 'Apply',
    cancel: 'Cancel',
    cantUndoWarning: 'This operation cannot be undone',
    close: 'Close',
    code: 'Code',
    childrenEmpty: 'Define at least one child item',
    csvExport: 'CSV Export',
    csvImport: 'CSV Import',
    cycle: 'Cycle',
    cycle_plural: 'Cycles',
    dateCreated: 'Date created',
    dateLastModified: 'Date last modified',
    delete: 'Delete',
    description: 'Description',
    description_plural: 'Descriptions',
    done: 'Done',
    download: 'Download',
    draft: 'Draft',
    edit: 'Edit',
    email: 'Email',
    empty: 'Empty',
    error: 'Error',
    error_plural: 'Errors',
    errorMessage: 'Error message',
    errorMessage_plural: 'Error messages',
    formContainsErrors: 'Form contains errors',
    from: 'From',
    group: 'Group',
    id: 'id',
    import: 'Import',
    invalid: 'INVALID',
    item: 'Item',
    item_plural: 'Items',
    label: 'Label',
    label_plural: 'Labels',
    language: 'Language',
    manage: 'Manage',
    name: 'Name',
    new: 'New',
    no: 'No',
    noItems: `$t(common.no) $t(common.item,{'count':2})`,
    of: 'of',
    required: 'Required',
    reset: 'Reset',
    save: 'Save',
    saved: 'Saved!',
    srs: 'SRS',
    to: 'To',
    type: 'Type',
    undefinedName: 'Undefined name',
    upload: 'Upload',
    view: 'View',
    warning: 'Warning',
    warning_plural: 'Warnings',
    yes: 'Yes',
    date: {
      aMomentAgo: 'A moment ago',
      hour: 'hour',
      hour_plural: 'hours',
      day: 'day',
      day_plural: 'days',
      minute: 'minute',
      minute_plural: 'minutes',
      week: 'week',
      week_plural: 'weeks',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} }) ago`,
    },
  },

  sidebar: {
    openForisShort: 'OF',
    openForis: 'Open Foris',
    logout: 'Logout',
  },

  header: {
    myProfile: 'My profile',
  },

  nodeDefsTypes: {
    integer: 'Integer',
    decimal: 'Decimal',
    text: 'Text',
    date: 'Date',
    time: 'Time',
    boolean: 'Boolean',
    code: 'Code',
    coordinate: 'Coordinate',
    taxon: 'Taxon',
    file: 'File',
    entity: 'Entity',
  },

  // ====== App modules and views

  appModules: {
    home: 'Home',
    dashboard: 'Dashboard',
    surveyList: 'My Surveys',
    collectImportReport: 'Collect Import Report',

    designer: 'Survey',
    formDesigner: 'Form Designer',
    surveyHierarchy: 'Hierarchy',
    categories: 'Categories',
    taxonomies: 'Taxonomies',

    data: 'Data',
    records: 'Records',
    dataVis: 'Data vis',

    users: 'Users',
    userList: 'User list',

    analysis: 'Analysis',
    processingChain: 'Processing Chain',
    processingChain_plural: 'Processing Chains',
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'This section is available when survey is published',
  },

  loginView: {
    yourName: 'Your name',
    yourEmail: 'Your email',
    yourPassword: 'Your password',
    yourNewPassword: 'Your new password',
    repeatYourNewPassword: 'Repeat your new password',
    verificationCode: 'Verification code',
    resetPassword: 'Reset password',
    login: 'Login',
    forgotPassword: 'Forgot password',
    sendVerificationCode: 'Send verification code',
  },

  homeView: {
    createSurvey: 'Create Survey',
    surveyDeleted: 'Survey {{surveyName}} has been deleted',
    surveyInfo: {
      confirmPublish: `Do you want to publish this survey? Some operation won't be allowed afterwards.`,
      confirmDeleteCycle:`Are you sure you want to delete the cycle {{cycle}}?n\n$t(common.cantUndoWarning)`,
      editInfo: 'Edit info',
      publish: 'Publish',
      viewInfo: 'View info',
    },
    deleteSurveyDialog: {
      confirmDelete: 'Are you sure you want to delete this survey?',
      deleteWarning: 'Deleting the **{{surveyName}}** survey will delete all of its data.',
      confirmName: 'Enter this survey’s name to confirm:',
    },
    surveyList: {
      status: 'Status',
      active: 'Active',
      activate: 'Activate'
    },
    surveyCreate: {
      createSurvey: 'Create Survey',
      importFromCollect: 'Import from Collect',
    },
    collectImportReport: {
      path: 'Path',
      expression: 'Expression',
      messages: 'Messages',
      resolved: 'Resolved',
    },
    recordsSummary: {
      recordsAdded: 'Records added from {{from}} to {{to}}',
      record: '{{count}} Record',
      record_plural: '{{count}} Records',
      week: '{{count}} Week',
      week_plural: '{{count}} Weeks',
      month: '{{count}} Month',
      month_plural: '{{count}} Months',
      year: '{{count}} Year',
      year_plural: '{{count}} Years',
    },
  },

  designerView: {
    formPreview: 'Form preview',
  },

  recordView: {
    justDeleted: 'This record has just been deleted',
    sessionExpired: 'Record session has expired',
  },

  dataView: {
    records: {
      owner: 'Owner',
      step: 'Step',
      noRecordsAdded: 'No records added',
    },
    rowNum: 'Row #',
    invalidRecord: 'Invalid record',
    dataVis: {
      dataSort: {
        orderBy: 'Order by:',
        thenBy: 'Then by:',
        ascending: 'ascending',
        descending: 'descending',
      },
    },
  },

  usersView: {
    inviteUser: 'Invite',
    accepted: 'Accepted',
    inviteUserConfirmation: 'An email to {{email}} has been sent',
    updateUserConfirmation: 'User {{name}} has been updated',
    notAcceptedYet: 'Invitation not accepted yet',
  },

  userView: {
    scale: 'Scale',
    rotate: 'Rotate',
    dragAndDrop: 'Drop an image above or',
    upload: 'click here to upload',
    sendInvitation: 'Send invitation',
    removeFromSurvey: 'Remove from survey',
    confirmRemove: 'Are you sure you want to revoke access to {{user}} from survey {{survey}}?',
    removeUserConfirmation: 'User {{user}} has been removed from survey {{survey}}',
  },

  analysis: {
    processingChain: {
      dateExecuted: 'Date executed',
      status: 'Status'
    }
  },

  itemsTable: {
    unused: 'Unused',
    noItemsAdded: 'No items added',
  },

  // ====== Survey views

  nodeDefEdit: {
    basic: 'Basic',
    advanced: 'Advanced',
    validations: 'Validations',
    basicProps: {
      key: 'Key',
      multiple: 'Multiple',
      displayAs: 'Display as',
      displayIn: 'Display in',
      form: 'Form',
      table: 'Table',
      parentPage: 'Parent page',
      ownPage: 'Its own page',
    },
    advancedProps: {
      readOnly: 'Read only',
      defaultValues: 'Default values',
      applicableIf: 'Applicable if',
    },
    codeProps: {
      category: 'Category',
      displayAs: 'Display As',
      displayAsTypes: {
        checkbox: 'Checkbox',
        dropdown: 'Dropdown',
      },
      parentCode: 'Parent Code'
    },
    expressionsProp: {
      expression: 'Expression',
      applyIf: 'Apply If',
      confirmDelete: 'Delete this expression?',
      severity: 'Severity'
    },
    validationsProps: {
      minCount: 'Min count',
      maxCount: 'Max count',
      expressions: 'Expressions',
    },
    cannotChangeIntoMultipleWithDefaultValues: 'This node cannot be converted to multiple because it has default values.',
    cannotDeleteNodeDefReferenced: 'Cannot delete "{{nodeDef}}": it\'s referenced by these node definitions: {{nodeDefDependents}}'
  },

  languagesEditor: {
    languages: 'Language(s)',
  },

  surveyForm: {
    subPage: 'Sub page',
    addChildTo: 'Add to {{nodeDef}}',
    formEditActions: {
      preview: 'Preview',
    },
    formEntryActions: {
      confirmDemote: 'Are sure you want to demote this record to {{name}}?',
      confirmPromote: `Are sure you want to promote this record to {{name}}?\n\nYou won't be able to edit it anymore`,
      confirmDelete: 'Are you sure you want to delete this record?\n\n$t(common.cantUndoWarning)',
      closePreview: 'Close preview',
      step: 'Step {{id}} ({{name}})',
    },
    nodeDefEditFormActions: {
      columns: 'Columns',
      confirmDelete: 'Are you sure you want to permanently delete this node definition?\n\n$t(common.cantUndoWarning)',
    },
    nodeDefCode: {
      buttonCode: 'Button code',
      code: '$t(common.code)',
      label: '$t(common.label)',
    },
    nodeDefCoordinate: {
      x: 'X',
      y: 'Y',
    },
    nodeDefEntityForm: {
      confirmDelete: 'Are you sure you want to delete this entity?',
      select: 'Select',
    },
    nodeDefTaxon: {
      code: '$t(common.code)',
      scientificName: 'Scientific name',
      vernacularName: 'Vernacular name',
    },
    nodeDefFile: {
      fileUuid: 'File uuid',
      fileName: 'File name',
    },
    step: {
      entry: 'Entry',
      cleansing: 'Cleansing',
      analysis: 'Analysis',
    },
    confirmNodeDelete: 'Are you sure you want to delete this item?',
  },

  taxonomy: {
    cantBeDeleted: 'This taxonomy is used by some node definitions and cannot be deleted',
    confirmDelete: 'Delete the taxonomy {{taxonomyName}}? This operation cannot be undone.',
    edit: {
      taxonomyName: 'Taxonomy name',
      taxaNotImported: 'Taxa not imported',
      family: 'Family',
      genus: 'Genus',
      scientificName: '$t(surveyForm.nodeDefTaxon.scientificName)',
    },
  },

  categoryEdit: {
    addLevel: 'Add level',
    categoryName: 'Category name',
    cantBeDeleted: 'This category is used by some node definitions and cannot be removed',
    cantImportCsvIntoPublishedCategory: 'Cannot import CSV into a published category.',
    confirmDelete: 'Delete the category {{categoryName}}? This operation cannot be undone.',
    confirmDeleteItem: 'Delete the item with all children? $t(common.cantUndoWarning)',
    deleteItem: 'Delete item',
    level: 'Level',

    importSummary: {
      column: 'Column',
      columnTypeSummary: 'Level {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeSummaryExtra: '{{type}}',
      columnTypeSummaryWithLanguage: '$t(categoryEdit.importSummary.columnTypeSummary) ({{language}})',
      columnType: {
        code: 'code',
        description: 'description',
        label: 'label',
        extra: 'extra'
      },
      columnDataType: {
        geometryPoint: 'Geometry Point',
        number: 'Number',
        text: 'Text'
      },
      dataType: 'Data Type',
    }
  },

  // ===== All validation errors
  validationErrors: {
    // common
    invalidField: '"{{field}}" is invalid',
    invalidNumber: 'Invalid number',
    nameDuplicate: 'Name is duplicate',
    nameCannotBeKeyword: 'Name "{{value}}" cannot be used: it\'s a reserved word',
    nameRequired: 'Name is required',
    rowsDuplicate: 'row: {{row}} duplicate row: {{duplicateRow}}',

    categoryEdit: {
      childrenEmpty: '$t(common.childrenEmpty)',
      childrenInvalid: 'At least one invalid child',
      codeCannotBeKeyword: 'Code "{{value}}" cannot be used: it\'s a reserved word',
      codeDuplicate: 'Code is duplicate',
      codeRequired: 'Code is required',
      itemsInvalid: 'At least one invalid item',
      itemsEmpty: 'Define at least one item',
      levelDuplicate: 'Level name is duplicate',
      levelsInvalid: 'At least one invalid level',
    },

    categoryImport: {
      codeColumnMissing: 'There should be at least one "code" column',
      codeRequired: '{{columnName}}: a code is required',
      codeDuplicate: '{{columnName}}: duplicate code "{{code}}"',
      columnMissing: 'Missing column: {{columnNameMissing}}',
      emptyHeaderFound: 'The file contains an empty header',
      emptyFile: 'The file you are trying to import is empty'
    },

    expressions: {
      expressionInvalid: "Invalid expression: {{details}}",
      cannotGetChildOfAttribute: 'cannot get child node {{childName}} of attribute {{parentName}}',
      unableToFindNodeChild: 'unable to find child node: {{name}}',
      unableToFindNodeParent: 'unable to find parent node: {{name}}',
      unableToFindNodeSibling: 'unable to find sibling node: {{name}}',
    },

    nodeDefEdit: {
      applyIfDuplicate: '"Apply if" condition is duplicate',
      applyIfInvalid: 'Invalid "Apply if" condition',
      countMaxMustBePositiveNumber: 'Max Count must be a positive integer',
      countMinMustBePositiveNumber: 'Min Count must be a positive integer',
      categoryRequired: 'Category is required',
      childrenEmpty: '$t(common.childrenEmpty)',
      defaultValuesInvalid: 'Invalid "Default Values"',
      defaultValuesNotSpecified: 'Default value not specified',
      expressionApplyIfOnlyLastOneCanBeEmpty: 'Only last expression can have empty "Apply if" condition',
      expressionDuplicate: 'Expression duplicate',
      expressionRequired: 'Expression required',
      keysEmpty: 'Define at least one key attribute',
      keysExceedingMax: 'Exceeding maximum number of key attributes',
      nameInvalid: 'Name is invalid (it must contain only lowercase letters, numbers and underscores, starting with a letter)',
      taxonomyRequired: 'Taxonomy is required',
      validationsInvalid: 'Invalid "Validations"',
    },

    record: {
      keyDuplicate: 'Duplicate record key',
      oneOrMoreInvalidValues: 'One or more values are invalid',

      entityKeyDuplicate: 'Duplicate entity key',
      nodesMaxCountExceeded: 'Nodes must be less than or equal to {{maxCount}}',
      nodesMinCountNotReached: 'Nodes must be more than or equal to {{minCount}}',
      valueInvalid: 'Invalid value',
      valueRequired: 'Required value',
    },

    surveyInfoEdit: {
      langRequired: 'Language is required',
      srsRequired: 'Spatial Reference System is required',
    },

    taxonomyEdit: {
      codeDuplicate: 'Duplicate code {{code}}; $t(validationErrors.rowsDuplicate)',
      codeRequired: 'Code is required',
      familyRequired: 'Family is required',
      genusRequired: 'Genus is required',
      scientificNameDuplicate: 'Duplicate scientific name {{scientificName}}; $t(validationErrors.rowsDuplicate)',
      scientificNameRequired: 'Scientific name is required',
      taxaEmpty: 'Empty taxa',
    },

    taxonomyImportJob: {
      missingRequiredColumns: 'Missing required column(s): {{columns}}'
    },

    user: {
      emailRequired: 'Email is required',
      emailInvalid: 'Email is invalid',
      groupRequired: 'Group is required',

      userNameRequired: 'User name is required',
      passwordRequired: 'Password is required',
      passwordInvalid: 'Password should not start nor end with white spaces',
      passwordUnsafe: 'Password should be at least 8 characters long and contain lowercase characters, uppercase characters and numbers',
      passwordsDoNotMatch: `Passwords don't match`,
      verificationCodeInvalid: 'Invalid verification code',

      userDoesNotExist: 'User does not exist',
      userNotAuthorized: 'Incorrect username or password',
      verificationCodeMismatch: 'Invalid verification code provided, please try again',
    }
  },

  // ====== Jobs
  jobs: {
    CategoriesImportJob: 'Categories Import',
    CategoryImportJob: 'Category Import',
    CategoriesValidationJob: 'Categories Validation',
    CollectImportJob: 'Collect Import',
    CollectSurveyReaderJob: 'Collect Survey Reader',
    CyclesDeletedCheckJob: 'Check deleted cycles',
    NodeDefsImportJob: 'Node Defs Import',
    NodeDefsValidationJob: 'Node Defs Validation',
    RecordCheckJob: 'Record Check',
    RecordsImportJob: 'Records Import',
    RecordsUniquenessValidationJob: 'Records Uniqueness Validation',
    SamplingPointDataImportJob: 'Sampling Point Data Import',
    SurveyCreatorJob: 'Survey Create',
    SurveyDependencyGraphsGenerationJob: 'Survey Dependency Graph Generation',
    SurveyIndexGeneratorJob: 'Survey Index Generator',
    SurveyInfoValidationJob: 'Survey Info Validation',
    SurveyPropsPublishJob: 'Survey Props Publish',
    SurveyPublishJob: 'Survey Publish',
    SurveyPublishPerformJob: 'Survey Publish Perform',
    SurveyRdbGeneratorJob: 'Survey RDB Generator',
    TaxonomiesImportJob: 'Taxonomies Import',
    TaxonomiesValidationJob: 'Taxonomies Validation',
    TaxonomyImportJob: 'Taxonomy Import',
  },

  // ====== App Errors

  appErrors: {
    generic: '{{text}}',
    userNotAuthorized: 'User {{userName}} is not authorized',
    undefinedFunction: `Undefined function '{{fnName}}' or wrong parameter types`,
    unsupportedFunctionType: 'Unsupported function type: {{exprType}}',
    jobCanceledOrErrorsFound: 'Job canceled or errors found; rollback transaction',
    entryDataNotFound: 'Entry data not found: {{entryName}}',
    invalidType: 'Invalid type {{type}}',
    unableToFindParent: 'Unable to find parent of {{name}}',
    unableToFindNode: 'Unable to find node with name {{name}}',
    cannotGetChild: `Cannot get child '{{childName}}' from attribute {{name}}`,
    unableToFindSibling: 'Unable to find sibling with name {{name}}',
    cantUpdateStep: `Can't update step`,
    cannotOverridePublishedTaxa: 'Cannot overwrite published taxa',
    userNotAllowedToChangePref: 'User not allowed to change pref',
    paramIsRequired: 'Param {{param}} is required',
    userHasRole: 'The given user has already a role in this survey',
    userIsAdmin: 'The given user is already a system administrator',
    invalidUser: 'Invalid user',
  },

  systemErrors: {
    somethingWentWrong: 'Oooops! Something went wrong. Try to refresh the page.'
  },

  // ====== Common components

  expressionEditor: {
    and: 'AND',
    or: 'OR',
    group: 'Group',
    var: 'Var',
    const: 'Const',
  },

  // ====== Auth

  authGroups: {
    systemAdmin: {
      label: 'System Administrator',
      label_plural: 'System Administrators',
      description: 'OF Arena system administrators',
    },
    surveyAdmin: {
      label: 'Survey administrator',
      label_plural: 'Survey administrators',
      description: 'Full rights',
    },
    surveyEditor: {
      label: 'Survey editor',
      label_plural: 'Survey editors',
      description: 'Can edit survey, records, invite users',
    },
    dataEditor: {
      label: 'Data editor',
      label_plural: 'Data editors',
      description: 'Can edit records in data entry step',
    },
    dataCleanser: {
      label: 'Data cleanser',
      label_plural: 'Data cleansers',
      description: 'Can edit records in data cleansing step',
    },
    dataAnalyst: {
      label: 'Data analyst',
      label_plural: 'Data analysts',
      description: 'Can edit records in data analysis step',
    },
    surveyGuest: {
      label: 'Survey guest',
      label_plural: 'Survey guests',
      description: 'Can view records',
    },
  },

  emails: {
    userInvite: {
      subject: 'You have been invited to OpenForis Arena!',
      body: `<p>Hello,</p>
             <p>You have been invited to join the survey <strong>{{surveyLabel}}</strong> as {{groupLabel}}</p>
             {{temporaryPasswordMsg}}
             <p><a href="{{serverUrl}}">Click here to access OpenForis Arena</a></p>
             <p>
             Thank you,
             <br>
             The OpenForis Arena team
             </p>`,
      temporaryPasswordMsg: '<p>Your username is <strong>{{email}}</strong> and your temporary password is <strong>{{password}}</strong></p>',
    }
  }
}
