/* eslint-disable camelcase */
import * as ActivityLog from '@common/activityLog/activityLog'

export const enTranslation = {
  common: {
    active: 'Active',
    add: 'Add',
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
    errorMessage: 'Error message',
    errorMessage_plural: 'Error messages',
    expandCollapse: 'Expand / Collapse',
    export: 'Export',
    exportAll: 'Export all',
    expression: 'Expression',
    false: 'False',
    formContainsErrors: 'Form contains errors',
    formContainsErrorsCannotContinue: 'The form contains errors. Please, fix them before continuing.',
    formContainsErrorsCannotSave: 'The form contains errors. Please, fix them before saving.',
    from: 'From',
    group: 'Group',
    help: 'Help',
    hide: 'Hide',
    id: 'id',
    import: 'Import',
    invalid: 'INVALID',
    item: 'Item',
    item_plural: 'Items',
    label: 'Label',
    label_plural: 'Labels',
    language: 'Language',
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
    required: 'Required',
    reset: 'Reset',
    retry: 'Retry',
    save: 'Save',
    saveAndBack: 'Save & Back',
    saved: 'Saved!',
    show: 'Show',
    select: 'Select',
    selected: 'Selected',
    showLabels: 'Show labels',
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
  },

  confirm: {
    strongConfirmInputLabel: 'To confirm type the text: {{strongConfirmRequiredText}}',
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
    export: 'Export',
    import: 'Import',
    validationReport: 'Validation report',

    users: 'Users',
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
        template: 'Start from a template?',
        template_value: {
          none: 'None (start from scratch)',
          templateA: 'Template A',
          templateB: 'Template B',
        },
      },
    },
    introduction: `The platform is still beta, so if you want access, you have to request here.
We are also interested in what you want to do with it so please let us know!
**A new blank survey** will be created, so please provide a name for it.
You will be assigned the role of ***Survey Administrator*** for that survey: you will be able to edit it and to invite new users to join your survey and contribute to it. You can also create new surveys (up to 5) if needed.
For more information please visit our website: *https://www.openforis.org/tools/arena/*
**Once you send the request, please wait for an invitation email to access Arena.**
\\* = required field`,
    reCaptchaNotAnswered: 'ReCaptcha not answered',
    requestSent: 'Access Request sent correctly',
    requestSentMessage: `Please give us a couple of days to process your request.
We will send soon an email to **{{email}}** with the instructions on how to access $t(common.appName).
Thank you and enjoy **$t(common.appNameFull)**!`,
    sendRequest: 'Send Request',
    sendRequestConfirm: 'Request access to $t(common.appNameFull)?',
    title: 'Requesting access to $t(common.appNameFull)',
  },

  resetPasswordView: {
    setNewPassword: 'Set new password',
    forgotPasswordLinkInvalid: 'The page you have tried to access does not exist or is no longer valid',
    passwordSuccessfullyReset: 'Your password has been successfully reset',
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
    },
    surveyDeleted: 'Survey {{surveyName}} has been deleted',
    surveyInfo: {
      confirmDeleteCycle: 'Are you sure you want to delete the cycle {{cycle}}?\n\n$t(common.cantUndoWarning)',
      editInfo: 'Edit info',
      viewInfo: 'View info',
      preferredLanguage: 'Preferred language',
      srsPlaceholder: 'Type code or label',
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
      importFromCollect: 'Import from Collect',
      importFromArena: 'Import from Arena',
      newSurvey: 'New Survey',
      newSurveyFromScratch: 'New Survey From Scratch',
      newTemplate: 'New Template',
      newTemplateFromScratch: 'New Template From Scratch',
      survey: 'Survey',
      survey_plural: 'Surveys',
      template: 'Template',
      template_plural: 'Templates',
      error: 'Error creating new survey',
      errorMaxSurveysCountExceeded: `Error creating survey; please check that the maximum number of surveys that you can creeate ({{maxSurveysCount}}) has not been exceeded.`,
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
      header: 'Options',
      includeCategoryItemsLabels: 'Include category items labels',
      includeCategories: 'Include categories',
      includeResultVariables: 'Include result variables',
    },
    startCsvExport: 'Start CSV export',
  },

  dataImportView: {
    confirmDeleteAllRecords: 'Delete all records before import?',
    confirmDeleteAllRecordsInCycle: 'Delete all records in the cycle {{cycle}} before import?',
    deleteAllRecordsBeforeImport: 'Delete all records before import',
    downloadTemplate: 'Download template',
    forceImportFromAnotherSurvey: 'Force import from another survey',
    importComplete: 'Import complete. {{insertedRecords}} records imported',
    importFromCollect: 'Import data from Collect / Collect Mobile',
    importFromCsv: 'Import data from CSV',
    importIntoCycle: 'Import into cycle',
    importIntoEntity: 'Import into entity',
    importType: {
      label: 'Import type',
      insertNewRecords: 'Insert new records',
      updateExistingRecords: 'Update existing records',
    },
    selectCSVFileToImport: 'Select CSV file to import',
  },

  dataView: {
    aggregateMode: 'Aggregate Mode',
    editSelectedRecord: 'Edit selected record',
    editMode: 'Edit Mode',
    filterAttributeTypes: 'Filter attribute types',
    filterRecords: 'Filter records',
    invalidRecord: 'Invalid record',
    nodeDefsSelector: {
      hide: 'Hide Node Definitions Selector',
      show: 'Show Node Definitions Selector',
    },
    records: {
      confirmDeleteRecord: `Delete the record "{{keyValues}}"?`,
      confirmDeleteSelectedRecords: `Delete the selected {{count}} records?`,
      confirmUpdateRecordsStep: `Move all the records from the {{stepFrom}} to {{stepTo}}?`,
      deleteRecord: 'Delete record',
      demoteAllRecordsFromAnalysis: 'Analysis -> Cleansing',
      demoteAllRecordsFromCleansing: 'Cleansing -> Entry',
      editRecord: 'Edit record',
      viewRecord: 'View record',
      owner: 'Owner',
      step: 'Step',
      noRecordsAdded: 'No records added',
      noRecordsAddedForThisSearch: 'No records found',
      promoteAllRecordsToAnalysis: 'Cleansing -> Analysis',
      promoteAllRecordsToCleansing: 'Entry -> Cleansing',
      updateRecordsStep: 'Update records step',
    },
    recordsDeleted: `{{count}} records deleted successfully!`,
    recordsUpdated: '{{count}} records updated successfully!',
    rowNum: 'Row #',
    showValidationReport: 'Show validation report',
    sort: 'Sort records',
    dataVis: {
      noData: 'This query returned no data',
    },
  },

  mapView: {
    editRecord: 'Edit record',
    locationEditInfo: 'Double click on the map or drag the marker to update the location',
    locationUpdated: 'Location updated',
    options: {
      showMarkersLabels: `Show markers' labels`,
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

  surveysView: {
    filter: 'Filter',
    filterPlaceholder: 'Name, label or owner',
    noSurveysMatchingFilter: 'No surveys matching the specified filter',
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
    sendInvitation: 'Send invitation',
    surveyNotPublishedWarning: `**Warning**: survey is not published.
      Users can be invited only with the roles of ***$t(authGroups.systemAdmin.label)***, ***$t(authGroups.surveyManager.label)*** and ***$t(authGroups.surveyAdmin.label)***.
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
    nonResponseBiasCorrection: 'Non-response bias correction',
    nonResponseBiasCorrectionTip: `To implement this method, add a category named 'sampling_units_plan'`,
    pValue: 'P-value',
    samplingDesign: 'Sampling Design',
    samplingDesignDetails: 'Sampling Design Details',
    samplingStrategyLabel: 'Sampling strategy',
    samplingStrategy: {
      simpleRandom: 'Simple Random Sampling',
      systematic: 'Systematic Sampling',
      stratifiedRandom: 'Stratified Random Sampling',
      stratifiedSystematic: 'Stratified Systematic Sampling',
    },
    stratumAttribute: 'Stratum attribute',
    postStratificationAttribute: 'Post stratification attribute',
    areaWeightingMethod: 'Area Weighting Method',
    clusteringEntity: 'Clustering entity',
    clusteringOnlyVariances: 'Clustering only for variances',
    errorNoLabel: 'Chain should have a valid Label',
    dateExecuted: 'Date executed',
    surveyShouldBePublished: 'The survey should be published to run analysis',
    deleteConfirm: `Delete this processing chain?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Processing chain deleted',
    cannotSelectNodeDefNotBelongingToCycles: `The node definition "{{label}}" cannot be selected because it doesn't belong to all cycles of the processing chain`,
    cannotSelectCycle: 'This cycle cannot be selected because some node definitions do not belong to this cycle',
    copyRStudioCode: `#### You are about to open an RStudio Server ####
    
    \n

###### Click then OK button a RStudio Server is opened and these commands are copied to your clipboard. ######  

###### Once the RStudio console is active, paste and run these lines to import the chain code. ###### 

\n

{{rStudioCode}}

`,
    copyRStudioCodeLocal: `#### You are about to open an RStudio Server ####

\n

###### Click then OK button and these commands are copied to your clipboard. ###### 

###### Start RStudio in your machine. You should have package 'rstudioapi' installed. ###### 

###### Once the RStudio console is active, paste and run these lines to import the chain code. ###### 
\n

{{rStudioCode}}

`,
    entities: {
      new: 'Virtual entity',
    },
    reportingDataCategory: 'Reporting data category',
    reportingDataAttribute: 'Reporting data attribute for {{level}}',
    samplingNodeDefs: 'Sampling NodeDefs',
  },

  instancesView: {
    title: 'Instances',
    terminate: 'Terminate',
  },
  chain: {
    quantitative: 'Quantitative',
    categorical: 'Categorical',
    emptyNodeDefs:
      '$t(validationErrors.analysis.analysisNodeDefsRequired), click the entity in the left side panel which contains a new result variable',
    entityWithoutData:
      'Entity {{name}} has no data: the entity and all the related result variables will be excluded in the RStudio scripts',
  },

  itemsTable: {
    unused: 'Unused',
    noItemsAdded: 'No items added',
  },

  expression: {
    undefinedFunction: 'Undefined function: {{name}}',
  },

  // ====== Help views
  helpView: {
    about: {
      text: `
About
========

$t(common.appNameFull)
--------
 
 * Developed by: [Open Foris](https://www.openforis.org/)
 * Version: {{version}}
 * Support: [https://openforis.support](https://openforis.support)
 * Arena in GitHub: [https://github.com/openforis/arena](https://github.com/openforis/arena)
`,
    },
  },

  // ====== Survey views

  nodeDefEdit: {
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
        'Returns the value of the specified $t(categoryEdit.extraProp) of a category item having the specified code',
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
    },
    basicProps: {
      key: 'Key',
      multiple: 'Multiple',
      displayAs: 'Display as',
      displayIn: 'Display in',
      form: 'Form',
      table: 'Table',
      parentPage: 'Parent page',
      ownPage: 'Its own page',
      analysis: 'Analysis',
      entitySource: 'Entity Source',
      formula: 'Formula',
    },
    advancedProps: {
      defaultValues: 'Default values',
      defaultValueEvaluatedOneTime: 'Default value evaluated only one time',
      hiddenWhenNotRelevant: 'Hidden when not relevant',
      readOnly: 'Read only',
      relevantIf: 'Relevant if',
      script: 'Script',
      areaBasedEstimate: 'Area-based estimate',
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
  },

  languagesEditor: {
    languages: 'Language(s)',
  },

  surveyForm: {
    subPage: 'Sub page',
    addChildTo: 'Add to {{nodeDefLabel}}',
    addChildToTitle: 'Add new node to {{nodeDefLabel}}',
    compressFormItems: `Compress form items for '{{nodeDefLabel}}'`,
    delete: `Delete '{{nodeDefLabel}}'`,
    edit: `Edit '{{nodeDefLabel}}'`,
    schemaSummary: 'Schema summary',
    hidePages: 'Hide pages',
    showPages: 'Show pages',
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
      x: 'X',
      y: 'Y',
      showOnMap: 'Show on map',
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
    extraPropertiesEditor: {
      title: 'Edit $t(categoryEdit.extraProp_plural)',
      confirmDelete: 'Delete the extra properties "{{name}}"?',
      confirmSave: `Save the changes to the extra properties definitions?

**Warnings**:

{{warnings}}`,
      warnings: {
        nameChanged: 'Name changed from {{nameOld}} to {{nameNew}}',
        dataTypeChanged: 'Data type changed from {{dataTypeOld}} to {{dataTypeNew}}',
      },
    },
    extraProp: 'Extra property',
    extraProp_plural: 'Extra properties',
    extraPropDataType: {
      geometryPoint: 'Geometry Point',
      number: 'Number',
      text: 'Text',
    },
    level: 'Level',

    importSummary: {
      column: 'Column',
      columnTypeSummary: 'Level {{level}} $t(categoryEdit.importSummary.columnType.{{type}})',
      columnTypeSummaryExtra: '$t(categoryEdit.extraProp)',
      columnTypeSummaryWithLanguage: '$t(categoryEdit.importSummary.columnTypeSummary) ({{language}})',
      columnTypeLabelWithLanguage: 'Label ({{language}})',
      columnType: {
        code: 'code',
        description: 'description',
        label: 'label',
        extra: '$t(categoryEdit.extraProp)',
      },
      dataType: 'Data Type',
    },

    reportingData: 'Reporting data',
    templateForDataImport: 'Template for data import',
    templateForDataImportGeneric: 'Template for data import (generic)',
  },

  // ===== All validation errors
  validationErrors: {
    // Common
    invalidField: '"{{field}}" is invalid',
    invalidNumber: 'Invalid number',
    invalidDate: 'Invalid date',
    nameDuplicate: 'Name is duplicate',
    nameCannotBeKeyword: `Name "{{value}}" cannot be used: it's a reserved word`,
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
      itemExtraPropDataTypeRequired: 'Data type required for $t(categoryEdit.extraProp) "{{key}}"',
      itemExtraPropNameInvalid: 'Invalid name for $t(categoryEdit.extraProp) "{{key}}"',
      itemExtraPropInvalidNumber: 'Invalid number for $t(categoryEdit.extraProp) "{{key}}"',
      itemExtraPropInvalidGeometryPoint: 'Invalid geometry point for $t(categoryEdit.extraProp) "{{key}}"',
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
      emptyFile: 'The file you are trying to import is empty',
      invalidParentItemOrder: 'Item with codes {{parentItemCodes}} must come before its children',
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
      uniqueAttributeDuplicate: 'Duplicate value',
    },

    surveyInfoEdit: {
      langRequired: 'Language is required',
      srsRequired: 'Spatial Reference System is required',
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
      passwordResetNotAllowedWithPendingInvitation: `Password reset not allowed: user has been invited to a survey but he hasn't accepted the invitation yet`,
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
  },

  // ====== Jobs
  jobs: {
    ActivityLogImportJob: 'Activity Log Import',
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
    FilesImportJob: 'Files Import',
    NodeDefsImportJob: 'Node Definitions Import',
    NodeDefsValidationJob: 'Node Definitions Validation',
    chainsCyclesCheckJob: `Chains Cycles Check`,
    RecordCheckJob: 'Record Check',
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
    entryDataNotFound: 'Entry data not found: {{entryName}}',
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
      The $t(common.appNameFull) team
      </p>`,
    temporaryMsg: '<p><i>This link is only valid for the next 7 days. Please do not share it with anyone else.</i></p>',
    userInviteCommon: `<p>You have been invited to join the survey '{{surveyName}} - {{surveyLabel}}' as {{groupLabel}}</p>
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
             <p><i>You have received this email because you have requested access to $t(common.appNameFull) through {{serverUrl}}. If you are not the recipient, please ignore it.</i></p>
             <p>After you have completed the registration, you can access directly $t(common.appNameFull) with this link: <a href="{{serverUrl}}">{{serverUrl}}</a></p>
             <p>In case of problems please raise a ticket in our <b>Support Forum</b> at <a href="https://openforis.support">https://openforis.support</a></p>
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
}
