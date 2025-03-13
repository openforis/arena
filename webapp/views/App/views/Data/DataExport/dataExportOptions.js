import { FileFormats } from '@core/fileFormats'

export const dataExportOptions = {
  fileFormat: 'fileFormat',
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  includeFiles: 'includeFiles',
  includeFileAttributeDefs: 'includeFileAttributeDefs',
  includeAncestorAttributes: 'includeAncestorAttributes',
  exportSingleEntitiesInSeparateFiles: 'exportSingleEntitiesInSeparateFiles',
  includeAnalysis: 'includeAnalysis',
  expandCategoryItems: 'expandCategoryItems',
  includeCategories: 'includeCategories',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  recordsModifiedAfter: 'recordsModifiedAfter',
  includeDateCreated: 'includeDateCreated',
  includeInternalUuids: 'includeInternalUuids',
}

export const defaultDataExportOptionsSelection = {
  [dataExportOptions.fileFormat]: FileFormats.xlsx,
  [dataExportOptions.includeCategoryItemsLabels]: true,
  [dataExportOptions.includeFiles]: false,
  [dataExportOptions.includeFileAttributeDefs]: false,
  [dataExportOptions.includeAncestorAttributes]: false,
  [dataExportOptions.exportSingleEntitiesInSeparateFiles]: false,
  [dataExportOptions.includeAnalysis]: false,
  [dataExportOptions.expandCategoryItems]: false,
  [dataExportOptions.includeCategories]: false,
  [dataExportOptions.includeDataFromAllCycles]: false,
  [dataExportOptions.recordsModifiedAfter]: null,
  [dataExportOptions.includeDateCreated]: false,
  [dataExportOptions.includeInternalUuids]: false,
}
