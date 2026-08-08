export type PrintableExportFormat = 'pdf' | 'docx'
export type PrintableExportScope = 'full' | 'currentPage'
export type PrintOrientation = 'portrait' | 'landscape'

export type RecordPrintableExportUrlParams = {
  surveyId: number | string
  recordUuid: string
  lang: string
  format: PrintableExportFormat
  exportScope?: PrintableExportScope
  entityDefUuid?: string
  entityNodeUuid?: string
  orientation?: PrintOrientation
}

export const getRecordPrintableExportUrl = ({
  surveyId,
  recordUuid,
  lang,
  format,
  exportScope = 'full',
  entityDefUuid,
  entityNodeUuid,
  orientation = 'portrait',
}: RecordPrintableExportUrlParams): string => {
  const query = new URLSearchParams({ lang, exportScope, orientation })
  if (exportScope === 'currentPage') {
    if (entityDefUuid) query.set('entityDefUuid', entityDefUuid)
    if (entityNodeUuid) query.set('entityNodeUuid', entityNodeUuid)
  }
  return `/api/survey/${surveyId}/record/${recordUuid}/export/${format}?${query}`
}

export const getRecordPdfExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string =>
  getRecordPrintableExportUrl({ ...params, format: 'pdf' })

export const getRecordDocxExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string =>
  getRecordPrintableExportUrl({ ...params, format: 'docx' })
