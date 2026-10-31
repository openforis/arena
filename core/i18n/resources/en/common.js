import {
  samplingPointDataCategoryName,
  samplingPointDataWhispCategoryName,
  locationItemExtraDefName,
} from '@core/survey/category'

export default {
  common: {
    active: 'Active',
    add: 'Add',
    advancedFunctions: 'Advanced functions',
    and: 'and',
    appName: 'Arena',
    appNameFull: '$t(common.openForis) Arena',
    apply: 'Apply',
    aggregateFunction: 'Aggregate function',
    aggregateFunction_other: 'Aggregate functions',
    attribute: 'Attribute',
    attribute_other: 'Attributes',
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
    chain_other: 'Chains',
    childrenEmpty: 'Define at least one child item',
    clear: 'Clear',
    clone: 'Clone',
    close: 'Close',
    cloneFrom: 'Clone from',
    cnt: 'Count',
    code: 'Code',
    collapse: 'Collapse',
    confirm: 'Confirm',
    convert: 'Convert',
    copy: 'Copy',
    createdWith: 'Created with',
    createdWithApp: `$t(common.createdWith) {{app}}`,
    cycle: 'Cycle',
    cycle_other: 'Cycles',
    dateCreated: 'Date created',
    dateLastModified: 'Date last modified',
    delete: 'Delete',
    deleted: 'Deleted!',
    descending: 'Descending',
    description: 'Description',
    description_other: 'Descriptions',
    designerNotes: 'Designer notes',
    designerNotesInfo: `Designer notes will be visible only in the survey form designer and won't be visible in the data entry form.`,
    details: 'Details',
    dimension: 'Dimension',
    dimension_other: 'Dimensions',
    done: 'Done',
    download: 'Download',
    draft: 'Draft',
    edit: 'Edit',
    elapsed: 'Elapsed',
    email: 'Email',
    email_other: 'Emails',
    emailSentConfirmation: `An email to {{email}} has been sent.

    Please inform the person to check also the Spam/Junk mail folder.`,
    emailSentToSelfConfirmation: `You should have received an email to {{email}}.

Please check also the Spam/Junk mail folder.`,
    empty: 'Empty',
    entity: 'Entity',
    error: 'Error',
    error_other: 'Errors',
    errorFound: '1 error found',
    errorFound_other: '{{count}} errors found',
    errorMessage: 'Error message',
    errorMessage_other: 'Error messages',
    expand: 'Expand',
    expandCollapse: '$t(common.expand) / $t(common.collapse)',
    export: 'Export',
    exportAll: 'Export all',
    exportToCSV: 'Export to CSV',
    exportToExcel: 'Export to Excel',
    exportToExcelTooManyItems: 'Too many items to export in Excel; please use CSV export.',
    expression: 'Expression',
    false: 'False',
    file: 'File',
    file_other: 'Files',
    formContainsErrors: 'Form contains errors',
    formContainsErrorsCannotContinue: 'The form contains errors. Please, fix them before continuing.',
    formContainsErrorsCannotSave: 'The form contains errors. Please, fix them before saving.',
    from: 'From',
    function: 'Function',
    goToHomePage: 'Go to Home Page',
    goToSurveys: 'Go to surveys',
    group: 'Group',
    help: 'Help',
    hide: 'Hide',
    id: 'id',
    import: 'Import',
    importFromExcelOrCSVFile: 'Import from Excel (.xlsx) or CSV file',
    info: 'Info',
    invalid: 'INVALID',
    item: 'Item',
    item_other: 'Items',
    itemAlreadyAdded: 'Item already added',
    label: 'Label',
    label_other: 'Labels',
    language: 'Language',
    language_other: 'Languages',
    leavePageConfirmMessage: `There are unsaved changes in the form. 

By confirming, all changes will be lost.
Do you want to proceed?`,
    local: 'Local',
    loading: 'Loading...',
    lock: 'Lock',
    unlock: 'Unlock',
    max: 'Maximum',
    med: 'Median',
    manage: 'Manage',
    message_other: 'Messages',
    measure: 'Measure',
    measure_other: 'Measures',
    measurePrevSteps: 'Measure Previous Steps',
    measurePrevSteps_other: 'Measures Previous Steps',
    min: 'Minimum',
    moveUp: 'Move up',
    moveDown: 'Move down',
    name: 'Name',
    new: 'New',
    next: 'Next',
    no: 'No',
    noItems: `$t(common.no) $t(common.item_other)`,
    notification: 'Notification',
    notification_other: 'Notifications',
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
    pause: 'Pause',
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
    publishRecordValuesUpdateConfirm: `#### Publishing {{survey}} will update data already recorded ####

{{reasons}}

This operation can permanently change or clear data already entered.

To publish without updating the existing data instead, check "Skip data update" below (not recommended).`,
    publishRecordValuesUpdateConfirmHeader: 'Existing record data will be updated',
    publishRecordValuesUpdateConfirmOk: 'Publish and update data',
    publishRecordValuesUpdateConfirmInputLabel: 'Type the survey name "{{strongConfirmRequiredText}}" to confirm',
    publishRecordValuesUpdateReasonAttributeChanged:
      'The following attributes will be modified, and their values in existing records will be automatically recalculated: **{{attributeNames}}**.',
    publishRecordValuesUpdateReasonCategoryOrTaxonomyExtraPropChanged:
      'The following attributes use an extra property of a category or taxonomy that changed, which will recalculate their value in existing records: **{{attributeNames}}**.',
    publishSkipDataUpdate: 'Skip data update',
    publishSkipDataUpdateConfirmOk: 'Skip data update and publish',
    publishSkipDataUpdateImplications: 'Skipping the data update means:\n\n{{implications}}',
    publishSkipDataUpdateImplicationInconsistentData:
      'Existing records may no longer match with the new survey definition',
    publishSkipDataUpdateImplicationStaleValues: "Affected values won't be recalculated until re-entered manually",
    publishSkipDataUpdateImplicationChains: 'Processing chains using these attributes may produce outdated results',
    raiseTicketInSupportForum: `In case of problems please raise a ticket with a tag 'arena' in our <b>Support Forum</b>: $t(links.supportForum)`,
    record: 'Record',
    record_other: 'Records',
    remaining: 'Remaining',
    remote: 'Remote',
    required: 'Required',
    requiredField: 'required field',
    reset: 'Reset',
    refresh: 'Refresh',
    pressRefreshToReloadPage: 'Press Refresh to reload the page.',
    resume: 'Resume',
    retry: 'Retry',
    role: 'Role',
    save: 'Save',
    saveAndBack: 'Save & Back',
    saved: 'Saved!',
    samplingPolygon: 'Sampling Polygon',
    show: 'Show',
    select: 'Select',
    selectOne: 'Select one...',
    selectAll: 'Select all',
    selected: 'Selected',
    showLabels: 'Show labels',
    showLabelsAndNames: 'Show labels and names',
    showNames: 'Show names',
    sort: 'Sort',
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    sortNone: 'Remove sort',
    srs: 'SRS',
    status: 'Status',
    sum: 'Sum',
    test: 'Test',
    to: 'To',
    totalItems: 'Total items',
    true: 'True',
    trySplittingFileIntoSmallerChunks: 'Try splitting the file into smaller chunks.',
    type: 'Type',
    undefinedName: 'Undefined name',
    unique: 'Unique',
    upload: 'Upload',
    uploadErrorConfirm: {
      message: `Error during file upload: {{error}}.\n
Try again?`,
    },
    uploadFileChangedError:
      'The selected file appears to have been modified since it was selected. Please select it again.',
    uploadingFile: 'Uploading file ({{progressPercent}}%)',
    value: 'Value',
    view: 'View',
    warning: 'Warning',
    warning_other: 'Warnings',
    yes: 'Yes',
    date: {
      aMomentAgo: 'A moment ago',
      hour: 'hour',
      hour_other: 'hours',
      day: 'day',
      day_other: 'days',
      minute: 'minute',
      minute_other: 'minutes',
      week: 'week',
      week_other: 'weeks',
      timeDiff: `{{count}} $t(common.date.{{unit}}, { 'count': {{count}} }) ago`,
    },
    paginator: {
      firstPage: 'First page',
      goToPage: 'Go to page',
      itemsPerPage: 'Items per page',
      lastPage: 'Last page',
      nextPage: 'Next page',
      page: 'Page',
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
      fileNotValid: 'Selected file is not valid',
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
  geo: {
    area: 'Area',
    vertices: 'Vertices',
    perimeter: 'Perimeter',
  },
  files: {
    header: 'Files',
    missing: ' Missing files: {{count}}',
    totalSize: 'Total size: {{size}}',
    fileName: 'File name',
    fileSize: 'File size',
  },
  sidebar: {
    logout: 'Logout',
  },
  header: {
    theme: {
      label: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'System default',
    },
    myProfile: 'My profile',
    qrCodeLoginDialog: {
      title: 'Login to Arena Mobile using QR code',
      instructions: `1. Start **Arena Mobile** app on your mobile device
2. Go to the **Settings** menu
3. Select  **Connection to server**
4. Press **Login using QR code**
5. Scan the QR code displayed on this screen`,
      success: 'Login successful!',
      error: 'Error generating QR code: {{error}}',
    },
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
    geo: 'Geospatial',
    taxon: 'Taxon',
    file: 'File',
    entity: 'Entity',
  },

  // ====== App modules and views
  appModules: {
    home: 'Home',
    landing: 'Landing',
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
    surveyDependencyTree: 'Dependency tree',
    surveyCompare: 'Compare / update from file',
    category: 'Category',
    categories: 'Categories',
    nodeDef: 'Node Definition',
    taxonomy: 'Taxonomy',
    taxonomies: 'Taxonomies',

    data: 'Data',
    record: '$t(common.record)',
    records: '$t(common.record_other)',
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
    userNew: 'New User',
    usersSurvey: 'Users list',
    userGroup: 'User Group',
    userGroup_other: 'User Groups',
    userGroupNew: 'New User Group',
    usersList: 'Users list (all)',
    user2FADevice: '2FA device',
    user2FADevice_other: '2FA devices',
    user2FADeviceDetails: '$t(appModules.user2FADevice)',
    user2FADeviceList: '$t(appModules.user2FADevice_other)',

    analysis: 'Analysis',
    chain: 'Chain',
    chain_other: 'Chains',
    virtualEntity: 'Virtual Entity',
    entities: 'Virtual entities',
    virtualEntity_other: '$t(appModules.entities)',
    instances: 'Instances',

    message: 'Message',
    message_other: '$t(common.message_other)',

    systemAdmin: 'System Administration',
    jobMonitor: 'Job Monitor',
    systemLogs: 'System Logs',

    help: 'Help',
    about: 'About',
    changelog: 'Changelog',
    whatsNew: "What's new",
    disclaimer: 'Disclaimer',
    userManual: 'User Manual',
  },
  surveyDefsLoader: {
    requireSurveyPublish: 'This section is available only when survey is published',
  },
  surveyDependencyTreeView: {
    dependencyTypesLabel: 'Dependency types',
    dependencyTypes: {
      applicable: 'Applicability',
      defaultValues: 'Default value',
      editable: 'Editable',
      fileName: 'File name',
      itemsFilter: 'Items filter',
      maxCount: 'Max count',
      minCount: 'Min count',
      parentCode: 'Parent code',
      validations: 'Validations',
      visible: 'Visible',
    },
    selectAtLeastOneDependencyType: 'Select at least one dependency type',
    noDependenciesToDisplay: 'No dependencies to display',
  },
  designerView: {
    formPreview: 'Form preview',
  },
  recordView: {
    justDeleted: 'This record has just been deleted',
    sessionExpired: 'Record session has expired',
    errorLoadingRecord: 'Error loading record: {{details}}',
    recordEditModalTitle: 'Record: {{keyValues}}',
    recordNotFound: 'Record not found',
    keyAttributeEditing: {
      lock: 'Lock key attribute editing',
      unlock: 'Allow editing of key attribute',
    },
    qualifierAttributeEditing: {
      lock: 'Lock qualifier attribute editing',
      unlock: 'Allow editing of qualifier attribute',
    },
  },
  dataExplorerView: {
    customAggregateFunction: {
      confirmDelete: 'Delete this custom aggregate function?',
      sqlExpression: 'SQL Expression',
    },
    editRecord: 'Edit record',
  },
  mapView: {
    changeMarkerColor: 'Change marker color',
    createRecord: 'Create new record',
    editRecord: 'Edit record',
    elevation: 'Elevation (m)',
    location: 'Location',
    locationEditInfo: 'Double click on the map or drag the marker to update the location',
    locationNotValidOrOutOfRange: 'Location not valid or out of UTM zone range',
    locationUpdated: 'Location updated',
    options: {
      showLocationMarkers: 'Show location markers',
      showMarkersLabels: `Show markers' labels`,
      showSamplingPolygon: `Sampling polygon`,
      showControlPoints: `Control points`,
      showPlotReferencePoint: `Plot reference point`,
      showUtmGrid: 'Show UTM grid',
    },
    rulerTooltip: `Press the button to start measuring distances.
- click multiple times to measure paths
- double click or press ESC button to finish measuring
- press the button again to hide measurements`,
    samplingPointDataLayerName: 'Sampling point data - level {{level}}',
    samplingPointDataLayerNameLoading: '$t(mapView.samplingPointDataLayerName) (loading...)',
    samplingPointItemPopup: {
      title: 'Sampling Point Item',
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
    numberOfPointsEast: 'Number of Control Points East',
    numberOfPointsNorth: 'Number of Control Points North',
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
    chains: 'Chains',
    confirmUpdateSurveyOwner: `Change the owner of the survey "{{surveyName}}" into "{{ownerName}}"?`,
    cycles: 'Cycles',
    datePublished: 'Date published',
    editUserExtraProps: 'Edit user extra properties',
    editUserExtraPropsForSurvey: 'Edit user extra properties for survey "{{surveyName}}"',
    filter: 'Filter',
    filterPlaceholder: 'Filter by name, label or owner',
    languages: 'Languages',
    nodes: 'Nodes',
    noSurveysMatchingFilter: 'No surveys matching the specified filter',
    onlyOwn: 'Only own surveys',
    records: 'Records',
    recordsCreatedWithMoreApps: 'Records created with more apps:',
    status: {
      published: 'Published',
      draft: 'Draft',
      'published-draft': 'Published/Draft',
    },
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
      template: 'Template',
    },
  },
  userView: {
    scale: 'Scale',
    rotate: 'Rotate',
    dragAndDrop: 'Drop an image above or',
    upload: 'Upload',
    remove: 'Remove the profile picture?',
    sendNewInvitation: 'Send new invitation',
    removeFromSurvey: 'Remove from survey',
    confirmRemove: 'Are you sure you want to revoke access to {{user}} from survey {{survey}}?',
    removeUserConfirmation: 'User {{user}} has been removed from survey {{survey}}',
    maxSurveysUserCanCreate: 'Max surveys user can create',
    preferredUILanguage: {
      label: 'Preferred UI language',
      auto: 'Automatically detected ({{detectedLanguage}})',
    },
    newPassword: 'Password',
    confirmPassword: 'Confirm password',
    manageTwoFactorDevices: {
      label: 'Manage 2FA',
      title: 'Manage Two-Factor Authentication Devices',
    },
  },
  userPasswordChangeView: {
    changingPasswordForUser: 'Changing password for user: {{user}}',
    oldPassword: 'Old password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    changePassword: 'Change password',
    passwordChangedSuccessfully: 'Password changed successfully!',
    notAuthorizedToChangePasswordOfAnotherUser: 'You are not authorized to change the password of another user',
  },
  userInviteView: {
    confirmInviteSystemAdmin: 'Invite the user {{email}} as System Administrator?',
    confirmInviteSystemAdmin_other: 'Invite the users {{email}} as System Administrators?',
    emailSentConfirmationWithSkippedEmails: `$t(common.emailSentConfirmation)

    $t(userInviteView.skippedEmailsNotice)`,
    skippedEmailsNotice: `{{skppedEmailsCount}} addresses have been skipped (they have been already invited to this survey previously): {{skippedEmails}}`,
    invalidEmailsWarning: `The email address {{emails}} could not be reached and may not exist. It has been kept in the list below: please correct it or remove it and try inviting again.`,
    invalidEmailsWarning_other: `The email addresses {{emails}} could not be reached and may not exist. They have been kept in the list below: please correct or remove them and try inviting again.`,
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
      Users can be invited only with the roles of ***$t(auth:authGroups.systemAdmin.label)*** and ***$t(auth:authGroups.surveyAdmin.label)***.
      If you want to invite users with other roles you should first publish the survey.`,
    typeEmail: 'Type an email address, then press the Add button',
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
    mauFile: {
      upload: 'Upload MAU.zip',
      download: 'Download MAU.zip',
      delete: 'Delete MAU.zip',
      confirmCycleAssociation:
        'The MAU.zip file will be associated to the current cycle ({{cycle}}). Do you want to continue?',
      confirmReplace: 'A MAU.zip file has already been uploaded for this chain. Do you want to replace it?',
      confirmDelete: 'Delete the MAU.zip file uploaded for this chain?',
      uploadComplete: 'MAU.zip file uploaded successfully',
      deleteComplete: 'MAU.zip file deleted',
      invalidFileExtension: 'Please select a .zip file',
    },
    phase1Category: '1st phase category',
    phase1CategoryInfo: 'Select the category that contains the first-phase samples.',
    phase2JoinEntity: {
      label: 'Join entity (2nd phase)',
      info: 'Entity used to join the base unit with the 1st phase category: the base unit entity itself, or one of its parent entities.',
    },
    phase2AsSamplingPointData: {
      label: 'Join by using Sampling Point Data linkage',
      info: 'The second-phase entity key(s) are read from the Sampling Point Data table, which is the same table used for the first phase.',
    },
    phase1JoinAttribute: {
      label: 'Join attribute (1st phase)',
      info: 'Select the column of the $t(chainView.phase1Category) table (an extra property, or "code") used to join it with the 2nd phase join entity.',
    },
    phase2JoinAttribute: {
      label: 'Join attribute (2nd phase)',
      info: `Select the attribute (of 2nd phase entity) to join with 1st phase table; its value is matched against the previous 1st phase join attribute.`,
    },
    formLabel: 'Processing chain label',
    basic: 'Basic',
    records: 'Records',
    recordsInStepCount: '{{step}}: {{recordsCount}}',
    submitOnlyAnalysisStepDataIntoR: 'Submit only analysis step data to RStudio',
    submitOnlySelectedRecordsIntoR: 'Submit only selected records to RStudio',
    includeEntitiesWithoutData: 'Include entities without data',
    cannotStartRStudio: {
      common: 'Cannot start RStudio',
      noRecords: '$t(chainView.cannotStartRStudio.common): there are no records to submit',
      surveyNotPublished: '$t(chainView.cannotStartRStudio.common): publish the survey first',
    },
    nonResponseBiasCorrection: 'Non-response bias correction',
    nonResponseBiasCorrectionInfo: `To implement Weighting Class Adjustment method, add 'design_psu' and 'design_ssu' into the stratum category table as extra numeric properties`,
    pValue: 'P-value',
    resultsBackFromRStudio: 'Results read back from RStudio',
    resultsBackFromRStudioInfo: `Enable this option if the result attributes calculated in RStudio should be imported back into the Arena server.
This might be a slow process.`,
    samplingDesign: 'Sampling Design',
    samplingDesignDetails: 'Sampling Design Details',
    samplingStrategyLabel: 'Sampling strategy',
    samplingStrategy: {
      simpleRandom: 'Simple Random Sampling',
      systematic: 'Systematic Sampling',
      stratifiedRandom: 'Stratified Random Sampling',
      stratifiedSystematic: 'Stratified Systematic Sampling',
      twoPhase: 'Two-Phase Sampling',
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
      reportingAreaInfo: `With stratified sampling, give areas of strata within the stratum attribute's category table (column name 'area')`,
    },
    stratumAttribute: 'Stratum attribute',
    stratumAttributeInfo: 'Select the variable used to stratify the sample.',
    stratumAttribute2ndPhaseInfo:
      'Select the variable used to sub-stratify the first-phase sample before drawing the final, detailed subsample. Only attributes whose name also appears as a column of the 1st phase category are shown.',
    postStratificationAttribute: 'Post stratification attribute',
    areaWeightingMethod: 'Area Weighting Method',
    clusteringEntity: 'Clustering entity',
    clusteringEntityInfo:
      'The entity defining primary sampling units. Note: This is used exclusively for cluster analysis within the R survey package framework.',
    clusteringOnlyVariances: 'Clustering only for variances',
    errorNoLabel: 'Chain should have a valid Label',
    dateExecuted: 'Date executed',
    deleteChain: 'Delete chain',
    deleteConfirm: `Delete this processing chain?
    
$t(common.cantUndoWarning)`,
    deleteComplete: 'Processing chain deleted',
    cloneFromAnotherSurvey: 'Clone from another survey',
    cloneFromAnotherSurveyDialog: {
      title: 'Clone chain from another survey',
      sourceSurvey: 'Source survey',
      sourceChain: 'Source chain',
      entityCheck: 'Entity compatibility',
      entityMissing: 'missing in target survey',
      skipMissingEntities: 'Skip analysis attributes for entities missing in the target survey',
      noAnalysisAttributes: 'This chain has no analysis attributes',
      cloneComplete: 'Chain cloned successfully',
      missingEntities: 'Cannot clone: the following entities do not exist in the target survey: {{entities}}',
    },
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
    showSamplingAttributes: 'Show sampling attributes',
  },
  instancesView: {
    title: 'Instances',
    terminate: 'Terminate',
  },
  chain: {
    quantitative: 'Quantitative',
    categorical: 'Categorical',
    addQuantitative: 'Add quantitative attribute',
    addCategorical: 'Add categorical attribute',
    emptyNodeDefs: '$t(validationErrors:analysis.analysisNodeDefsRequired)',
    entityExcludedInRStudioScripts:
      'the entity and all the related result variables will be excluded in the RStudio scripts',
    entityWithoutData: 'Entity {{name}} has no data; $t(chain.entityExcludedInRStudioScripts)',
    entityNotInCurrentCycle:
      'Entity {{name}} is not available in the selected cycle; $t(chain.entityExcludedInRStudioScripts)',
    error: {
      invalidToken: 'Invalid or expired token',
    },
  },
  itemsTable: {
    unused: 'Unused',
    noItemsAdded: 'No items added',
  },
  expression: {
    functionHasTooFewArguments: 'Function {{fnName}} requires at least {{minArity}} arguments (got {{numArgs}})',
    functionHasTooManyArguments: 'Function {{fnName}} only accepts at most {{maxArity}} arguments (got {{numArgs}})',
    identifierNotFound: 'Attribute or entity "{{name}}" not found',
    invalid: 'Invalid expression: {{details}}',
    invalidAttributeValuePropertyName: 'Invalid attribute value property name: {{attributeName}}.{{propName}}',
    invalidCategoryExtraProp: 'Invalid extra property name: {{propName}}',
    invalidCategotyName: 'Invalid category name: {{name}}',
    invalidTaxonomyExtraProp: 'Invalid taxonomy extra property name: {{propName}}',
    invalidTaxonomyName: 'Invalid taxonomy name: {{name}}',
    invalidTaxonVernacularNameLanguageCode: 'Invalid taxon vernacular name language code: {{vernacularLangCode}}',
    missingFunctionParameters: 'Missing function parameters',
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

 * Developed by: $t(links.openforis)
 * Version: {{version}}
 * Website: $t(links.openforisArenaWebsite)
 * Arena video tutorials in FAO elearning Academy: $t(links.arenaVideoTutorialsInFaoElearningAcademy)
 * Arena video tutorials in YouTube: $t(links.arenaVideoTutorialsInYouTube)
 * Support Forum: $t(links.supportForum)
 * Arena in GitHub: $t(links.arenaInGitHub)
 * Arena R Scripts in GitHub: $t(links.arenaRScriptsInGitHub)
`,
    },
    changelog: {
      title: '$t(appModules.changelog)',
    },
  },

  // ====== Survey views
  languagesEditor: {
    languages: 'Language(s)',
  },
  taxonomy: {
    header: 'Taxonomy',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'taxonomy'})`,
    confirmDelete: 'Delete the taxonomy {{taxonomyName}}?\n$t(common.cantUndoWarning)',
    cloneFromAnotherSurvey: {
      title: 'Clone Taxonomy From Another Survey',
      sourceSurvey: 'Source survey',
      sourceTaxonomy: 'Source taxonomy',
      loadingSurveys: 'Loading surveys...',
      noSurveysAvailable: 'No surveys available',
      selectSurveyFirst: 'Select a survey first',
      loadingTaxonomies: 'Loading taxonomies...',
      noTaxonomiesAvailable: 'No taxonomies available in the selected survey',
    },
    edit: {
      taxonomyListName: 'Taxonomy list name',
      taxaNotImported: 'Taxa not imported',
      family: 'Family',
      genus: 'Genus',
      scientificName: '$t(surveyForm:nodeDefTaxon.scientificName)',
      synonym: 'Synonym / Latin',
      extraPropsNotDefined: 'Extra properties not defined for this taxonomy',
      importMissingPublishedTaxa:
        '{{count}} published taxon/taxa not found in the imported file and left unchanged. Codes: {{codes}}',
      importMissingPublishedTaxaTruncated: '$t(taxonomy.edit.importMissingPublishedTaxa) (+{{extra}} more)',
    },
    taxaCount: 'Taxa count',
    vernacularNameLabel: 'Vernacular name label',
  },
  categoryList: {
    batchImport: 'Import categories in batch (from ZIP)',
    batchImportCompleteSuccessfully: `{{importedCategories}} categories imported successfully!
{{insertedCategories}} new
{{updatedCategories}} updated`,
    cloneFromAnotherSurvey: {
      title: 'Clone Category From Another Survey',
      sourceSurvey: 'Source survey',
      sourceCategory: 'Source category',
      loadingSurveys: 'Loading surveys...',
      noSurveysAvailable: 'No surveys available',
      selectSurveyFirst: 'Select a survey first',
      loadingCategories: 'Loading categories...',
      noCategoriesAvailable: 'No categories available in the selected survey',
    },
    itemsCount: 'Items count',
    structure: 'Structure',
    types: {
      flat: 'Flat',
      hierarchical: 'Hierarchical',
      reportingData: 'Reporting Data',
      geoPackage: 'GeoPackage',
      samplingPointData: 'Sampling Point Data',
    },
  },
  categoryEdit: {
    header: 'Category',
    addLevel: 'Add level',
    categoryName: 'Category name',
    cantBeDeleted: `$t(common.cantBeDeletedUsedItem, {'item': 'category'})`,
    cantBeDeletedLevel: `$t(common.cantBeDeletedUsedItem, {'item': 'category level'})`,
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
    convertToSamplingPointDataCategory: {
      buttonLabel: 'Convert to Sampling Point Data',
      confirmMessage: `Convert this category to the Sampling Point Data category?

The category will be renamed to '${samplingPointDataCategoryName}' and a '${locationItemExtraDefName}' extra property will be added to the items.`,
    },
    convertToGeoPackageCategory: {
      buttonLabel: 'Convert to GeoPackage category',
      confirmMessage: `Convert this category to a GeoPackage category?

A '${locationItemExtraDefName}' extra property will be added to the items.`,
    },
    convertGeoPackageCategoryToSimple: {
      buttonLabel: 'Convert to simple category',
      confirmMessage: `Convert this GeoPackage category to a simple category?

The '${locationItemExtraDefName}' extra property will be unlocked, so it can be renamed, retyped or deleted like any other extra property. Its data is not affected.`,
    },
    convertSamplingPointDataCategoryToSimple: {
      buttonLabel: 'Convert to simple category',
      confirmMessage: `Convert this Sampling Point Data category to a simple category?

The category name will be cleared (you'll need to give it a new name), and the '${locationItemExtraDefName}' extra property will be unlocked, so it can be renamed, retyped or deleted like any other extra property. Its data is not affected.`,
    },
    geoPackageCategory: 'This category has geo capabilities',
    geoPackageCategoryInfo: `This category has an extra property called '${locationItemExtraDefName}', which allows it to be exported as a GeoPackage file.`,
    samplingPointDataCategoryType: 'This is the Sampling Point Data category',
    samplingPointDataCategoryTypeInfo: `This is a predefined category for sampling point data. It has an extra property called '${locationItemExtraDefName}', which allows it to be exported as a GeoPackage file.`,
    samplingPointDataCategoryLocationMissing: `The '${locationItemExtraDefName}' extra property is missing`,
    createCategory: {
      menuLabel: 'Add category',
      simple: 'Simple category',
      otherTypes: 'More category types',
    },
    createSamplingPointDataCategory: {
      buttonLabel: 'Sampling Point Data category',
      description: 'Predefined category for sampling point data, including a location field for each item.',
      message: `Create a new Sampling Point Data category?

A '${locationItemExtraDefName}' extra property will be added to the items.`,
    },
    createGeoPackageCategory: {
      buttonLabel: 'Category with geo capabilities',
      description: 'Adds a location field to items, so the category can be exported as a GeoPackage file.',
      message: `Create a new category with geo capabilities?

A '${locationItemExtraDefName}' extra property will be added to the items.`,
    },
    deleteItem: 'Delete item',
    level: {
      title: 'Level {{levelPosition}}',
      noItemsDefined: 'No items defined',
      selectItemFromPreviousLevel: 'Select an item from the previous level',
    },

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
    exportToGeoPackage: 'Export to GeoPackage',
    exportToGeoPackageSkippedItems: '{{count}} item(s) without a valid location were skipped.',
    generateSamplingPointDataWhisp: {
      buttonLabel: 'Generate Whisp analysis',
      confirmMessage: `Generate the Whisp analysis for all the sampling points?

- every sampling point with a location will be sent to Open Foris Whisp for the analysis
- the results will be combined with the sampling point data and stored in the category '${samplingPointDataWhispCategoryName}'
- if the category '${samplingPointDataWhispCategoryName}' already exists, its content will be replaced
- the analysis runs in the background and it can take several minutes, depending on the number of sampling points`,
    },
    templateFor_samplingPointDataImport_csv: 'Template for Sampling Point Data import (CSV)',
    templateFor_samplingPointDataImport_xlsx: 'Template for Sampling Point Data import (Excel)',
  },
  extraProp: {
    label: 'Extra property',
    label_other: 'Extra properties',
    addExtraProp: 'Add extra property',
    dataTypes: {
      geometryPoint: 'Geometry Point',
      number: 'Number',
      text: 'Text',
    },
    editor: {
      title: 'Edit $t(extraProp.label_other)',
      confirmDelete: 'Delete the extra property "{{name}}"?',
      confirmSave: `Save the changes to the extra properties definitions?

  **Warnings**:

  {{warnings}}`,
      warnings: {
        nameChanged: 'Name changed from {{nameOld}} to {{nameNew}}',
        dataTypeChanged: 'Data type changed from {{dataTypeOld}} to {{dataTypeNew}}',
      },
    },
    name: 'Property {{position}} name',
    value: 'Value',
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
    group: 'Group ()',
    var: 'Variable',
    const: 'Constant value',
    call: 'Function',
    operator: 'Operator',
    taxonProp: 'Taxon property',

    geoCoordinateAtDistanceEditor: {
      coordinateAttributeOrigin: 'Coordinate attribute origin',
      distanceAttribute: 'Distance attribute',
      bearingAttribute: 'Bearing attribute',
    },
    coordinateAttributeWithPosition: 'Coordinate attribute {{position}}',

    dateTimeDiffEditor: {
      firstDateAttribute: 'First date attribute',
      firstTimeAttribute: 'First time attribute',
      secondDateAttribute: 'Second date attribute',
      secondTimeAttribute: 'Second time attribute',
    },
    error: {
      selectOneVariable: 'Please select one variable',
    },

    header: {
      editingExpressionForNodeDefinition: 'Editing {{qualifier}} expression for "{{nodeDef}}"',
      editingFunctionForNodeDefinition: 'Editing function "{{functionName}}" for "{{nodeDef}}"',
    },

    qualifier: {
      'default-values': 'default value',
      'default-values-apply-if': 'default value apply if',
      'editable-if': 'editable if',
      'max-count': 'max count',
      'min-count': 'min count',
      'relevant-if': 'relevant if',
      validations: 'validation rule',
      'validations-apply-if': 'validation rule apply if',
      'visible-if': 'visibility',
    },

    selectAFunction: 'Select a function',

    valueType: {
      constant: 'Constant',
      expression: 'Expression',
    },
  },
  urls: {
    openforisWebsite: 'https://www.openforis.org',
    openforisArenaWebsite: '$t(urls.openforisWebsite)/arena',
    supportForum: 'https://openforis.support',
  },
  links: {
    openforis: `<a href="$t(urls.openforisWebsite)" target="_blank" rel="noopener noreferrer">$t(common.openForis)</a>`,
    openforisArenaWebsite: `<a href="$t(urls.openforisArenaWebsite)" target="_blank" rel="noopener noreferrer">$t(urls.openforisArenaWebsite)</a>`,
    supportForum: `<a href="$t(urls.supportForum)" target="_blank" rel="noopener noreferrer">$t(urls.supportForum)</a>`,
    arenaVideoTutorialsInFaoElearningAcademy: `<a href="https://elearning.fao.org/course/view.php?id=1455" target="_blank" rel="noopener noreferrer">FAO elearning Academy</a>`,
    arenaVideoTutorialsInYouTube: `<a href="https://www.youtube.com/playlist?list=PL0Rrgop7D4QAWSJMtRQojzKuhF4vPS6Rs" target="_blank" rel="noopener noreferrer">YouTube</a>`,
    arenaInGitHub: `<a href="https://github.com/openforis/arena" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena</a>`,
    arenaRScriptsInGitHub: `<a href="https://github.com/openforis/arena-r" target="_blank" rel="noopener noreferrer">https://github.com/openforis/arena-r</a>`,
  },
  aiExpression: {
    title: 'Generate expression from description',
    hint: 'Describe in plain language what the expression should do. The AI will translate it into Arena syntax. Press Ctrl+Enter to generate.',
    placeholder: 'e.g. tree height must be greater than 0 and less than 200',

    generate: 'Generate',
    generating: 'Generating…',
    use: 'Use this expression',
    useAnyway: 'Use anyway',
    tryAgain: 'Try a different description',
    parseError:
      'The generated expression did not parse cleanly: {{message}}. You can still apply it and edit by hand, or try rephrasing.',

    explain: {
      title: 'Explain this expression',
      thinking: 'Asking the AI to explain this expression…',
      error: 'Failed to fetch explanation: {{message}}',
      timeout: 'The AI took too long to respond. Please try again.',
    },
  },
  aiTranslation: {
    translateButton_one: 'Translate to {{count}} other language',
    translateButton_other: 'Translate to {{count}} other languages',
    translateButton: 'Translate to other languages',

    success_one: 'Translated to {{count}} language. Review and save.',
    success_other: 'Translated to {{count}} languages. Review and save.',
    success: 'Translated. Review and save.',

    failed: 'Translation failed: {{message}}',
    timeout: 'Translation request timed out. Please try again.',
  },
  aiActivityLog: {
    title: 'Activity log summary',
    summarizeButton: 'Summarize',
    thinking: 'Aggregating events and asking the AI to summarize…',
    error: 'Failed to fetch summary: {{message}}',
  },
  aiChatbot: {
    open: 'Help & documentation',
    title: 'Help & documentation',
    empty: 'Ask me anything about Open Foris Arena.',
    placeholder: 'Type your question…',
    send: 'Send',
    stop: 'Stop',
    clear: 'Clear',
    showReasoning: 'Show reasoning',
    error: 'Chatbot error: {{message}}',
    language: 'Response language',
  },
}
