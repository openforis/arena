module.exports = {

  common: {
    add: 'Add',
    apply: 'Apply',
    cancel: 'Cancel',
    cantUndoWarning: 'This operation cannot be undone',
    close: 'Close',
    code: 'Code',
    csvExport: 'CSV Export',
    csvImport: 'CSV Import',
    childrenEmpty: 'Define at least one child item',
    dateCreated: 'Date created',
    dateLastModified: 'Date last modified',
    delete: 'Delete',
    description: 'Description',
    description_plural: 'Descriptions',
    done: 'Done',
    download: 'Download',
    edit: 'Edit',
    email: 'Email',
    empty: 'Empty',
    error: 'Error',
    error_plural: 'Errors',
    errorMessage: 'Error message',
    errorMessage_plural: 'Error messages',
    formContainsErrors: 'Form contains errors',
    group: 'Group',
    id: 'id',
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
    type: 'Type',
    undefinedName: 'Undefined name',
    upload: 'Upload',
    view: 'View',
    yes: 'Yes',
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
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'This section is available when survey is published',
  },

  data: {
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

  homeView: {
    createSurvey: 'Create Survey',
    surveyDeleted: 'Survey {{surveyName}} has been deleted',
    surveyInfo: {
      publish: 'Publish',
      viewInfo: 'View info',
      editInfo: 'Edit info',
      confirmPublish: `Do you want to publish this survey? Some operation won't be allowed afterwards.`,
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

  usersView: {
    inviteUser: 'Invite',
    sendInvitation: 'Send invitation',
    accepted: 'Accepted',
    inviteUserConfirmation: 'An email to {{email}} has been sent',
    updateUserConfirmation: 'User {{name}} has been updated',
    notAcceptedYet: 'Invitation not accepted yet',
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
    expressionsProp: {
      expression: 'Expression',
      applyIf: 'Apply If',
      confirmDelete: 'Delete this expression?',
    },
    validationsProps: {
      minCount: 'Min count',
      maxCount: 'Max count',
      expressions: 'Expressions',
    },
    cannotChangeIntoMultipleWithDefaultValues: 'This node cannot be converted to multiple because it has default values.'
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
    categoryName: 'Category name',
    addLevel: 'Add level',
    level: 'Level',
    confirmDelete: 'Delete the item with all children? $t(common.cantUndoWarning)',
    deleteItem: 'Delete item',
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
    },

    nodeDefEdit: {
      applyIfDuplicate: '"Apply if" condition is duplicate',
      countMaxMustBePositiveNumber: 'Max Count must be a positive integer',
      countMinMustBePositiveNumber: 'Min Count must be a positive integer',
      categoryRequired: 'Category is required',
      childrenEmpty: '$t(common.childrenEmpty)',
      defaultValuesNotSpecified: 'Default value not specified',
      expressionRequired: 'Expression required',
      keysEmpty: 'Define at least one key attribute',
      keysExceedingMax: 'Exceeding maximum number of key attributes',
      nameInvalid: 'Name is invalid (it must contain only lowercase letters, numbers and underscores, starting with a letter)',
      taxonomyRequired: 'Taxonomy is required',
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
    }
  },

  // ====== Jobs
  jobs: {
    CategoriesImportJob: 'Categories Import',
    CategoryImportJob: 'Category Import',
    CategoriesValidationJob: 'Categories Validation',
    CollectImportJob: 'Collect Import',
    CollectSurveyReaderJob: 'Collect Survey Reader',
    NodeDefsImportJob: 'Node Defs Import',
    NodeDefsValidationJob: 'Node Defs Validation',
    RecordCheckJob: 'Record Check',
    RecordsImportJob: 'Records Import',
    RecordsUniquenessValidationJob: 'Records Uniqueness Validation',
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
      label: 'System Administrators',
      description: 'OF Arena system administrators',
    },
    surveyAdmin: {
      label: 'Survey administrators',
      description: 'Full rights',
    },
    surveyEditor: {
      label: 'Survey editors',
      description: 'Can edit survey, records, invite users',
    },
    dataEditor: {
      label: 'Data editors',
      description: 'Can edit records in data entry step',
    },
    dataCleanser: {
      label: 'Data cleansers',
      description: 'Can edit records in data cleansing step',
    },
    dataAnalyst: {
      label: 'Data analysts',
      description: 'Can edit records in data analysis step',
    },
    surveyGuest: {
      label: 'System guest',
      description: 'Can view records',
    },
  },
}
