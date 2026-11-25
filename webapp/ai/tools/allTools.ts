/**
 * Every assistant tool. getTools filters this list by area, permission and policy.
 */
import { analysisTools } from './analysis'
import { cleaningTools } from './cleaning'
import { conversationSetTitleTool } from './common/conversationSetTitle'
import { viewGetCurrentTool } from './common/viewGetCurrent'
import { batchTools } from './design/batchTools'
import { categoryItemLabelsProposeSetTool } from './design/categoryItemLabelsProposeSet'
import { categoryItemsListMissingLabelsTool } from './design/categoryItemsListMissingLabels'
import { expressionCheckTool } from './design/expressionCheck'
import { expressionsProposeSetTool } from './design/expressionsProposeSet'
import { labelsProposeSetTool } from './design/labelsProposeSet'
import { nodeDefGetTool } from './design/nodeDefGet'
import { nodeDefProposeCreateTool } from './design/nodeDefProposeCreate'
import { nodeDefProposeUpdateTool } from './design/nodeDefProposeUpdate'
import { nodeDefSearchTool } from './design/nodeDefSearch'
import { categoriesListTool, taxonomiesListTool } from './design/refLists'
import { surveyGetOverviewTool } from './design/surveyGetOverview'
import { surveyGetValidationTool } from './design/surveyGetValidation'
import { surveyListMissingTextsTool } from './design/surveyListMissingTexts'
import { docsSearchTool } from './help/docsSearch'
import type { AiTool } from './types'

export const ALL_TOOLS: AiTool[] = [
  surveyGetOverviewTool,
  nodeDefGetTool,
  nodeDefSearchTool,
  surveyGetValidationTool,
  viewGetCurrentTool,
  conversationSetTitleTool,
  expressionCheckTool,
  nodeDefProposeCreateTool,
  nodeDefProposeUpdateTool,
  labelsProposeSetTool,
  expressionsProposeSetTool,
  surveyListMissingTextsTool,
  categoriesListTool,
  taxonomiesListTool,
  categoryItemsListMissingLabelsTool,
  categoryItemLabelsProposeSetTool,
  ...batchTools,
  docsSearchTool,
  ...analysisTools,
  ...cleaningTools,
]
