module.exports = {
  common: {
    name: 'name',
    add: 'Add',
    delete: 'delete',
    done: 'done',
    cancel: 'cancel',
    cantUndoWarning: 'This operation cannot be undone',
    description: 'Description',
    description_plural: 'Descriptions',
    srs: 'SRS',
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
      areYouSure: 'Are you sure you want to delete this survey?',
      deleteWarining: 'Deleting the **{{surveyName}}** survey will delete all of its data.',
      confirmName: 'Enter this survey’s name to confirm:',
    },
    surveyListView: {
      addNewSurvey: 'Add a new Survey',
      name: 'Name',
      label: 'Label',
      dateCreated: 'Date created',
      dateLastModified: 'Date last modified',
      status: 'Status',
    },
  },

  nodeDefEdit: {
    basic: 'Basic',
    advanced: 'Advanced',
    validations: 'Validations',
    expressionProp: {
      errorMessage: 'Error message',
      errorMessage_plural: 'Error messages',
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
    label: 'Label',
    label_plural: 'Labels',
  },

  surveyForm: {
    formEditActions: {
      preview: 'preview',
    },
    formEntryActions: {
      confirmDemote: 'Are sure you want to demote this record to {{step}}?',
      confirmPromote: `Are sure you want to promote this record to {{step}}?You won't be able to edit it anymore`,
      confirmDelete: 'Are you sure you want to delete this record?\n\n$t(common.cantUndoWarning)',
      closePreview: 'Close preview',
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
      code: 'Code',
      scientificName: 'Scientific Name',
      vernacularName: 'Vernacular Name',
    },
  },
}