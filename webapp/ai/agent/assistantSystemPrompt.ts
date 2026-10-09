/**
 * System prompt of a turn, by area, from the tool context.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { buildAssistantAnalysisPrompt } from '@common/ai/prompts/assistantAnalysis'
import { buildAssistantDesignPrompt } from '@common/ai/prompts/assistantDesign'
import { buildAssistantHelpPrompt } from '@common/ai/prompts/assistantHelp'
import { getEffectiveQueryLang } from '@common/ai/tasks/dataQuery'

import type { AiCurrentView, AiToolContext } from '@webapp/ai/tools/types'

export type AssistantPromptArea = 'design' | 'help' | 'analysis'

/**
 * Describes the current view for the model.
 * @param {AiCurrentView} view - Current view.
 * @param {object|null} survey - Survey (null: the selected node definition is not described).
 * @returns {string|null} E.g. "Module: designer / formDesigner. Selected node definition: `tree`."; null without module.
 */
export const describeView = (view: AiCurrentView, survey: any): string | null => {
  if (!view.module) return null
  const modulePath = [view.module, view.subModule].filter(Boolean).join(' / ')
  const selected = survey && view.selectedNodeDefUuid ? Survey.getNodeDefByUuid(view.selectedNodeDefUuid)(survey) : null
  const selectedText = selected ? ` Selected node definition: \`${NodeDef.getName(selected)}\`.` : ''
  return `Module: ${modulePath}.${selectedText}`
}

/**
 * Builds the system prompt of a turn.
 * @param {object} params - Parameters.
 * @param {AssistantPromptArea} params.area - Area.
 * @param {AiToolContext} params.ctx - Tool context of the turn.
 * @param {string|null} params.outline - Handbook outline (Help only).
 * @param {boolean} [params.dataToolsAvailable] - Whether a data tool is offered in the turn (Analysis).
 * @returns {string} The system prompt.
 */
export const buildAssistantSystemPrompt = ({
  area,
  ctx,
  outline,
  dataToolsAvailable = false,
}: {
  area: AssistantPromptArea
  ctx: AiToolContext
  outline: string | null
  dataToolsAvailable?: boolean
}): string => {
  switch (area) {
    case 'design': {
      const surveyInfo = Survey.getSurveyInfo(ctx.survey)
      return buildAssistantDesignPrompt({
        uiLang: ctx.uiLang,
        surveyName: Survey.getName(surveyInfo),
        surveyLabel: Survey.getLabel(surveyInfo, ctx.lang),
        languages: Survey.getLanguages(surveyInfo) as string[],
        cycle: ctx.cycle,
        viewDescription: describeView(ctx.getCurrentView(), ctx.survey),
      })
    }
    case 'help':
      return buildAssistantHelpPrompt({
        uiLang: ctx.uiLang,
        outline,
        // no survey: the module names only (deviation 9)
        viewDescription: describeView(ctx.getCurrentView(), null),
      })
    case 'analysis':
      return buildAssistantAnalysisPrompt({
        survey: ctx.survey,
        cycle: ctx.cycle,
        lang: getEffectiveQueryLang({ survey: ctx.survey, lang: ctx.lang }),
        uiLang: ctx.uiLang,
        viewDescription: describeView(ctx.getCurrentView(), ctx.survey),
        dataToolsAvailable,
      })
    default:
      throw new Error(`Unknown assistant area: ${area}`)
  }
}
