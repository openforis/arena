import { AiDataClass, getMaxAiDataClass } from '@common/ai/features'

import type { ResolveModelParams } from '@webapp/ai/engines/resolveModel'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'

type ToolWithClass = { dataClass: AiDataClass }

type Resolved<TModel> = { model: TModel; engine: AiSelectedEngine }

/**
 * Returns the data class a turn declares: the conversation's, or data when a data tool is offered.
 * @param {object} params - Parameters.
 * @param {AiDataClass} params.conversationDataClass - Class of the conversation.
 * @param {Array} params.tools - Tools offered in the turn.
 * @returns {AiDataClass} The declared class.
 */
export const getTurnDataClass = ({
  conversationDataClass,
  tools,
}: {
  conversationDataClass: AiDataClass
  tools: ToolWithClass[]
}): AiDataClass => getMaxAiDataClass(conversationDataClass, ...tools.map((tool) => tool.dataClass))

/**
 * Model resolution of an assistant turn, passed as `resolve` to resolveAssistantEngine: selects the engine
 * with the conversation's class, then again with `data` when that engine would be offered a data tool.
 * @param {object} params - Parameters.
 * @param {ResolveModelParams} params.params - What resolveAssistantEngine asks for (feature, survey, conversation class).
 * @param {Function} params.getToolsForHosting - Returns the tools offered for a hosting class.
 * @param {Function} params.resolve - The model resolver (resolveModel, or the one injected by the caller).
 * @returns {Promise<object>} The model and the engine.
 */
export const resolveAssistantTurnModel = async <TModel>({
  params,
  getToolsForHosting,
  resolve,
}: {
  params: ResolveModelParams
  getToolsForHosting: (hostingClass: string) => ToolWithClass[]
  resolve: (params: ResolveModelParams) => Promise<Resolved<TModel>>
}): Promise<Resolved<TModel>> => {
  const resolved = await resolve(params)
  const conversationDataClass = params.dataClass ?? AiDataClass.schema
  const dataClass = getTurnDataClass({
    conversationDataClass,
    tools: getToolsForHosting(resolved.engine.hostingClass),
  })
  if (dataClass === conversationDataClass) return resolved
  // data tools are offered: declare data (same engine, see the plan's deviation 3)
  return resolve({ ...params, dataClass })
}
