import {
  PrintOrientations,
  PrintableExportFormats,
  PrintableExportScopes,
  type PrintOrientation,
  type PrintableExportFormat,
  type PrintableExportScope,
} from '@common/record/printableExport'

export type { PrintableExportFormat, PrintableExportScope, PrintOrientation }
export { PrintableExportFormats, PrintableExportScopes, PrintOrientations }

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
  exportScope = PrintableExportScopes.full,
  entityDefUuid,
  entityNodeUuid,
  orientation = PrintOrientations.portrait,
}: RecordPrintableExportUrlParams): string => {
  const query = new URLSearchParams({ lang, exportScope, orientation })
  if (exportScope === PrintableExportScopes.currentPage) {
    if (entityDefUuid) query.set('entityDefUuid', entityDefUuid)
    if (entityNodeUuid) query.set('entityNodeUuid', entityNodeUuid)
  }
  return `/api/survey/${surveyId}/record/${recordUuid}/export/${format}?${query}`
}

export const getRecordPdfExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string =>
  getRecordPrintableExportUrl({ ...params, format: PrintableExportFormats.pdf })

export const getRecordDocxExportUrl = (params: Omit<RecordPrintableExportUrlParams, 'format'>): string =>
  getRecordPrintableExportUrl({ ...params, format: PrintableExportFormats.docx })
