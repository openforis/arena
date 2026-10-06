import type { User } from '@openforis/arena-core'

import type { AiGenerateText } from '@common/ai/llm'

import * as ModelClient from './modelClient'

/**
 * Text generator for the shared AI tasks run on the server (jobs): gating, provider resolution,
 * prompt cap and telemetry are applied by modelClient.
 * @param {object} params - Parameters.
 * @param {User} params.user - Acting user.
 * @param {string} params.feature - Feature key.
 * @returns {AiGenerateText} The generator.
 */
export const createServerTextGenerator =
  ({ user, feature }: { user: User; feature: string }): AiGenerateText =>
  async ({ system, prompt, signal }) => {
    const { text } = await ModelClient.generate({ user, feature, system, prompt, signal })
    return text
  }
