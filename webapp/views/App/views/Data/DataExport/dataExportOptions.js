export const dataExportOptions = {
  fileFormat: 'fileFormat',
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  includeFiles: 'includeFiles',
  includeFileAttributeDefs: 'includeFileAttributeDefs',
  includeAncestorAttributes: 'includeAncestorAttributes',
  includeAnalysis: 'includeAnalysis',
  expandCategoryItems: 'expandCategoryItems',
  includeCategories: 'includeCategories',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  recordsModifiedAfter: 'recordsModifiedAfter',
  includeDateCreated: 'includeDateCreated',
  includeInternalUuids: 'includeInternalUuids',
}

export const defaultDataExportOptionsSelection = {
  [dataExportOptions.fileFormat]: 'xlsx',
  [dataExportOptions.includeCategoryItemsLabels]: true,
  [dataExportOptions.includeFiles]: false,
  [dataExportOptions.includeFileAttributeDefs]: false,
  [dataExportOptions.includeAncestorAttributes]: false,
  [dataExportOptions.includeAnalysis]: false,
  [dataExportOptions.expandCategoryItems]: false,
  [dataExportOptions.includeCategories]: false,
  [dataExportOptions.includeDataFromAllCycles]: false,
  [dataExportOptions.recordsModifiedAfter]: null,
  [dataExportOptions.includeDateCreated]: false,
  [dataExportOptions.includeInternalUuids]: false,
}
