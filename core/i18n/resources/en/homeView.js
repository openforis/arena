export default {
  dashboard: {
    activeSurveyNotSelected: `<title>Active survey not selected</title>
      <p><label>Please select one from the</label><linkToSurveys>List of Surveys</linkToSurveys> or <linkToNewSurvey>Create a new one</linkToNewSurvey></p>`,
    activeUsers: 'Active users',
    activityLog: {
      title: 'Activity log',
      size: '$t(homeView:dashboard.activityLog.title) size: {{size}}',
    },
    exportWithData: 'Export + data (Backup)',
    exportWithDataNoActivityLog: 'Export + data (NO Activity Log)',
    surveyPropUpdate: {
      main: `<title>Welcome to Arena</title>
  
        <p>First you need to set the <strong>name</strong> and <strong>label</strong> of the survey.</p>
        
        <p>Click below on <linkWithIcon> $t(homeView:surveyInfo.editInfo)</linkWithIcon>or into the survey name:<basicLink>{{surveyName}}</basicLink></p>
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
    storageSummary: {
      title: 'Storage use',
      availableSpace: 'Available ({{size}})',
      usedSpace: 'Used ({{size}})',
      usedSpaceOutOf: `Used {{percent}}% ({{used}} out of {{total}})`,
    },
    storageSummaryDb: {
      title: 'Storage use (DataBase)',
    },
    storageSummaryFiles: {
      title: 'Storage use (files)',
    },
    samplingPointDataCompletion: {
      title: 'Sampling Point Data Completion',
      totalItems: 'Total items: {{totalItems}}',
      remainingItems: 'Remaining items',
    },
    step: {
      entry: 'Data Entry',
      cleansing: 'Data Cleansing',
      analysis: 'Data Analysis',
    },
    // records' summary
    recordsByUser: 'Records by user',
    recordsAddedPerUserWithCount: 'Records added per user (Total of {{totalCount}})',
    dailyRecordsByUser: 'Daily records by user',
    totalRecords: 'Total records',
    selectUsers: 'Select users...',
    noRecordsAddedInSelectedPeriod: 'No records added in the selected period',
  },
  surveyDeleted: 'Survey {{surveyName}} has been deleted',
  surveyInfo: {
    basic: 'Basic info',
    configuration: {
      title: 'Configuration',
      filesTotalSpace: 'Files total space (GB)',
    },
    confirmDeleteCycleHeader: 'Delete this cycle?',
    confirmDeleteCycle: `Are you sure you want to delete the cycle {{cycle}}?\n\n$t(common.cantUndoWarning)\n\n
If there are records associated to this cycle, they will be deleted.`,
    cycleForArenaMobile: 'Cycle for Arena Mobile',
    deleteActivityLog: 'Clear activity log',
    deleteActivityLogConfirm: {
      headerText: 'Clear ALL the activity log data for this survey?',
      message: `
  - ALL the activity log data for the survey **{{surveyName}}** will be deleted;\n\n
  - the space occupied in the DB by the survey will be reduced;\n\n
  - it won't affect the survey's input data;\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Enter this survey’s name to confirm:',
    },
    fieldManualLink: 'Field manual link',
    editInfo: 'Edit info',
    viewInfo: 'View info',
    preferredLanguage: 'Preferred language',
    sampleBasedImageInterpretation: 'Sample-based image interpretation',
    sampleBasedImageInterpretationEnabled: 'Sample-based image interpretation enabled',
    security: {
      title: 'Security',
      dataEditorViewNotOwnedRecordsAllowed: 'Data Editor can view not owned records',
      visibleInMobile: 'Visible in Arena Mobile',
      allowRecordsDownloadInMobile: 'Allow downloading records from server to Arena Mobile',
      allowRecordsUploadFromMobile: 'Allow uploading records from Arena Mobile to server',
      allowRecordsWithErrorsUploadFromMobile:
        'Allow uploading records with validation errors from Arena Mobile to server',
    },
    srsPlaceholder: 'Type code or label',
    unpublish: 'Unpublish and delete data',
    unpublishSurveyDialog: {
      confirmUnpublish: 'Are you sure you want to unpublish this survey?',
      unpublishWarning: `Unpublishing the **{{surveyName}}** survey will delete all of its data.\n\n
  
  $t(common.cantUndoWarning)`,
      confirmName: 'Enter this survey’s name to confirm:',
    },
    userExtraProps: {
      title: 'User extra properties',
      info: `Extra properties that can be assigned to each user associated to the survey.  
Those properties can be used in default values, validation rules and applicability expressions.  
E.g.: *userProp('property_name') == 'some_value'*`,
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
    recordsAddedInTheLast: 'Records added in the last:',
    fromToPeriod: 'from {{from}} to {{to}}',
    record: '{{count}} Record',
    record_other: '{{count}} Records',
    week: '{{count}} Week',
    week_other: '{{count}} Weeks',
    month: '{{count}} Month',
    month_other: '{{count}} Months',
    year: '{{count}} Year',
    year_other: '{{count}} Years',
  },
}
