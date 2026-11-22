export const DataImportTemplateTypes = {
  specific: 'specific',
  generic: 'generic',
} as const

export type DataImportTemplateType = (typeof DataImportTemplateTypes)[keyof typeof DataImportTemplateTypes]
