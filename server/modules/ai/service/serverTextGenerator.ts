import type { User } from '@openforis/arena-core'

import type { AiGenerateText } from '@common/ai/llm'

import * as ModelClient from './modelClient'

type ServerTextGeneratorDeps = { generate: typeof ModelClient.generate }

/**
 * Text generator for the shared AI tasks run on the server (jobs): gating, provider resolution, survey AI
 * policy, prompt cap and telemetry are applied by modelClient.
 * @param {object} params - Parameters.
 * @param {User} params.user - Acting user.
 * @param {string} params.feature - Feature key.
 * @param {number|null} params.surveyId - Survey whose content is sent.
 * @param {ServerTextGeneratorDeps} [deps] - Dependencies (tests).
 * @returns {AiGenerateText} The generator.
 */
export const createServerTextGenerator =
  (
    { user, feature, surveyId }: { user: User; feature: string; surveyId: number | null },
    deps: ServerTextGeneratorDeps = { generate: ModelClient.generate }
  ): AiGenerateText =>
  async ({ system, prompt, signal }) => {
    const { text } = await deps.generate({ user, feature, surveyId, system, prompt, signal })
    return text
  }
