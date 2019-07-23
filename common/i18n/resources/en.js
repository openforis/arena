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
    of: 'of',
    required: 'Required',
    reset: 'Reset',
    srs: 'SRS',
    type: 'Type',
    undefinedName: 'Undefined name',
    upload: 'Upload',
    view: 'View',
    yes: 'Yes',
  },

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

  sidebar: {
    openForisShort: 'OF',
    openForis: 'Open Foris',
    logout: 'Logout',
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
  },

  usersView: {
    inviteUser: 'Invite',
  },

  itemsTable: {
    unused: 'Unused',
    noItemsAdded: 'No items added',
  },

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
  },

  designerView: {
    formPreview: 'Form preview',
  },

  languagesEditor: {
    languages: 'Language(s)',
  },

  expressionEditor: {
    and: 'AND',
    or: 'OR',
    group: 'Group',
    var: 'Var',
    const: 'Const',
  },

  surveyForm: {
    showPageNav: 'Show pages',
    hidePageNav: 'Hide pages',
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
      scientificName: 'Scientific Name',
      vernacularName: 'Vernacular Name',
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
      scientificName: 'Scientific name',
    },
  },

  categoryEdit: {
    categoryName: 'Category name',
    addLevel: 'Add level',
    level: 'Level',
    confirmDelete: 'Delete the item with all children? $t(common.cantUndoWarning)',
    deleteItem: 'Delete item',
  },

  jobs: {
    CategoriesImportJob: 'Categories Import',
    CategoriesValidationJob: 'Categories Validation',
    CollectImportJob: 'Collect Import',
    CollectSurveyReaderJob: 'Collect Survey Reader',
    EntitiesUniquenessValidationJob: 'Entities Uniqueness Validation',
    NodeDefsImportJob: 'Node Defs Import',
    NodeDefsValidationJob: 'Node Defs Validation',
    RecordCheckJob: 'Record Check',
    RecordsImportJob: 'Records Import',
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

  formErrors: {
    defaultValuesNotSpecified: 'Default value not specified',
    duplicate: 'Duplicate',
    duplicateEntity: 'Duplicate entity',
    duplicateRecord: 'Duplicate record key',
    empty: '$t(common.empty)',
    exceedingMax: 'Exceeding max',
    invalidName: 'Invalid name',
    invalidNumber: 'Invalid number',
    invalidType: 'Invalid type',
    invalidValue: 'Invalid value',
    keyword: 'Keyword',
    maxCountNodesExceeded: 'Nodes must be less than or equal to {{maxCount}}',
    minCountNodesNotReached: 'Nodes must be more than or equal to {{minCount}}',
    required: '$t(common.required)',
    zeroOrNegative: 'Zero or negative',
  },

  jobErrors: {
    generic: '{{text}}',
    empty: '$t(common.empty)',
    duplicateRows: 'row: {{row}} duplicate row: {{duplicateRow}}',
    duplicateName: 'Duplicate scientific name {{scientificName}}; $t(jobErrors.duplicateRows)',
    duplicateCode: 'Duplicate code {{code}}; $t(jobErrors.duplicateRows)',
    defaultValuesNotSpecified: '$t(formErrors.defaultValuesNotSpecified)',
  },

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
  },

  systemErrors: {
    somethingWentWrong: 'Oooops! Something went wrong. Try to refresh the page.'
  },

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
  }
}
