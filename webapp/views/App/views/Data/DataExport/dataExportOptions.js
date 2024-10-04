export const dataExportOptions = {
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  expandCategoryItems: 'expandCategoryItems',
  includeCategories: 'includeCategories',
  includeAncestorAttributes: 'includeAncestorAttributes',
  includeAnalysis: 'includeAnalysis',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  includeFiles: 'includeFiles',
  recordsModifiedAfter: 'recordsModifiedAfter',
  includeInternalUuids: 'includeInternalUuids',
}

export const defaultDataExportOptionsSelection = {
  [dataExportOptions.includeCategoryItemsLabels]: true,
  [dataExportOptions.expandCategoryItems]: false,
  [dataExportOptions.includeCategories]: false,
  [dataExportOptions.includeAncestorAttributes]: false,
  [dataExportOptions.includeAnalysis]: false,
  [dataExportOptions.includeDataFromAllCycles]: false,
  [dataExportOptions.includeFiles]: false,
  [dataExportOptions.recordsModifiedAfter]: null,
  [dataExportOptions.includeInternalUuids]: false,
}
