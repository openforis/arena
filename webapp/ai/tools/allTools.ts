/**
 * Every assistant tool. getTools filters this list by area, permission and policy.
 * D2 / D3 append their own lists here.
 */
import { viewGetCurrentTool } from './common/viewGetCurrent'
import { expressionCheckTool } from './design/expressionCheck'
import { nodeDefGetTool } from './design/nodeDefGet'
import { nodeDefSearchTool } from './design/nodeDefSearch'
import { surveyGetOverviewTool } from './design/surveyGetOverview'
import type { AiTool } from './types'

export const ALL_TOOLS: AiTool[] = [
  surveyGetOverviewTool,
  nodeDefGetTool,
  nodeDefSearchTool,
  viewGetCurrentTool,
  expressionCheckTool,
]
