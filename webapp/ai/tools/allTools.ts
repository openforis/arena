/**
 * Every assistant tool. getTools filters this list by area, permission and policy.
 * D2 / D3 append their own lists here.
 */
import { viewGetCurrentTool } from './common/viewGetCurrent'
import { expressionCheckTool } from './design/expressionCheck'
import { expressionsProposeSetTool } from './design/expressionsProposeSet'
import { labelsProposeSetTool } from './design/labelsProposeSet'
import { nodeDefGetTool } from './design/nodeDefGet'
import { nodeDefProposeCreateTool } from './design/nodeDefProposeCreate'
import { nodeDefProposeUpdateTool } from './design/nodeDefProposeUpdate'
import { nodeDefSearchTool } from './design/nodeDefSearch'
import { surveyGetOverviewTool } from './design/surveyGetOverview'
import type { AiTool } from './types'

export const ALL_TOOLS: AiTool[] = [
  surveyGetOverviewTool,
  nodeDefGetTool,
  nodeDefSearchTool,
  viewGetCurrentTool,
  expressionCheckTool,
  nodeDefProposeCreateTool,
  nodeDefProposeUpdateTool,
  labelsProposeSetTool,
  expressionsProposeSetTool,
]
