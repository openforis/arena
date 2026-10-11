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
      sampleRandomOnly: 'Showing a random sample of {{sampleSize}} out of {{totalCount}} items (no outliers found).',
      sampleWithOutliers:
        'Showing {{sampleSize}} out of {{totalCount}} items: {{outliersCount}} outliers and a random sample of {{randomCount}} of the other items.',
      sampleOutliersOnly: 'Showing the {{sampleSize}} most extreme outliers out of {{totalCount}} items.',
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
    ai: {
      button: 'Ask AI',
      buttonTitle: 'Generate a query from a description using AI',
      title: 'Generate a query with AI',
      hint: 'Describe the data you want to see; the AI will select the entity, the attributes (or dimensions and measures), the filter and the sorting. You can then review the generated query and save it from the queries manager.',
      placeholder: 'e.g. number of trees grouped by species',
      generate: 'Generate',
      generating: 'Generating…',
      replaceQueryConfirmMessage: 'Replace the current query with the generated one?',
      suggestSummary: 'Suggest name and description',
      suggestSummaryFailed: 'Could not suggest the query name and description: {{message}}',
      suggestSummaryTitle:
        'Use AI to suggest the name, label and description of the query based on the current selections',
      generatedSuccessfully:
        'Query generated: {{explanation}} Check the result and save the query if you want to keep it.',
    },
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
  filterAttributes: 'Filter attributes',
  filterMessages: 'Filter messages',
  messageTypeFilter: {
    valueRequired: 'Required value',
    valueInvalid: 'Invalid value',
    uniqueDuplicate: 'Duplicate value',
    customValidation: 'Custom validation',
    entityKeyDuplicate: 'Duplicate entity key',
    recordKeyDuplicate: 'Duplicate record key',
    nodesCount: 'Node count',
  },
  filterRecords: {
    buttonTitle: 'Filter records',
    expressionEditorHeader: 'Expression to filter records',
  },
  invalidRecord: 'Invalid record',
  nodeDefsSelector: {
    hide: 'Hide Node Definitions Selector',
    show: 'Show Node Definitions Selector',
    nodeDefFrequency: `{{nodeDefLabel}} (frequency)`,
    searchPlaceholder: 'Search variable by name',
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
    exportSelectedRecordsArenaFormat: 'Export selected records (Arena format)',
    exportRecordDocx: 'Export record (Word)',
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
  dataMatrixExport: {
    intro: `Export the **{{entity}}** data as a table with:

- one **row** for each different value of the row attributes (e.g. each species and layer);
- one **column** for each record, named after its key ({{keys}});
- in the cells, the value of the value attribute (e.g. cover).

This is the format used by vegetation analysis tools such as Turboveg, Juice and Synbiosys.`,
    layout: {
      dataMatrix: 'Data matrix',
      info: 'Table: rows and columns as shown in Data Explorer. Data matrix: one row per species (or other attribute) and one column per record, as needed by vegetation analysis tools such as Turboveg.',
      label: 'Export as',
      table: 'Table',
    },
    preview: 'Preview',
    previewRecord: '{{keys}} of record {{number}}',
    recordsAll: 'The data of all the records is exported: set a filter in Data Explorer to export only some of them.',
    recordsFiltered: 'Only the data matching the current Data Explorer filter is exported.',
    rowAttribute: 'Rows (taxon attribute name, e.g. species)',
    rowAttributeInfo:
      'Each different value of this attribute becomes a row of the table. Taxon attributes are exported with their scientific name, because unlisted taxa all have the same code.',
    secondRowAttribute: 'Second row attribute, optional (e.g. layer)',
    secondRowAttributeInfo:
      'Use it when the same species can appear more than once in a record (e.g. in different layers): each combination becomes a separate row.',
    valueAttribute: 'Values (e.g. cover)',
    valueAttributeInfo:
      'The value shown in the cells. Code attributes are exported with their code, not the label. If a row appears more than once in a record with different values, the cell contains all of them.',
  },
  dataVis: {
    errorLoadingData: 'Error loading data',
    noData: 'This query returned no data',
    noSelection:
      'Please make your selection using the left side panel or select an existing query from "Manage queries"',
  },
  viewSelectedRecord: 'View selected record',
  mapView: {
    layersControl: {
      baseLayers: 'Base layers',
      inputData: 'Input data',
      preloadedLayers: 'Preloaded layers',
      samplingPointData: 'Sampling point data',
    },
    layersPanel: {
      markers: '{{count}} markers',
      markers_one: '{{count}} marker',
      markers_other: '{{count}} markers',
    },
  },
}
