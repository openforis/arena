import type { ArenaCategory, ArenaJobContext } from '@openforis/arena-core'

import type FileZip from '@server/utils/file/fileZip'

import type { ItextTranslations, XFormBind, XFormBodyControl, XmlElement } from './model/xform'

/**
 * Context shared by the ODK import jobs: each job adds the props the following ones read.
 */
export interface OdkImportJobContext extends ArenaJobContext {
  filePath?: string
  cycle?: string
  // overrides of the survey to create (e.g. its name)
  newSurvey?: { name?: string }
  // form reader
  xform?: XmlElement
  itextTranslations?: ItextTranslations
  languages?: string[]
  defaultLanguage?: string
  // node defs import
  bindsByPath?: Map<string, XFormBind>
  repeatPaths?: Set<string>
  bodyControlsByPath?: Map<string, XFormBodyControl>
  // categories import
  categoriesByKey?: Record<string, ArenaCategory>
  // submissions import
  submissionFileZip?: FileZip
  submissionEntryNames?: string[]
  submittedCount?: number
  skippedCount?: number
}
