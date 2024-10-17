export const dataExportOptions = {
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  expandCategoryItems: 'expandCategoryItems',
  includeCategories: 'includeCategories',
  includeAncestorAttributes: 'includeAncestorAttributes',
  includeAnalysis: 'includeAnalysis',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  includeFiles: 'includeFiles',
  includeFileAttributeDefs: 'includeFileAttributeDefs',
  recordsModifiedAfter: 'recordsModifiedAfter',
  includeInternalUuids: 'includeInternalUuids',
  includeDateCreated: 'includeDateCreated',
}

export const defaultDataExportOptionsSelection = {
  [dataExportOptions.includeCategoryItemsLabels]: true,
  [dataExportOptions.expandCategoryItems]: false,
  [dataExportOptions.includeCategories]: false,
  [dataExportOptions.includeAncestorAttributes]: false,
  [dataExportOptions.includeAnalysis]: false,
  [dataExportOptions.includeDataFromAllCycles]: false,
  [dataExportOptions.includeFiles]: false,
  [dataExportOptions.includeFileAttributeDefs]: false,
  [dataExportOptions.recordsModifiedAfter]: null,
  [dataExportOptions.includeInternalUuids]: false,
  [dataExportOptions.includeDateCreated]: false,
}
