import type { ArenaJobContext } from '@openforis/arena-core'

/**
 * Context of the survey compare and survey compare apply jobs.
 */
export interface SurveyCompareJobContext extends ArenaJobContext {
  // source: uploaded survey file (path or id of the file kept in the temp storage) or another survey on this server
  filePath?: string
  sourceFileId?: string
  sourceSurveyId?: number
  // node defs matched by the user (target uuid by source uuid)
  manualMatches?: { [sourceUuid: string]: string }
  resultFileId?: string
  // apply job: ids of the changes to apply, applied and skipped
  selectedIds?: string[]
  appliedIds?: string[]
  skippedIds?: string[]
}
