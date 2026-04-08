export default {
  charts: {
    downloadToPng: 'Download chart to PNG',
    warning: {
      selectOneDimensionAndOneMeasure: 'Please select one dimension and one measure to show the chart',
      selectAtLeast2NumericAttributes: 'Please select 2 numeric attributes to show the chart',
      tooManyItemsToShowChart: `Too many items to show the chart;
expecting maximum {{maxItems}} items.
Please refine your query (e.g. adding a filter) to reduce the number of items.
`,
    },
    type: {
      area: 'Area chart',
      bar: 'Bar chart',
      line: 'Line chart',
      pie: 'Pie chart',
      scatter: 'Scatter chart',
    },
  },
  dataQuery: {
    deleteConfirmMessage: 'Delete the query "{{name}}"?',
    displayType: {
      chart: 'Chart',
      table: 'Table',
    },
    manageQueries: 'Manage queries',
    mode: {
      label: 'Mode:',
      aggregate: 'Aggregate',
      raw: 'Raw',
      rawEdit: 'Raw edit',
    },
    replaceQueryConfirmMessage: 'Replace current query with the selected one?',
    showCodes: 'Show codes',
  },
  editSelectedRecord: 'Edit selected record',
  filterAttributeTypes: 'Filter attribute types',
  filterRecords: {
    buttonTitle: 'Filter',
    expressionEditorHeader: 'Expression to filter records',
  },
  invalidRecord: 'Invalid record',
  nodeDefsSelector: {
    hide: 'Hide Node Definitions Selector',
    show: 'Show Node Definitions Selector',
    nodeDefFrequency: `{{nodeDefLabel}} (frequency)`,
  },
  records: {
    clone: 'Clone',
    confirmDeleteRecord: `Delete the record "{{keyValues}}"?`,
    confirmDeleteSelectedRecord_one: `Delete the selected record?`,
    confirmDeleteSelectedRecord_other: `Delete the selected {{count}} records?`,
    confirmMergeSelectedRecords: `### Merge the selected records into one?

- record "source" will be merged into record "target":
  - source: [{{sourceRecordKeys}}], modified {{sourceRecordModifiedDate}};
  - target: [{{targetRecordKeys}}], modified {{targetRecordModifiedDate}};

- a preview of the result will be shown before merging is performed;

- when merging will be confirmed, **the source record WILL BE DELETED**`,
    confirmUpdateRecordsStep: `Move the selected {{count}} record(s) from {{stepFrom}} to {{stepTo}}?`,
    confirmUpdateRecordOwner: `Change the owner of the selected record into {{ownerName}}?`,
    confirmValidateAllRecords: `Re-validate all records?\n\nThis may take several minutes.`,
    deleteRecord: 'Delete record',
    demoteAllRecordsFromAnalysis: 'Analysis -> Cleansing',
    demoteAllRecordsFromCleansing: 'Cleansing -> Entry',
    editRecord: 'Edit record',
    exportList: 'Export list',
    exportData: 'Export data',
    exportDataSummary: 'Export data summary',
    filterPlaceholder: 'Filter by keys or owner',
    merge: {
      label: 'Merge',
      confirmLabel: 'Confirm merge',
      confirmTooManyDifferencesMessage: `**Too many differences**.  
It seems like the records are very different each other.  
Many attributes (~{{nodesUpdated}}) will be updated during merge.  
Continue with merge preview?`,
      noChangesWillBeApplied: `No changes would be applied to target record.  
Merge cannot be performed.`,
      performedSuccessfullyMessage: 'Records merge performed successfully!',
      previewTitle: 'Merging preview (record {{keyValues}})',
    },
    noRecordsAdded: 'No records added',
    noRecordsAddedForThisSearch: 'No records found',
    noSelectedRecordsInStep: 'No selected records in step {{step}}',
    owner: 'Owner',
    promoteAllRecordsToAnalysis: 'Cleansing -> Analysis',
    promoteAllRecordsToCleansing: 'Entry -> Cleansing',
    step: 'Step',
    updateRecordsStep: 'Update records step',
    validateAll: 'Validate all',
    viewRecord: 'View record',
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
  recordsSource: {
    label: 'Source',
  },
  recordsUpdated: '{{count}} records updated successfully!',
  rowNum: 'Row #',
  selectedAttributes: 'Selected attributes:',
  selectedDimensions: 'Selected dimensions',
  selectedMeasures: 'Selected measures',
  sortableItemsInfo: 'Drag&Drop to sort them',
  showValidationReport: 'Show validation report',
  sort: 'Sort',
  dataExport: {
    source: {
      label: 'Source',
      allRecords: 'All records',
      filteredRecords: 'Only filtered records',
      selectedRecord: 'Only selected record',
      selectedRecord_other: 'Only selected {{count}} records',
    },
    title: 'Export data',
  },
  dataVis: {
    errorLoadingData: 'Error loading data',
    noData: 'This query returned no data',
    noSelection:
      'Please make your selection using the left side panel or select an existing query from "Manage queries"',
  },
  viewSelectedRecord: 'View selected record',
}
