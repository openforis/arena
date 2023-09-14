/* eslint-disable camelcase */
import * as ActivityLog from '@common/activityLog/activityLog'

export const enTranslation = {
  common: {
    active: 'Active',
    add: 'Add',
    and: 'and',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Apply',
    aggregateFunction: 'Aggregate function',
    aggregateFunction_plural: 'Aggregate functions',
    avg: 'Average',
    ascending: 'Ascending',
    areaBased: 'area-based',
    back: 'Back',
    baseUnit: 'Base unit',
    cancel: 'Cancel',
    cancelConfirm: `**There are unsaved changes**.

Do you want to ignore them?`,
    cantUndoWarning: 'This operation cannot be undone',
    cantBeDeletedUsedItem: 'This {{item}} is used by some node definitions and cannot be deleted',
    chain: 'Chain',
    chain_plural: 'Chains',
    childrenEmpty: 'Define at least one child item',
    clone: 'Clone',
    close: 'Close',
    cloneFrom: 'Clone from',
    cnt: 'Count',
    code: 'Code',
    collapse: 'Collapse',
    copy: 'Copy',
    csvExport: 'CSV Export',
    csvImport: 'CSV Import',
    cycle: 'Cycle',
    cycle_plural: 'Cycles',
    dateCreated: 'Date created',
    dateLastModified: 'Date last modified',
    delete: 'Delete',
    deleted: 'Deleted!',
    descending: 'Descending',
    description: 'Description',
    description_plural: 'Descriptions',
    details: 'Details',
    dimension: 'Dimension',
    dimension_plural: 'Dimensions',
    done: 'Done',
    download: 'Download',
    draft: 'Draft',
    edit: 'Edit',
    email: 'Email',
    emailSentConfirmation: `An email to {{email}} has been sent.

Please inform the person to check also the Spam/Junk mail folder.`,
    emailSentToSelfConfirmation: `You should have received an email to {{email}}.

Please check also the Spam/Junk mail folder.`,
    empty: 'Empty',
    entity: 'Entity',
    error: 'Error',
    error_plural: 'Errors',
    errorFound: '1 error found',
    errorFound_other: '{{count}} errors found',
    errorMessage: 'Error message',
    errorMessage_plural: 'Error messages',
    expand: 'Expand',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Export',
    exportAll: 'Export all',
    expression: 'Expression',
    false: 'False',
    file: 'File',
    file_plural: 'Files',
    formContainsErrors: 'Form contains errors',
    formContainsErrorsCannotContinue: 'The form contains errors. Please, fix them before continuing.',
    formContainsErrorsCannotSave: 'The form contains errors. Please, fix them before saving.',
    from: 'From',
    goToHomePage: 'Go to Home Page',
    group: 'Group',
    help: 'Help',
    hide: 'Hide',
    id: 'id',
    import: 'Import',
    info: 'Info',
    invalid: 'INVALID',
    item: 'Item',
    item_plural: 'Items',
    label: 'Label',
    label_plural: 'Labels',
    language: 'Language',
    language_plural: 'Languages',
    leavePageConfirmMessage: `There are unsaved changes in the form. 

By confirming, all changes will be lost.
Do you want to proceed?`,
    max: 'Maximum',
    med: 'Median',
    manage: 'Manage',
    message_plural: 'Messages',
    measure: 'Measure',
    measure_plural: 'Measures',
    measurePrevSteps: 'Measure Previous Steps',
    measurePrevSteps_plural: 'Measures Previous Steps',
    min: 'Minimum',
    name: 'Name',
    new: 'New',
    next: 'Next',
    no: 'No',
    noItems: `$t(common.no) $t(common.item_plural)`,
    notSpecified: '---Not specified---',
    orderBy: 'Order by',
    of: 'of',
    ok: 'Ok',
    openForis: 'Open Foris',
    openForisShort: 'OF',
    openInNewWindow: 'Open in a new window',
    options: 'Options',
    owner: 'Owner',
    path: 'Path',
    preview: 'Preview Mode',
    previous: 'Previous',
    publish: 'Publish',
    publishConfirm: `#### You are about to publish the survey {{survey}} ####

###### The publishing process will *permanently delete* the following information ###### 
- Labels associated with deleted languages.
- Records associated with deleted cycles.
- Data associated with deleted form fields.

###### After publishing: ###### 
- Form fields cannot be changed from single to multiple and vice versa.
- Category items' codes cannot be changed.
- Category items cannot be deleted.
- Taxonomy codes cannot be changed.
- Taxa cannot be deleted.

**Are you sure you want to continue?**`,
    raiseTicketInSupportForum: `In case of problems please raise a ticket with a tag 'arena' in our <b>Support Forum</b>: $t(links.supportForum)`,
    required: 'Required',
    requiredField: 'required field',
    reset: 'Reset',
    retry: 'Retry',
    save: 'Save',
    saveAndBack: 'Save & Back',
    saved: 'Saved!',
    samplingPolygon: 'Sampling Polygon',
    show: 'Show',
    select: 'Select',
    selected: 'Selected',
    showLabels: 'Show labels',
    showLabelsAndNames: 'Show labels and names',
    showNames: 'Show names',
    srs: 'SRS',
    status: 'Status',
    sum: 'Sum',
    test: 'Test',
    to: 'To',
    true: 'True',
    type: 'Type',
    undefinedName: 'Undefined name',
    unique: 'Unique',
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
    paginator: {
      firstPage: 'First page',
      itemsPerPage: 'Items per page',
      lastPage: 'Last page',
      nextPage: 'Next page',
      previousPage: 'Previous page',
    },
    table: {
      visibleColumns: 'Visible columns',
    },
  },

  confirm: {
    strongConfirmInputLabel: 'To confirm type the following text: **{{strongConfirmRequiredText}}**',
  },

  dropzone: {
    acceptedFilesMessage: '(Only {{acceptedExtensions}} files with a max size of {{maxSize}} will be accepted)',
    error: {
      fileTooBig: 'Selected file is too big',
      invalidFileExtension: 'Invalid file extension: {{extension}}',
    },
    message: 'Drag and drop a file here, or click to select it',
    selectedFile: 'Selected file',
    selectedFile_other: 'Selected files',
  },

  error: {
    pageNotFound: 'Page not found',
  },

  sidebar: {
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
    surveyNew: 'New Survey',
    surveys: 'Surveys',
    templateNew: 'New Template',
    templates: 'Templates',
    usersAccessRequest: 'Users Access Requests',
    collectImportReport: 'Collect Import Report',

    surveyInfo: 'Survey Info',
    designer: 'Survey',
    formDesigner: 'Form Designer',
    surveyHierarchy: 'Hierarchy',
    category: 'Category',
    categories: 'Categories',
    nodeDef: 'Node Definition',
    taxonomy: 'Taxonomy',
    taxonomies: 'Taxonomies',

    data: 'Data',
    record: 'Record',
    records: 'Records',
    recordValidationReport: 'Record validation report',
    explorer: 'Explorer',
    map: 'Map',
    charts: 'Charts',
    export: 'Data Export',
    import: 'Data Import',
    validationReport: 'Validation report',

    users: 'Users',
    user: 'User Profile',
    userPasswordChange: 'Change password',
    userInvite: 'Invite user',
    usersSurvey: 'Users list',
    usersList: 'Users list (all)',

    analysis: 'Analysis',
    chain: 'Chain',
    chain_plural: 'Chains',
    virtualEntity: 'Virtual Entity',
    entities: 'Virtual entities',
    virtualEntity_plural: '$t(appModules.entities)',
    instances: 'Instances',

    help: 'Help',
    about: 'About',
    disclaimer: 'Disclaimer',
    userManual: 'User Manual',
  },

  surveyDefsLoader: {
    requireSurveyPublish: 'This section is available only when survey is published',
  },

  loginView: {
    yourName: 'Your name',
    yourEmail: 'Your email',
    yourPassword: 'Your password',
    yourNewPassword: 'Your new password',
    repeatYourPassword: 'Repeat your password',
    repeatYourNewPassword: 'Repeat your new password',
    requestAccess: 'New to $t(common.appNameFull)? Request access',
    resetPassword: 'Reset password',
    login: 'Login',
    forgotPassword: 'Forgot password',
    sendPasswordResetEmail: 'Send password reset email',
  },

  accessRequestView: {
    error: 'Error requesting access: {{error}}',
    fields: {
      email: '$t(common.email)',
      props: {
        firstName: 'First Name',
        lastName: 'Last Name',
        institution: 'Institution',
        country: 'Country',
        purpose: 'What do you need it for?',
        surveyName: 'Propose a Survey Name',
        templateUuid: 'Start from a template?',
      },
    },
    introduction: `Our resources are limited, so you have to request access to the platform.
We are also interested in what you want to do with it so please let us know!
You have the possibility to start from a **new blank survey** or clone an existing **template** and you will have to suggest a name for the newly created survey.
You will be assigned the role of ***Survey Administrator*** for that survey: you will be able to edit it and to invite new users to join your survey and contribute to it.
You will be also a ***Survey Manager*** and you will be able to **create new surveys** (up to 5) if needed.
For more information please visit our website: $t(links.openforisArenaWebsite)
$t(common.raiseTicketInSupportForum)
**Once you send the request, please wait for an invitation email to access Arena.**`,
    reCaptchaNotAnswered: 'ReCaptcha not answered',
    requestSent: 'Access Request sent correctly',
    requestSentMessage: `Please give us a couple of days to process your request.
We will send soon an email to **{{email}}** with the instructions on how to access $t(common.appName).
Thank you and enjoy **$t(common.appNameFull)**!`,
    sendRequest: 'Send Request',
    sendRequestConfirm: 'Request access to $t(common.appNameFull)?',
    templateNotSelected: 'Not selected (start from scratch)',
    title: 'Requesting access to $t(common.appNameFull)',
  },

  resetPasswordView: {
    title: {
      completeRegistration: 'Complete your registration to Arena',
      setYourNewPassword: 'Set your new password',
    },
    setNewPassword: 'Set new password',
    forgotPasswordLinkInvalid: 'The page you have tried to access does not exist or is no longer valid',
    passwordSuccessfullyReset: 'Your password has been successfully reset',
    passwordStrengthChecksTitle: 'Password strength checks',
    passwordStrengthChecks: {
      noWhiteSpaces: 'No white spaces',
      atLeast8CharactersLong: 'At least 8 characters long',
      containsLowerCaseLetters: 'Contains lowercase letters',
      containsUpperCaseLetters: 'Contains uppercase letters',
      containsNumbers: 'Contains numbers',
    },
    completeRegistration: 'Complete registration',
  },

  homeView: {
    dashboard: {
      exportWithData: 'Export with data',
      exportWithDataNoActivityLog: 'Export with data (NO Activity Log)',
      surveyPropUpdate: {
        main: `<title>Welcome to Arena</title>
  
        <p>First you need to set the <strong>name</strong> and <strong>label</strong> of the survey.</p>
        
        <p>Click below on <linkWithIcon> $t(homeView.surveyInfo.editInfo)</linkWithIcon>or into the survey name:<basicLink>{{surveyName}}</basicLink></p>
        `,
        secondary: `
        <p>If the name and label are right then create the first attribute
        <linkWithIcon>Survey \u003E Form Designer</linkWithIcon>
        </p>
        `,
      },
      nodeDefCreate: {
        main: `<title>Let's create the first attribute of {{surveyName}} </title>
        
        <p>Go to <linkWithIcon>Survey \u003E Form Designer</linkWithIcon></p>
        <br />
        `,
      },
      activeSurveyNotSelected: `<title>Active survey not selected</title>
        <p><label>Please select one from the</label><linkToSurveys>List of Surveys</linkToSurveys> or <linkToNewSurvey>Create a new one</linkToNewSurvey></p>`,
    },
    surveyDeleted: 'Survey {{surveyName}} has been deleted',
    surveyInfo: {
      advancedFunctions: 'Advanced functions',
      confirmDeleteCycleHeader: 'Delete this cycle?',
      confirmDeleteCycle: `Are you sure you want to delete the cycle {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
If there are records associated to this cycle, they will be deleted.`,
      cycleForArenaMobile: 'Cycle for Arena Mobile',
      editInfo: 'Edit info',
      viewInfo: 'View info',
      preferredLanguage: 'Preferred language',
      sampleBasedImageInterpretation: 'Sample-based image interpretation',
      srsPlaceholder: 'Type code or label',
      unpublish: 'Unpublish and delete data',
      unpublishSurveyDialog: {
        confirmUnpublish: 'Are you sure you want to unpublish this survey?',
        unpublishWarning: `Unpublishing the **{{surveyName}}** survey will delete all of its data.\n\n
  
  $t(common.cantUndoWarning)`,
        confirmName: 'Enter this survey’s name to confirm:',
      },
    },
    deleteSurveyDialog: {
      confirmDelete: 'Are you sure you want to delete this survey?',
      deleteWarning: `Deleting the **{{surveyName}}** survey will delete all of its data.\n\n

$t(common.cantUndoWarning)`,
      confirmName: 'Enter this survey’s name to confirm:',
    },
    surveyList: {
      active: '$t(common.active)',
      activate: 'Activate',
    },
    surveyCreate: {
      createSurvey: 'Create Survey',
      createTemplate: 'Create Template',
      newSurvey: 'New Survey',
      newSurveyFromScratch: 'New Survey From Scratch',
      newTemplate: 'New Template',
      newTemplateFromScratch: 'New Template From Scratch',
      source: {
        label: 'Source',
        arena: 'Arena (.zip)',
        collect: 'Collect (.collect, .collect-backup, .collect-data)',
      },
      startImport: 'Start import',
      survey: 'Survey',
      survey_other: 'Surveys',
      template: 'Template',
      template_other: 'Templates',
      error: 'Error creating new survey',
      errorMaxSurveysCountExceeded: `Error creating survey; please check that the maximum number of surveys that you can creeate ({{maxSurveysCount}}) has not been exceeded.`,
      options: {
        includeData: 'Include data',
      },
    },
    collectImportReport: {
      excludeResolvedItems: 'Exclude resolved items',
      expression: 'Expression',
      resolved: 'Resolved',
      exprType: {
        applicable: '$t(nodeDefEdit.advancedProps.relevantIf)',
        codeParent: 'Parent code',
        defaultValue: 'Default value',
        validationRule: 'Validation rule',
      },
      title: 'Collect Import Report',
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

  activityLogView: {
    recentActivity: 'Recent activity',
    messages: {
      // Survey
      [ActivityLog.type.surveyCreate]: 'created the survey',
      [ActivityLog.type.surveyPropUpdate]: 'updated survey {{key}}',
      [ActivityLog.type.surveyPublish]: 'published the survey',
      [ActivityLog.type.surveyCollectImport]: 'imported the survey from Collect',

      // NodeDef
      [ActivityLog.type.nodeDefCreate]: 'added node definition {{type}} in entity {{parentName}}',
      [ActivityLog.type.nodeDefUpdate]: 'updated {{keys}} of node definition {{name}}',
      [ActivityLog.type.nodeDefMarkDeleted]: 'deleted node definition {{name}}',

      // Category
      [ActivityLog.type.categoryInsert]: 'added category',
      [ActivityLog.type.categoryPropUpdate]: 'updated {{key}} of category {{categoryName}}',
      [ActivityLog.type.categoryDelete]: 'deleted category {{categoryName}}',
      [ActivityLog.type.categoryLevelInsert]: 'added level at index {{index}} to category {{categoryName}}',
      [ActivityLog.type.categoryLevelPropUpdate]: 'updated level {{index}} {{key}} of category {{categoryName}}',
      [ActivityLog.type.categoryLevelDelete]: 'deleted level {{index}} of category {{categoryName}}',
      [ActivityLog.type.categoryItemInsert]: 'added item to level {{levelIndex}} of category {{categoryName}}',
      [ActivityLog.type.categoryItemPropUpdate]: 'updated item {{code}} {{key}} of category {{categoryName}}',
      [ActivityLog.type.categoryItemDelete]:
        'deleted item {{code}} at level {{levelIndex}} of category {{categoryName}}',
      [ActivityLog.type.categoryImport]: 'imported CSV file to category {{categoryName}}',

      // Taxonomy
      [ActivityLog.type.taxonomyCreate]: 'added taxonomy',
      [ActivityLog.type.taxonomyPropUpdate]: 'updated {{key}} of taxonomy {{taxonomyName}}',
      [ActivityLog.type.taxonomyDelete]: 'deleted taxonomy {{taxonomyName}}',
      [ActivityLog.type.taxonomyTaxaImport]: 'imported CSV file to taxonomy {{taxonomyName}}',
      [ActivityLog.type.taxonInsert]: 'added taxon to taxonomy {{taxonomyName}}',

      // Record
      [ActivityLog.type.recordCreate]: 'added record',
      [ActivityLog.type.recordDelete]: 'deleted record {{keys}}',
      [ActivityLog.type.recordStepUpdate]: 'updated record {{keys}} step from {{stepFrom}} to {{stepTo}}',

      // Node
      [ActivityLog.type.nodeCreate]: 'added node {{name}} in {{parentPath}} to record {{recordKeys}}',
      [ActivityLog.type.nodeValueUpdate]: 'updated node {{name}} in {{parentPath}} of record {{recordKeys}}',
      [ActivityLog.type.nodeDelete]: 'deleted node {{name}} from record {{recordKeys}}',

      // User
      [ActivityLog.type.userInvite]: 'invited user {{email}} with role {{groupName}}',
      [ActivityLog.type.userUpdate]: 'updated user {{name}}',
      [ActivityLog.type.userRemove]: 'removed user {{name}} from survey',

      // Analysis
      [ActivityLog.type.chainCreate]: 'added processing chain',
      [ActivityLog.type.chainPropUpdate]: 'updated {{key}} of processing chain {{label}}',
      [ActivityLog.type.analysisNodeDefPropUpdate]:
        'updated {{key}} to {{value}} of calculated node definition {{name}}',
      [ActivityLog.type.chainStatusExecSuccess]: 'successfully executed processing chain {{label}}',
      [ActivityLog.type.chainDelete]: 'deleted processing chain {{label}}',
    },
  },

  designerView: {
    formPreview: 'Form preview',
  },

  recordView: {
    justDeleted: 'This record has just been deleted',
    sessionExpired: 'Record session has expired',
    errorLoadingRecord: 'Error loading record: {{details}}',
    recordNotFound: 'Record not found',
  },

  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Delete this custom aggregate function?',
      sqlExpression: 'SQL Expression',
    },
    editRecord: 'Edit record',
  },

  dataExportView: {
    options: {
      header: '$t(common.options)',
      includeCategoryItemsLabels: 'Include category items labels',
      includeCategories: 'Include categories',
      includeAnalysis: 'Include result variables',
      includeDataFromAllCycles: 'Include data from all cycles',
      includeFiles: 'Include files',
    },
    startExport: 'Start export',
  },

  dataImportView: {
    confirmDeleteAllRecords: 'Delete all records before import?',
    confirmDeleteAllRecordsInCycle: 'Delete all records in the cycle {{cycle}} before import?',
    deleteAllRecordsBeforeImport: 'Delete all records before import',
    downloadTemplate: 'Download template',
    errors: {
      rowNum: 'Row #',
    },
    forceImportFromAnotherSurvey: 'Force import from another survey',

    importFromArena: 'Arena/Arena Mobile',
    importFromCollect: 'Collect / Collect Mobile',
    importFromCsv: 'CSV',
    importFromCsvStepsInfo: `### Importing steps
1. Select the target entity
2. Download a template
3. Fill in the template and save it (CSV) [UTF-9]
4. Check options
5. Upload the CSV file
6. Validate the file
7. Start import
`,
    importIntoCycle: 'Import into cycle',
    importIntoEntity: 'Import into entity',
    importType: {
      label: 'Import type',
      insertNewRecords: 'Insert new records',
      updateExistingRecords: 'Update existing records',
    },
    jobs: {
      ArenaDataImportJob: {
        importCompleteSuccessfully: `Arena Mobile data import complete:
        - {{processed}} records processed
        - {{insertedRecords}} records created
        - {{updatedRecords}} records updated
        - {{skippedRecords}} records skipped`,
      },
      CollectDataImportJob: {
        importCompleteSuccessfully: `Collect data import complete:
        - {{insertedRecords}} records created`,
      },
      DataImportJob: {
        importCompleteSummary: `
        - {{processed}} rows processed
        - {{updatedValues}} values updated
        - {{insertedRecords}} records created
        - {{updatedRecords}} records updated`,
        importCompleteSuccessfully: `## Import complete:
$t(dataImportView.jobs.DataImportJob.importCompleteSummary)`,
        importCompleteWithErrors: `## Import complete (with errors):
        - {{processed}} rows processed`,
      },
      DataImportValidationJob: {
        validationCompleteWithErrors: `## Validation complete ({{errorsFoundMessage}})
        - {{processed}} rows processed`,
        validationCompleteSuccessfully: `## Validation complete without errors
        - {{processed}} rows processed
        - {{updatedValues}} values would be updated
        - {{insertedRecords}} records would be created
        - {{updatedRecords}} records would be updated`,
      },
    },
    options: {
      header: '$t(common.options)',
      abortOnErrors: 'Abort on errors',
      preventAddingNewEntityData: 'Prevent adding new entity data',
      preventUpdatingRecordsInAnalysis: 'Prevent updating records in Analysis step',
    },
    startImport: 'Start import',
    startImportConfirm: `By pressing 'Ok' you will start the import process.

**It won't be possible to rollback the changes.**

Are you sure you want to continue?`,
    steps: {
      selectImportType: 'Select Import Type',
      selectCycle: 'Select Cycle',
      selectEntity: 'Select Entity',
      selectFile: 'Select File',
      startImport: 'Start import',
    },
    validateFile: 'Validate file',
    validateFileInfo:
      'The validation process checks that the file contains valid data according to the data type of each attribute.',
  },

  dataView: {
    aggregateMode: 'Aggregate Mode',
    editSelectedRecord: 'Edit selected record',
    editMode: 'Edit Mode',
    filterAttributeTypes: 'Filter attribute types',
    filterRecords: {
      buttonTitle: 'Filter records',
      expressionEditorHeader: 'Expression to filter records',
    },
    invalidRecord: 'Invalid record',
    nodeDefsSelector: {
      hide: 'Hide Node Definitions Selector',
      show: 'Show Node Definitions Selector',
    },
    records: {
      clone: 'Clone',
      confirmDeleteRecord: `Delete the record "{{keyValues}}"?`,
      confirmDeleteSelectedRecord_one: `Delete the selected record?`,
      confirmDeleteSelectedRecord_other: `Delete the selected {{count}} records?`,
      confirmUpdateRecordsStep: `Move all the records from the {{stepFrom}} to {{stepTo}}?`,
      deleteRecord: 'Delete record',
      demoteAllRecordsFromAnalysis: 'Analysis -> Cleansing',
      demoteAllRecordsFromCleansing: 'Cleansing -> Entry',
      editRecord: 'Edit record',
      filterPlaceholder: 'Filter by keys or owner',
      viewRecord: 'View record',
      owner: 'Owner',
      step: 'Step',
      noRecordsAdded: 'No records added',
      noRecordsAddedForThisSearch: 'No records found',
      promoteAllRecordsToAnalysis: 'Cleansing -> Analysis',
      promoteAllRecordsToCleansing: 'Entry -> Cleansing',
      updateRecordsStep: 'Update records step',
    },
    recordsClone: {
      title: 'Records clone',
      fromCycle: 'From cycle',
      toCycle: 'To cycle',
      confirmClone: `Clone records from cycle {{cycleFrom}} to cycle {{cycleTo}}?\n
(Only records not already in cycle {{cycleTo}} will be cloned)`,
      startCloning: 'Start cloning',
      cloneComplete: 'Clone complete. {{recordsCloned}} records cloned from {{cycleFrom}} to {{cycleTo}}',
      error: {
        cycleToMissing: 'Please select "To cycle"',
        cycleToMustBeDifferentFromCycleFrom: '"To cycle" must be different from "From cycle"',
      },
      source: {
        label: 'Source',
        allRecords: 'All records in cycle {{cycleFrom}} not already in cycle {{cycleTo}}',
        selectedRecords: 'Only the selected {{selectedRecordsCount}} records',
      },
    },
    recordDeleted_one: `Record deleted successfully!`,
    recordDeleted_other: `{{count}} records deleted successfully!`,
    recordsUpdated: '{{count}} records updated successfully!',
    rowNum: 'Row #',
    showValidationReport: 'Show validation report',
    sort: 'Sort records',
    dataVis: {
      errorLoadingData: 'Error loading data',
      noData: 'This query returned no data',
    },
  },

  mapView: {
    createRecord: 'Create new record',
    editRecord: 'Edit record',
    recordEditModalTitle: 'Record: {{keyValues}}',
    altitude: 'Altitude (m)',
    locationEditInfo: 'Double click on the map or drag the marker to update the location',
    locationUpdated: 'Location updated',
    openInEarthMap: 'Open in Earth Map',
    options: {
      showLocationMarkers: 'Show location markers',
      showMarkersLabels: `Show markers' labels`,
      showSamplingPolygon: `Sampling polygon`,
      showControlPoints: `Control points`,
      showPlotReferencePoint: `Plot reference point`,
    },
    samplingPointDataLayerName: 'Sampling point data - level {{levelIndex}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (loading...)',
    samplingPointItemPopup: {
      title: 'Sampling Point Item',
      location: 'Location',
      levelCode: 'Level {{level}} code',
    },
    selectedPeriod: 'Selected period',
  },

  samplingPolygonOptions: {
    circle: 'Circle',
    controlPointOffsetEast: 'Reference Point Offset East (m)',
    controlPointOffsetNorth: 'Reference Point Offset North (m)',
    lengthLatitude: 'Length Latitude (m)',
    lengthLongitude: 'Length Longitude (m)',
    numberOfControlPoints: 'Number of Control Points',
    numberOfControlPointsEast: 'Number of Control Points East',
    numberOfControlPointsNorth: 'Number of Control Points North',
    offsetEast: 'Offset East (m)',
    offsetNorth: 'Offset North (m)',
    radius: 'Radius (m)',
    rectangle: 'Rectangle',
    samplingPolygon: 'Sampling Polygon',
    shape: 'Shape',
  },

  kmlUploader: {
    opacity: 'opacity',
    selectFile: 'Select File',
    title: 'KML/KMZ/Shapefile Options',
  },

  mapBaseLayerPeriodSelector: {
    chooseAPeriodToCompareWith: 'Choose a period to compare with',
    falseColor: 'False Color',
  },

  surveysView: {
    filter: 'Filter',
    filterPlaceholder: 'Name, label or owner',
    noSurveysMatchingFilter: 'No surveys matching the specified filter',
    nodes: 'Nodes',
    chains: 'Chains',
    records: 'Records',
    files: 'Files',
  },

  usersView: {
    inviteUser: 'Invite',
    accepted: 'Accepted',
    updateUserConfirmation: 'User {{name}} has been updated',
    notAcceptedYet: 'Invitation not accepted yet',
    invitedBy: 'Invited by',
    invitedDate: 'Invited date',
    lastLogin: 'Last login',
    moreThan30DaysAgo: 'More than 30 days ago',
    userSurveys: 'User Surveys',
    surveyName: 'Survey name',
    roleInSurvey: 'Role in survey',
    roleInCurrentSurvey: 'Role in current survey',
    userNotInvitedToAnySurvey: `User not invited to any survey`,
    confirmUserWillBeSystemAdmin: 'User will be a system administrator. Continue?',
  },

  usersAccessRequestView: {
    status: {
      ACCEPTED: 'Accepted',
      CREATED: 'Pending',
    },
    acceptRequest: {
      accept: 'Accept',
      acceptRequestAndCreateSurvey: 'Accept request and create survey',
      confirmAcceptRequestAndCreateSurvey:
        'Accept the access request for **{{email}}** as **{{role}}** and create a new survey **{{surveyName}}**?',
      error: 'Error accepting the access request: {{error}}',
      requestAcceptedSuccessfully: 'Access request accepted successfully. $t(common.emailSentConfirmation)',
      surveyLabel: 'Survey label',
      surveyLabelInitial: '(Change survey name and label as needed)',
      surveyName: 'Survey Name',
      role: 'Role',
      template: 'Template',
    },
  },

  userView: {
    scale: 'Scale',
    rotate: 'Rotate',
    dragAndDrop: 'Drop an image above or',
    upload: 'click here to upload',
    sendNewInvitation: 'Send new invitation',
    removeFromSurvey: 'Remove from survey',
    confirmRemove: 'Are you sure you want to revoke access to {{user}} from survey {{survey}}?',
    removeUserConfirmation: 'User {{user}} has been removed from survey {{survey}}',
  },

  userPasswordChangeView: {
    oldPassword: 'Old password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change password',
    passwordChangedSuccessfully: 'Password changed successfully!',
  },

  userInviteView: {
    confirmInviteSystemAdmin: 'Invite the user {{email}} as System Administrator?',
    groupPermissions: {
      label: 'Permissions',
      systemAdmin: `
        <li>Full system access rights</li>`,
      surveyManager: `
        <li>Surveys: 
          <ul>
            <li>create</li>
            <li>clone</li>
            <li>edit own surveys</li>
            <li>delete own surveys</li>
          </ul>
        </li>
        <li>Users:
          <ul>
            <li>invite users to own surveys</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyAdmin: `
        <li>Surveys: 
          <ul>
            <li>clone</li>
            <li>edit own surveys</li>
            <li>delete own surveys</li>
          </ul>
        </li>
        <li>Users:
          <ul>
            <li>invite users to own surveys</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      surveyEditor: `
        <li>Surveys: 
          <ul>
            <li>edit own surveys</li>
          </ul>
        </li>
        $t(userInviteView.groupPermissions.dataAnalyst)`,
      dataAnalyst: `
        <li>Data: 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
            <li>access Map tool</li>
          </ul>
        </li>
        <li>Analysis:
          <ul>
            <li>full access rights to all tools</li>
          </ul>
        </li>`,
      dataCleanser: `
        <li>Data: 
          <ul>
            $t(userInviteView.groupPermissions.dataCleanserData)
          </ul>
        </li>`,
      dataCleanserData: `
        $t(userInviteView.groupPermissions.dataEditorData)
        <li>access data Validation tools</li>
        <li>submit records to “Analysis” phase</li>`,
      dataEditor: `
        <li>Data: 
          <ul>$t(userInviteView.groupPermissions.dataEditorData)</ul>
        </li>`,
      dataEditorData: `
        <li>add new records (own surveys)</li>
        <li>edit existing records (own surveys)</li>
        <li>submit records to “Cleansing” phase</li>`,
    },
    messageOptional: 'Message (optional)',
    messageInfo: `The message will appear in the email sent to the user. 
It can be simple text or Markdown language (https://www.markdownguide.org).`,
    sendInvitation: 'Send invitation',
    surveyNotPublishedWarning: `**Warning**: survey is not published.
      Users can be invited only with the roles of ***$t(authGroups.systemAdmin.label)*** and ***$t(authGroups.surveyAdmin.label)***.
      If you want to invite users with other roles you should first publish the survey.`,
  },

  user: {
    mapApiKeys: {
      title: 'Map API Keys',
      mapProviders: {
        planet: 'Planet',
      },
      keyIsCorrect: 'This API key is valid',
      keyIsNotCorrect: 'This API key is NOT valid',
    },
    title: 'Title',
    titleValues: {
      mr: 'Mr',
      ms: 'Ms',
      preferNotToSay: 'Prefer not to say',
    },
  },

  chainView: {
    baseUnit: {
      confirmDelete: 'By deleting the base unit, you will uncheck all "area-based variable" selections. Continue?',
    },
    downloadSummaryJSON: 'Download Summary (JSON)',
    formLabel: 'Processing chain label',
    basic: 'Basic',
    records: 'Records',
    recordsInStepCount: '{{recordsCount}} in {{step}} step',
    submitOnlyAnalysisStepDataIntoR: 'Submit only analysis step data to RStudio',
    includeEntitiesWithoutData: 'Include entities without data',
    cannotStartRStudio: {
      common: 'Cannot start RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): there are no records to submit',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): publish the survey first',
    },
    nonResponseBiasCorrection: 'Non-response bias correction',
    nonResponseBiasCorrectionTip: `To implement this method, add 'design_psu' and 'design_ssu' into the stratum category as extra properties.`,
    pValue: 'P-value',
    resultsBackFromRStudio: 'Results read back from RStudio',
    samplingDesign: 'Sampling Design',
    samplingDesignDetails: 'Sampling Design Details',
    samplingStrategyLabel: 'Sampling strategy',
    samplingStrategy: {
      simpleRandom: 'Simple Random Sampling',
      systematic: 'Systematic Sampling',
      stratifiedRandom: 'Stratified Random Sampling',
      stratifiedSystematic: 'Stratified Systematic Sampling',
    },
    statisticalAnalysis: {
      header: 'Statistical analysis',
      entityToReport: 'Entity to report',
      entityWithoutData: 'The entity {{name}} has no data',
      filter: 'Filter (R script)',
      reportingMethod: 'Reporting method',
      reportingMethods: {
        dimensionsCombined: 'Combination of dimensions',
        dimensionsSeparate: 'Dimensions separately',
      },
      reportingArea: 'Total reporting area (ha) (Optional)',
    },
    stratumAttribute: 'Stratum attribute',
    postStratificationAttribute: 'Post stratification attribute',
    areaWeightingMethod: 'Area Weighting Method',
    clusteringEntity: 'Clustering entity',
    clusteringOnlyVariances: 'Clustering only for variances',
    errorNoLabel: 'Chain should have a valid Label',
    dateExecuted: 'Date executed',
    deleteChain: 'Delete chain',
    deleteConfirm: `Delete this processing chain?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Processing chain deleted',
    cannotSelectNodeDefNotBelongingToCycles: `The node definition "{{label}}" cannot be selected because it doesn't belong to all cycles of the processing chain`,
    cannotSelectCycle: 'This cycle cannot be selected because some node definitions do not belong to this cycle',
    copyRStudioCode: `#### You are about to open an RStudio Server ####  

##### Click the OK button and these commands will be copied to your clipboard. #####  

###### RStudio Server will be opened; once the RStudio console is active, paste and run the following lines to import the chain code: ######  

{{rStudioCode}}
`,
    copyRStudioCodeLocal: `#### Processing chain to RStudio ####  

###### Click the OK button and these commands will be copied to your clipboard. ######  

###### Start RStudio in your machine (you should have package 'rstudioapi' installed). ######  

###### Once the RStudio console is active, paste and run the following lines to import the chain code: ######  


{{rStudioCode}}

`,
    entities: {
      new: 'Virtual entity',
    },
    reportingDataCategory: 'Category table name',
    reportingDataAttribute: 'Attribute for {{level}}',
    reportingDataTableAndJoinsWithAttributes: 'Reporting data table and joins with attributes',
    samplingNodeDefs: 'Sampling NodeDefs',
  },

  instancesView: {
    title: 'Instances',
    terminate: 'Terminate',
  },
  chain: {
    quantitative: 'Quantitative',
    categorical: 'Categorical',
    emptyNodeDefs: '$t(validationErrors.analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'the entity and all the related result variables will be excluded in the RStudio scripts',
    entityWithoutData: 'Entity {{name}} has no data; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'Entity {{name}} is not available in the selected cycle; $t(chain.entityExcludedInRStudioScripts)',
  },

  itemsTable: {
    unused: 'Unused',
    noItemsAdded: 'No items added',
  },

  expression: {
    identifierNotFound: 'Attribute or entity "{{name}}" not found',
    invalid: 'Invalid expression: {{details}}',
    undefinedFunction: 'Undefined function: {{name}}',
    functionHasTooFewArguments: 'Function {{fnName}} requires at least {{minArgs}} (got {{numArgs}})',
    functionHasTooManyArguments: 'Function {{fnName}} only accepts at most {{maxArgs}} (got {{numArgs}})',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
About
========

$t(common.appNameFull)
--------
 
 * Developed by: $t(links.openforis)
 * Version: {{version}}
 * Support Forum: $t(links.supportForum)
 * Arena in GitHub: <a href="https://github.com/openforis/arena" target="_blank">https://github.com/openforis/arena</a>
 * Arena R Scripts in GitHub: <a href="https://github.com/openforis/arena-r" target="_blank">https://github.com/openforis/arena-r</a>
`,
    },
  },

  // ====== Survey views

  nodeDefEdit: {
    additionalFields: 'Additional fields',
    basic: 'Basic',
    advanced: 'Advanced',
    validations: 'Validations',
    function: 'Function',
    editorHelp: {
      json: 'Valid expressions are a subset of Javascript.',
      sql: 'Only valid SQL expressions are allowed.',
    },
    editorCompletionHelp: '- Show the available variables and functions that can be used',
    functionDescriptions: {
      categoryItemProp:
        'Returns the value of the specified $t(extraProp.label) of a category item having the specified code',
      distance: 'Returns the distance (in meters) between the specified coordinates',
      includes: 'Returns true if the specified multiple attribute includes the specified value.',
      index: 'Returns the index of the context node among its siblings',
      isEmpty: 'Returns true if the argument has no value specified',
      ln: 'Take the natural logarithm of x',
      log10: 'Take the base 10 logarithm of x',
      max: 'Take the maximum of the arguments',
      min: 'Take the minimum of the arguments',
      now: 'Returns the current date or time',
      parent: 'Returns the parent entity of the specified node',
      pow: 'Raise a number X to the power P',
      // SQL functions
      avg: 'Returns the average value of a numeric variable',
      count: 'Returns the number of rows that matches a specified criterion',
      sum: 'Returns the total sum of a numeric variable',
      taxonProp: 'Returns the value of the specified $t(extraProp.label) of a taxon having the specified code',
    },
    basicProps: {
      analysis: 'Analysis',
      displayAs: 'Display as',
      displayIn: 'Display in',
      entitySource: 'Entity Source',
      enumerate: {
        label: 'Enumerate',
        info: `The rows will be automatically generated using the category items associated to a code attribute marked as Key defined inside the entity; rows cannot be added or deleted and the key code attribute won't be editable`,
      },
      enumerator: {
        label: 'Enumerator',
        info: 'The items in the category will be used to generate the rows of the parent entity',
      },
      form: 'Form',
      formula: 'Formula',
      key: 'Key',
      multiple: 'Multiple',
      ownPage: 'Its own page',
      parentPage: 'Parent page ({{parentPage}})',
      table: 'Table',
    },
    advancedProps: {
      areaBasedEstimate: 'Area-based estimate',
      defaultValues: 'Default values',
      defaultValueEvaluatedOneTime: 'Default value evaluated only one time',
      hidden: 'Hide in entry form',
      hiddenInMobile: 'Hidden in Arena Mobile',
      hiddenWhenNotRelevant: 'Hidden when not relevant',
      itemsFilter: 'Items filter',
      itemsFilterInfo: `Expression used to filter selectable items.
In the expression, the word "this" will refer to the item itself. 
E.g. this.region = region_attribute_name 
(where "region" is the name of an extra property defined for the item and region_attribute_name is the name of an attribute in the survey)`,
      readOnly: 'Read only',
      relevantIf: 'Relevant if',
      script: 'Script',
    },
    decimalProps: {
      maxNumberDecimalDigits: 'Max number of decimal digits',
    },
    fileProps: {
      numberOfFiles: 'Go to Validations to change the Min. and Max. number of files.',
      maxFileSize: 'Max. file size (Mb)',
      fileType: 'File type',
      fileTypes: {
        image: 'Image',
        video: 'Video',
        audio: 'Audio',
        other: 'Other',
      },
    },
    textProps: {
      textInputType: 'Text input type',
      textInputTypes: {
        singleLine: 'Single line',
        multiLine: 'Multi line',
      },
      textTransform: 'Text transform',
      textTransformTypes: {
        none: 'none',
        capitalize: 'capitalize',
        uppercase: 'uppercase',
        lowercase: 'lowercase',
      },
    },
    booleanProps: {
      labelValue: 'Label value',
      labelValues: {
        trueFalse: '$t(common.true)/$t(common.false)',
        yesNo: '$t(common.yes)/$t(common.no)',
      },
    },
    codeProps: {
      category: 'Category',
      codeShown: 'Show code',
      displayAs: 'Display As',
      displayAsTypes: {
        checkbox: 'Checkbox',
        dropdown: 'Dropdown',
      },
      parentCode: 'Parent Code',
    },
    coordinateProps: {
      allowOnlyDeviceCoordinate: 'Allow only device coordinate',
      allowOnlyDeviceCoordinateInfo: `It applies only to Arena Mobile: if checked, the user won't be able to modify the X/Y values, but only device GPS can be used to get them`,
    },
    expressionsProp: {
      expression: 'Expression',
      applyIf: 'Apply If',
      confirmDelete: 'Delete this expression?',
      severity: 'Severity',
    },
    validationsProps: {
      minCount: 'Min count',
      maxCount: 'Max count',
      expressions: 'Expressions',
    },
    cannotChangeIntoMultipleWithDefaultValues:
      'This node cannot be converted to multiple because it has default values.',
    cannotDeleteNodeDefReferenced: `Cannot delete "{{nodeDef}}": it's referenced by these node definitions: {{nodeDefDependents}}`,
    cloneDialog: {
      confirmButtonLabel: 'Clone',
      title: 'Cloning node definition "{{nodeDefName}}"',
      entitySelectLabel: 'Entity to clone into:',
    },
    moveDialog: {
      confirmButtonLabel: 'Move',
      title: 'Moving node definition "{{nodeDefName}}"',
      entitySelectLabel: 'Entity to move into:',
    },
    movedNodeDefinitionHasErrors: 'The node definition "{{nodeDefName}}" you have moved has errors; please fix them.',
    nodeDefintionsHaveErrors: 'These node definitions have errors: {{nodeDefNames}}. Please fix them.',
  },

  languagesEditor: {
    languages: 'Language(s)',
  },

  surveyForm: {
    subPage: 'Sub page',
    addChildTo: 'Add to {{nodeDefLabel}}',
    addChildToTitle: 'Add new node to {{nodeDefLabel}}',
    addChildToTypes: {
      boolean: 'Boolean',
      code: 'Code',
      coordinate: 'Coordinate',
      date: 'Date',
      decimal: 'Decimal',
      entity: 'Table or form',
      file: 'File',
      integer: 'Integer',
      taxon: 'Taxon',
      text: 'Text',
      time: 'Time',
    },
    clone: `Clone '{{nodeDefLabel}}'`,
    compressFormItems: `Compress form items for '{{nodeDefLabel}}'`,
    delete: `Delete '{{nodeDefLabel}}'`,
    edit: `Edit '{{nodeDefLabel}}'`,
    schemaSummary: 'Schema summary',
    schemaSummaryTitle: 'Export schema summary to CSV',
    hidePages: 'Hide pages',
    showPages: 'Show pages',
    move: `Move '{{nodeDefLabel}}'`,
    movePageUp: 'Move page up',
    movePageDown: 'Move page down',
    formEditActions: {
      preview: 'Preview',
    },
    formEntryActions: {
      confirmDemote: 'Are sure you want to demote this record to {{name}}?',
      confirmPromote: `Are sure you want to **promote this record to {{name}}**?  
You won't be able to edit it anymore`,
      confirmPromoteWithErrors: `**This record contains errors**.  
$t(surveyForm.formEntryActions.confirmPromote)`,
      confirmDelete: 'Are you sure you want to delete this record?\n\n$t(common.cantUndoWarning)',
      closePreview: 'Close preview',
      demoteTo: 'Demote to {{stepPrev}}',
      promoteTo: 'Promote to {{stepNext}}',
      step: 'Step {{id}} ({{name}})',
    },
    nodeDefEditFormActions: {
      columns: 'Columns',
      confirmDelete:
        'Are you sure you want to permanently delete this node definition: {{ name }}?\n\n$t(common.cantUndoWarning)',
    },
    nodeDefCode: {
      buttonCode: 'Button code',
      code: '$t(common.code)',
      label: '$t(common.label)',
    },
    nodeDefBoolean: {
      labelValue: {
        trueFalse: {
          true: '$t(common.true)',
          false: '$t(common.false)',
        },
        yesNo: {
          true: '$t(common.yes)',
          false: '$t(common.no)',
        },
      },
    },
    nodeDefCoordinate: {
      coordinate: 'Coordinate',
      srs: 'SRS',
      x: 'X',
      y: 'Y',
      showOnMap: 'Show on map',
      accuracy: 'Accuracy',
      altitude: 'Altitude',
      altitudeAccuracy: 'Altitude accuracy',
    },
    nodeDefEntityForm: {
      addNewEntity: 'Add new {{name}}',
      confirmDelete: 'Are you sure you want to delete this entity?',
      select: 'Select a {{name}}:',
      selectedEntity: 'Selected {{name}}:',
    },
    nodeDefTaxon: {
      code: '$t(common.code)',
      scientificName: 'Scientific name',
      vernacularName: 'Vernacular name',
      visibleFields: 'Visible fields',
    },
    nodeDefFile: {
      errorLoadingPreview: 'Error loading preview',
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
    header: 'Taxonomy',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Delete the taxonomy {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    edit: {
      taxonomyListName: 'Taxonomy list name',
      taxaNotImported: 'Taxa not imported',
      family: 'Family',
      genus: 'Genus',
      scientificName: '$t(surveyForm.nodeDefTaxon.scientificName)',
      extraPropsNotDefined: 'Extra properties not defined for this taxonomy',
    },
    vernacularNameLabel: 'Vernacular name label',
  },

  categoryList: {
    types: {
      flat: 'Flat',
      hierarchical: 'Hierarchical',
      reportingData: 'Reporting Data',
    },
  },

  categoryEdit: {
    header: 'Category',
    addLevel: 'Add level',
    categoryName: 'Category name',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
    cantImportCsvIntoPublishedCategory: 'Cannot import CSV into a published category.',
    confirmDelete: 'Delete the category {{categoryName}}?\n$t(common.cantUndoWarning)',
    confirmDeleteEmptyCategory: 'The category is **empty** and will be deleted. Continue?',
    confirmDeleteLevel: `Delete the category level '{{levelName}}' with all items?\n$t(common.cantUndoWarning)`,
    confirmDeleteItem: `Delete the item?

$t(common.cantUndoWarning)`,
    confirmDeleteItemWithChildren: `Delete the item with all children?

$t(common.cantUndoWarning)`,
    convertToReportingDataCategory: {
      buttonLabel: 'Convert to Reporting Data',
      confirmMessage: `Convert this category to a Reporting Data category?

Levels will be renamed into level_1, level_2... level_N and an extra 'area' property will be added to the items.`,
    },
    convertToSimpleCategory: {
      confirmMessage: `Convert this Reporting Data category to a simple category?`,
    },
    deleteItem: 'Delete item',
    level: 'Level',

    importSummary: {
      columns: 'Column',
      columnTypeSummary: 'Level {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeExtra: '$t(extraProp.label)',
      columnTypeDescription: 'Description ({{language}})',
      columnTypeLabel: 'Label ({{language}})',
      columnType: {
        code: 'code',
        description: 'description',
        label: 'label',
        extra: '$t(extraProp.label)',
      },
      dataType: 'Data Type',
      title: 'Category import summary',
    },
    reportingData: 'Reporting data',
    templateForDataImport: 'Template for data import',
    templateForDataImportGeneric: 'Template for data import (generic)',
    templateForSamplingPointDataImport: 'Template for Sampling Point Data import',
  },

  extraProp: {
    label: 'Extra property',
    label_plural: 'Extra properties',
    dataTypes: {
      geometryPoint: 'Geometry Point',
      number: 'Number',
      text: 'Text',
    },
    editor: {
      title: 'Edit $t(extraProp.label_plural)',
      confirmDelete: 'Delete the extra property "{{name}}"?',
      confirmSave: `Save the changes to the extra properties definitions?

  **Warnings**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Name changed from {{nameOld}} to {{nameNew}}',
        dataTypeChanged: 'Data type changed from {{dataTypeOld}} to {{dataTypeNew}}',
      },
    },
  },

  // ===== All validation errors
  validationErrors: {
    // Common
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
      emptyFile: '$t(validationErrors.dataImport.emptyFile)',
      invalidParentItemOrder: 'Item with codes {{parentItemCodes}} must come before its children',
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
      recordAlreadyExisting: 'Record with keys "{{keyValues}}" already existing',
      recordInAnalysisStepCannotBeUpdated: 'Record with keys "{{keyValues}}" is in Analysis step and cannot be updated',
      recordKeysMissing: 'Missing record key value',
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
      maxFileSizeInvalid: 'Max file size must be greater than 0 and less than {{max}}',
      nameInvalid:
        'Name is invalid (it must contain only lowercase letters, numbers and underscores, starting with a letter)',
      taxonomyRequired: 'Taxonomy is required',
      validationsInvalid: 'Invalid "Validations"',
    },

    record: {
      keyDuplicate: 'Duplicate record key',
      entityKeyDuplicate: 'Duplicate key',
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

    taxonomyEdit: {
      codeChangedAfterPublishing: `Published code has changed: '{{oldCode}}' => '{{newCode}}'`,
      codeDuplicate: 'Duplicate code {{value}}; $t(validationErrors.rowsDuplicate)',
      codeRequired: 'Code is required',
      familyRequired: 'Family is required',
      genusRequired: 'Genus is required',
      scientificNameDuplicate: 'Duplicate scientific name {{value}}; $t(validationErrors.rowsDuplicate)',
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
      emailRequired: '$t(validationErrors.user.emailRequired)',
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
      emailRequired: '$t(validationErrors.user.emailRequired)',
      emailInvalid: '$t(validationErrors.user.emailInvalid)',
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
  },

  // ====== Jobs
  jobs: {
    ActivityLogImportJob: 'Activity Log Import',
    ArenaMobileDataImportJob: 'Arena Mobile Data Import',
    CategoriesImportJob: 'Categories Import',
    CategoriesValidationJob: 'Categories Validation',
    CategoryImportJob: 'Category Import',
    ChainsSamplingNodeDefsCheckJob: 'Processing Chains Sampling Node Definitions Creation',
    ChainsValidationJob: 'Processing Chains Validation',
    ChainsImportJob: 'Chains Import',
    CollectDataImportJob: 'Collect Data Import',
    CollectImportJob: 'Collect Import',
    CollectSurveyReaderJob: 'Collect Survey Reader',
    CyclesDeletedCheckJob: 'Deleted Cycles Check',
    DataImportJob: 'Data Import',
    DataImportValidationJob: 'Data Import File Validation',
    FilesImportJob: 'Files Import',
    NodeDefsImportJob: 'Node Definitions Import',
    NodeDefsValidationJob: 'Node Definitions Validation',
    chainsCyclesCheckJob: `Chains Cycles Check`,
    RecordCheckJob: 'Record Check',
    RecordsCloneJob: 'Records Clone',
    RecordsImportJob: 'Records Import',
    RecordsUniquenessValidationJob: 'Records Uniqueness Validation',
    SamplingPointDataImportJob: 'Sampling Point Data Import',
    SurveyCreatorJob: 'Survey Create',
    SurveyDependencyGraphsGenerationJob: 'Survey Dependency Graph Generation',
    SurveyExportJob: 'Survey Export',
    SurveyIndexGeneratorJob: 'Survey Index Generator',
    SurveyInfoValidationJob: 'Survey Info Validation',
    SurveyPropsPublishJob: 'Survey Props Publish',
    SurveyPublishJob: 'Survey Publish',
    SurveyPublishPerformJob: 'Survey Publish Perform',
    SurveyRdbCreationJob: 'Survey RDB Creation',
    SurveyUnpublishJob: 'Survey Unpublish',
    TaxonomiesImportJob: 'Taxonomies Import',
    TaxonomiesValidationJob: 'Taxonomies Validation',
    TaxonomyImportJob: 'Taxonomy Import',
    // export csv data
    ExportCsvDataJob: 'Export CSV data',
    ZipCreationJob: 'ZIP file Creation',
    CSVDataExtraction: 'Data Export',
    // import arena survey
    ArenaImportJob: 'Arena import',
    ArenaSurveyReaderJob: 'Arena Survey Reader',
    CreateRdbJob: 'Survey RDB Creation',
    UsersImportJob: 'Users Import',
    // clone survey
    SurveyCloneJob: 'Clone survey',
    CloneSurveyJob: 'Clone survey',
    // survey backup
    SurveyInfoExportJob: 'Survey Info Export',
    CategoriesExportJob: 'Categories Export',
    TaxonomiesExportJob: 'Taxonomies Export',
    RecordsExportJob: 'Records Export',
    FilesExportJob: 'Files Export',
    ChainExportJob: 'Chain Export',
    UsersExportJob: 'Users Export',
    ActivityLogExportJob: 'Activity Log Export',
  },

  // ====== App Errors

  appErrors: {
    cannotGetChild: `Cannot get child '{{childName}}' from attribute {{name}}`,
    cannotOverridePublishedTaxa: 'Cannot overwrite published taxa',
    cantUpdateStep: `Can't update step`,
    csv: {
      emptyHeaderFound: 'Empty header found at column {{columnPosition}}',
      emptyHeaders: 'Empty headers found',
    },
    entryDataNotFound: 'Entry data not found: {{entryName}}',
    expression: {
      undefinedFunction: '$t(expression.undefinedFunction)',
    },
    generic: 'Unexpected error: {{text}}',
    importingDataIntoWrongCollectSurvey: 'Importing data into wrong survey. Expected URI: {{collectSurveyUri}}',
    invalidType: 'Invalid type {{type}}',
    jobCanceledOrErrorsFound: 'Job canceled or errors found; rollback transaction',
    paramIsRequired: 'Param {{param}} is required',
    chainCannotBeSaved: 'Chain is invalid and cannot be saved',
    unableToFindParent: 'Unable to find parent of {{name}}',
    unableToFindNode: 'Unable to find node with name {{name}}',
    unableToFindSibling: 'Unable to find sibling with name {{name}}',
    undefinedFunction: `Undefined function '{{fnName}}' or wrong parameter types`,
    invalidSyntax: 'Expression syntax is invalid',
    unsupportedFunctionType: 'Unsupported function type: {{exprType}}',
    functionHasTooFewArguments: 'Function {{fnName}} requires at least {{minArgs}} (got {{numArgs}})',
    functionHasTooManyArguments: 'Function {{fnName}} only accepts at most {{maxArgs}} (got {{numArgs}})',
    record: {
      entityNotFound: 'Entity "{{entityName}}" with keys "{{keyValues}}" not found',
    },
    userHasPendingInvitation: `There's already a pending invitation for the user with email '{{email}}'; he/she cannot be invited to this survey until it's accepted`,
    userHasRole: 'The given user has already a role in this survey',
    userInvalid: 'Invalid user',
    userIsAdmin: 'The given user is already a system administrator',
    userNotAllowedToChangePref: 'User not allowed to change pref',
    userNotAuthorized: 'User {{userName}} is not authorized',
  },

  systemErrors: {
    somethingWentWrong: 'Oooops! Something went wrong. Try to refresh the page.',
  },

  record: {
    ancestorNotFound: 'Ancestor node not found in record',
    keyDuplicate: 'Duplicate record key',
    oneOrMoreInvalidValues: 'One or more values are invalid',
    uniqueAttributeDuplicate: 'Duplicate value',

    attribute: {
      customValidation: 'Invalid value',
      uniqueDuplicate: 'Duplicate value',
      valueInvalid: 'Invalid value',
      valueRequired: 'Required value',
    },
    entity: {
      keyDuplicate: 'Duplicate entity key',
      keyValueNotSpecified: 'Key value for attribute {{keyDefName}} not specified',
    },
    nodes: {
      count: {
        invalid: '{{nodeDefName}} nodes must be exactly {{count}}',
        maxExceeded: '{{nodeDefName}} nodes must be less than or equal to {{maxCount}}',
        minNotReached: '{{nodeDefName}} nodes must be more than or equal to {{minCount}}',
      },
    },
  },

  // ====== Common components

  expressionEditor: {
    and: 'AND',
    or: 'OR',
    group: 'Group',
    var: 'Var',
    const: 'Const',

    header: {
      editingExpressionForNodeDefinition: 'Editing {{qualifier}} expression for "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'default value',
      'default-values-apply-if': 'default value apply if',
      'relevant-if': 'relevant if',
      validations: 'validation rule',
      'validations-apply-if': 'validation rule apply if',
    },
  },

  // ====== Auth

  authGroups: {
    systemAdmin: {
      label: 'System administrator',
      label_plural: 'System administrators',
      description: 'OF Arena system administrators',
    },
    surveyManager: {
      label: 'Survey manager',
      label_plural: 'Survey managers',
      description: 'OF Arena survey managers',
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
    signature: `<p>Thank you,<br>
      $t(common.appNameFull) platform
      </p>`,
    temporaryMsg: '<p><i>This link is only valid for the next 7 days. Please do not share it with anyone else.</i></p>',
    userInviteCommon: `<p>You have been invited by {{invitingUserName}} to join the $t(common.appNameFull) survey '{{surveyName}} - {{surveyLabel}}' as {{groupLabel}}</p>
      {{-message}}
      <p>With the role of <b>{{groupLabel}}</b> you have the following permissions: <br/> 
        <ul>{{groupPermissions}}</ul>
      </p>`,
    userInvite: {
      subject: 'You have been invited to $t(common.appNameFull)!',
      body: `<p>Hello,</p>
             $t(emails.userInviteCommon)
             <p><a href="{{urlResetPassword}}">Click here to complete your registration to $t(common.appNameFull)</a></p>
             <p>If it doesn't work, please copy and paste the following link in your browser: {{urlResetPassword}}</p>
             $t(emails.temporaryMsg)
             <p><i>You have received this email because {{invitingUserName}} invited you to access $t(common.appNameFull) through {{serverUrl}}. If you are not the recipient, please ignore it.</i></p>
             <p>After you have completed the registration, you can access directly $t(common.appNameFull) with this link: <a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>$t(common.raiseTicketInSupportForum)</p>
             $t(emails.signature)`,
    },
    userInviteExistingUser: {
      subject: `You have been invited to join the survey '{{surveyLabel}}' in $t(common.appNameFull)!`,
      body: `<p>Hello,</p>
             $t(emails.userInviteCommon)
             <p><a href="{{serverUrl}}">Click here to access $t(common.appNameFull)</a></p>
             <p>If it doesn't work, please copy and paste the following link in your browser: {{serverUrl}}</p>
             $t(emails.signature)`,
    },
    userAccessRequest: {
      subject: '$t(common.appNameFull) - User Access Request',
      body: `<p>Hello,</p>
      <p>The following user has requested access to $t(common.appNameFull).</p>
      <p>
        <ul>
          <li>$t(accessRequestView.fields.email): {{email}}</li>
          <li>$t(accessRequestView.fields.props.firstName): {{firstName}}</li>
          <li>$t(accessRequestView.fields.props.lastName): {{lastName}}</li>
          <li>$t(accessRequestView.fields.props.institution): {{institution}}</li>
          <li>$t(accessRequestView.fields.props.country): {{country}}</li>
          <li>$t(accessRequestView.fields.props.purpose): {{purpose}}</li>
          <li>$t(accessRequestView.fields.props.surveyName): {{surveyName}}</li>
        </ul>
      </p>
      <p>Please evaluate this request and get back to the user as soon as possible.</p>
      <p><a href="{{serverUrl}}">Click here to access $t(common.appNameFull)</a></p>
      $t(emails.signature)`,
    },
    userInviteRepeatConfirmation:
      'User {{email}} has been successfully invited again. $t(common.emailSentConfirmation)',
    userResetPassword: {
      subject: '$t(common.appNameFull). Password reset',
      body: `<p>Hello {{name}},</p>
             <p>You recently requested to reset your password for your $t(common.appNameFull) account. Click the link below to reset it.</p>
             <p><a href="{{url}}">Reset your password</a></p>
             $t(emails.temporaryMsg)
             <p>If you did not request a password reset, please ignore this email or let us know.<br/>This password reset link is only valid for the next 7 days.</p>
             $t(emails.signature)`,
    },
    userDeleted: {
      subject: `You have been deleted from the survey {{surveyLabel}} in $t(common.appNameFull)`,
      body: `<p>Hello {{name}},</p>
      <p>You have been removed from the survey <strong>{{surveyName}} - {{surveyLabel}}</strong></p>
      <p>If you want to have access again to that survey, please contact the survey administrator.</p>
      $t(emails.signature)`,
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/tools/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank">$t(urls.supportForum)</a>`,
  },
}
