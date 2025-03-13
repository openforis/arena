import { FileFormats } from '@core/fileFormats'

export const dataExportOptions = {
  fileFormat: 'fileFormat',
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  includeFiles: 'includeFiles',
  includeFileAttributeDefs: 'includeFileAttributeDefs',
  includeAncestorAttributes: 'includeAncestorAttributes',
  exportSingleEntitiesIntoSeparateFiles: 'exportSingleEntitiesIntoSeparateFiles',
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
  [dataExportOptions.exportSingleEntitiesIntoSeparateFiles]: false,
  [dataExportOptions.includeAnalysis]: false,
  [dataExportOptions.expandCategoryItems]: false,
  [dataExportOptions.includeCategories]: false,
  [dataExportOptions.includeDataFromAllCycles]: false,
  [dataExportOptions.recordsModifiedAfter]: null,
  [dataExportOptions.includeDateCreated]: false,
  [dataExportOptions.includeInternalUuids]: false,
}

export const dataImportNonCompatibilityByOption = {
  [dataExportOptions.includeCategoryItemsLabels]: true,
  [dataExportOptions.includeAncestorAttributes]: true,
  [dataExportOptions.exportSingleEntitiesIntoSeparateFiles]: true,
  [dataExportOptions.includeAnalysis]: true,
  [dataExportOptions.expandCategoryItems]: true,
  [dataExportOptions.includeDateCreated]: true,
  [dataExportOptions.includeInternalUuids]: true,
}
