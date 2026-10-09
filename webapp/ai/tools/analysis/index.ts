import type { AiTool } from '@webapp/ai/tools/types'

import { AnalysisApi, axiosAnalysisHttp, createAnalysisApi } from './analysisApi'
import { createFindCategoryItemsTool } from './findCategoryItems'
import { listEntitiesTool } from './listEntities'
import { proposeQueryTool } from './proposeQuery'
import { createRecordCountTools } from './recordCounts'
import { createRunQueryTools } from './runQuery'

/**
 * Creates the tools of the analysis area.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @returns {AiTool[]} The tools.
 */
export const createAnalysisTools = ({ api }: { api: AnalysisApi }): AiTool<any, unknown>[] => [
  listEntitiesTool,
  createFindCategoryItemsTool({ api }),
  proposeQueryTool,
  ...createRunQueryTools({ api }),
  ...createRecordCountTools({ api }),
]

export const analysisTools = createAnalysisTools({ api: createAnalysisApi({ http: axiosAnalysisHttp }) })
