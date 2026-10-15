import { type AiDataClass, getAiFeatureMinDataClass, getMaxAiDataClass } from '@common/ai/features'

import type { AiPolicy } from '@common/ai/policy'

import type { ResolveModelParams } from '@webapp/ai/engines/resolveModel'

type ToolWithClass = { dataClass: AiDataClass }

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
 * Model resolution of an assistant turn, passed as `resolve` to resolveAssistantEngine: the resolver selects the
 * engine with the conversation's class, asks the turn which class it needs for that engine (data when it is offered
 * a data tool, by the policy the engine was selected with), and goes on with that class. One call, so a consent is
 * asked once, for what the turn sends.
 * @param {object} params - Parameters.
 * @param {ResolveModelParams} params.params - What resolveAssistantEngine asks for (feature, survey, conversation class).
 * @param {Function} params.getToolsForHosting - Returns the tools offered for a hosting class under a policy.
 * @param {Function} params.resolve - The model resolver (resolveModel, or the one injected by the caller).
 * @returns {Promise<object>} The resolver's result (model, engine and policy).
 */
export const resolveAssistantTurnModel = <TResolved>({
  params,
  getToolsForHosting,
  resolve,
}: {
  params: ResolveModelParams
  getToolsForHosting: (hostingClass: string, policy: AiPolicy | null) => ToolWithClass[]
  resolve: (params: ResolveModelParams) => Promise<TResolved>
}): Promise<TResolved> => {
  const conversationDataClass = params.dataClass ?? getAiFeatureMinDataClass(params.feature)
  return resolve({
    ...params,
    declareDataClass: ({ engine, policy }) =>
      getTurnDataClass({ conversationDataClass, tools: getToolsForHosting(engine.hostingClass, policy) }),
  })
}
