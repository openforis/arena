module.exports = {

  common: {
    name: 'Name',
    label: 'Label',
    add: 'Add',
    new: 'New',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    done: 'Done',
    close: 'Close',
    cancel: 'Cancel',
    dateCreated: 'Date created',
    dateLastModified: 'Date last modified',
    cantUndoWarning: 'This operation cannot be undone',
    description: 'Description',
    description_plural: 'Descriptions',
    srs: 'SRS',
    error: 'error',
    error_plural: 'Errors',
    item: 'Item',
    item_plural: 'Items',
    errorMessage: 'Error message',
    errorMessage_plural: 'Error messages',
    invalid: 'INVALID',
    language: 'Language',
    code: 'Code',
    csvImport: 'CSV Import',
    csvExport: 'CSV Export',
    undefinedName: 'Undefined name',
    empty: 'Empty',
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
      type: 'Type',
      expression: 'Expression',
      messages: 'Messages',
      resolved: 'Resolved',
    },
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
      type: 'Type',
      name: 'Name',
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
      readOnly: 'readOnly',
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
      required: 'Required',
      expressions: 'Expressions',
    },
  },

  designerView: {
    formPreview: 'Form preview',
  },

  languagesEditor: {
    languages: 'Language(s)',
  },

  labelsEditor: {
    label_plural: 'Labels',
  },

  surveyForm: {
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
    nodeDefNavigation: {
      subPage: 'sub page',
    },
    nodeDefCode: {
      buttonCode: 'Button code',
    },
    nodeDefCoordinate: {
      x: 'X',
      y: 'Y',
      srs: 'SRS',
    },
    nodeDefEntityForm: {
      confirmDelete: 'Are you sure you want to delete this entity?',
      select: 'Select',
    },
    nodeDefEntityTable: {
      noDataAdded: 'No data added',
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
    invalidValue: 'Invalid value',
    keyword: 'Keyword',
    maxCountNodesExceeded: 'Nodes must be less than or equal to {{maxCount}}',
    minCountNodesNotReached: 'Nodes must be more than or equal to {{minCount}}',
    required: 'Required',
    zeroOrNegative: 'Zero or negative',
  },
  jobErrors: {
    generic: '{{text}}',
    empty: '$t(common.empty)',
    duplicateRows: 'row: {{row}} duplicate row: {{duplicateRow}}',
    duplicateName: 'Duplicate scientific name {{scientificName}}; $t(jobErrors.duplicateRows)',
    duplicateCode: 'Duplicate code {{code}}; $t(jobErrors.duplicateRows)',
  },
  appErrors: {
    generic: '{{text}}',
    userNotAuthorized: 'User {{userName}} is not authorized',
    undefinedFunction: `Undefined function '{{fnName}}' or wrong parameter types`,
    unsupportedFunctionType: 'Unsupported function type: {{exprType}}',
    jobCanceledOrErrorsFound: 'Job canceled or errors found; rollback transaction',
    entryDataNotFound: 'Entry data not found: {{entryName}}',
    invalidType: 'invalid type {{type}}',
    unableToFindParent: 'Unable to find parent of {{name}}',
    unableToFindNode: 'Unable to find node with name {{name}}',
    cannotGetChild: `Cannot get child '{{childName}}' from attribute {{name}}`,
    unableToFindSibling: 'Unable to find sibling with name {{name}}',
    cantUpdateStep: `Can't update step`,
    cannotOverridePublishedTaxa: 'Cannot overwrite published taxa',
    userNotAllowedToChangePref: 'User not allowed to change pref',
    paramIsRequired: 'Param {{param}} is required',
  },
}