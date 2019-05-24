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
  },
  sidebar: {
    openForisShort: 'OF',
    openForis: 'Open Foris',
    logout: 'Logout',
  },

  survey: {
    formDesigner: 'Form Designer',
    categories: 'Categories',
    taxonomies: 'Taxonomies',
  },

  nodeDefsTypes: {
    integer: 'integer',
    decimal: 'decimal',
    text: 'text',
    date: 'date',
    time: 'time',
    boolean: 'boolean',
    code: 'code',
    coordinate: 'coordinate',
    taxon: 'taxon',
    file: 'file',
    entity: 'entity',
  },

  data: {
    records: {
      records: 'Records',
      owner: 'Owner',
      step: 'Step',
      noRecordsAdded: 'No records added',
    },
    rowNum: 'Row #',
    invalidRecord: 'Invalid record',
    dataVis: {
      dataVis: 'Data vis',
      dataSort: {
        orderBy: 'Order by:',
        thenBy: 'Then by:',
        ascending: 'ascending',
        descending: 'descending',
      },
    },
  },

  homeView: {
    mySurveys: 'My Surveys',
    dashboard: 'Dashboard',
    surveyInfo: {
      publish: 'publish',
      viewInfo: 'View info',
      editInfo: 'Edit info',
      collectImportReport: 'Collect Import Report',
      hierarchy: 'Hierarchy',
      confirmPublish: `Do you want to publish this survey? Some operation won't be allowed afterwards.`,
    },
    deleteSurveyDialog: {
      confirmDelete: 'Are you sure you want to delete this survey?',
      deleteWarining: 'Deleting the **{{surveyName}}** survey will delete all of its data.',
      confirmName: 'Enter this survey’s name to confirm:',
    },
    surveyListTable: {
      addNewSurvey: 'Add a new Survey',
      status: 'Status',
    },
    surveyCreate: {
      createSurvey: 'Create Survey',
      importFromCollect: 'Import from Collect',
    },
    collectImportReport: {
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
      type: 'type',
      name: 'name',
      key: 'key',
      multiple: 'multiple',
      displayAs: 'display as',
      displayIn: 'display in',
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
    hierarchy: 'Hierarchy',
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
      preview: 'preview',
    },
    formEntryActions: {
      confirmDemote: 'Are sure you want to demote this record to {{name}}?',
      confirmPromote: `Are sure you want to promote this record to {{name}}?\n\nYou won't be able to edit it anymore`,
      confirmDelete: 'Are you sure you want to delete this record?\n\n$t(common.cantUndoWarning)',
      closePreview: 'Close preview',
      step: 'Step {{id}} ({{name}})',
    },
    nodeDefEditFormActions: {
      columns: 'columns',
      confirmDelete: 'Are you sure you want to permanently delete this node definition?\n\n$t(common.cantUndoWarning)',
    },
    nodeDefNavigation: {
      subPage: 'sub page',
    },
    nodeDefCode: {
      buttonCode: 'Button code',
    },
    nodeDefCoordinatee: {
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
      entry: 'entry',
      cleansing: 'cleansing',
      analysis: 'analysis',
    },
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
    CategoriesValidationJob: 'Categories validation',
    CollectImportJob: 'Collect Import',
    CollectSurveyReaderJob: 'Collect Survey Reader',
    NodeDefsImportJob: 'Node Defs Import',
    NodeDefsValidationJob: 'Node Defs Validation',
    RecordCheckJob: 'Record Check',
    RecordsImportJob: 'Records Import',
    RecordsValidationJob: 'Records Validation',
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
}