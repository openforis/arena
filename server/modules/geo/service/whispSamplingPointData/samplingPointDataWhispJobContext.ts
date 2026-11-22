import type { ArenaCategory, ArenaJobContext } from '@openforis/arena-core'

/**
 * Context shared by the Whisp sampling point data jobs.
 */
export interface SamplingPointDataWhispJobContext extends ArenaJobContext {
  whispCategoryFilePath?: string
  numericColumns?: string[]
  category?: ArenaCategory
}
