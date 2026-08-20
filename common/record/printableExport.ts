/**
 * Shared constants for record printable document export (PDF / Word).
 */

export const PrintableExportFormats = {
  pdf: 'pdf',
  docx: 'docx',
} as const

export type PrintableExportFormat = (typeof PrintableExportFormats)[keyof typeof PrintableExportFormats]

export const PrintableExportScopes = {
  full: 'full',
  currentPage: 'currentPage',
} as const

export type PrintableExportScope = (typeof PrintableExportScopes)[keyof typeof PrintableExportScopes]

export const PrintOrientations = {
  portrait: 'portrait',
  landscape: 'landscape',
} as const

export type PrintOrientation = (typeof PrintOrientations)[keyof typeof PrintOrientations]
