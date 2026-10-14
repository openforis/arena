/**
 * Gateway engine: A's gateway model (POST /api/ai/model) for one provider (an account provider or Arena default).
 */
import type { LanguageModel } from 'ai'

import SystemError, { StatusCodes } from '@core/systemError'

import type { AiEngine, AiEngineModelOptions, AiSelectedEngine } from './types'

// the server calls exactly the provider the request names (no fallback)
export type GatewayModelFactory = (options: AiEngineModelOptions & { providerId: string }) => LanguageModel

/**
 * Creates the gateway engine of a selected provider.
 * @param {object} params - Parameters.
 * @param {AiSelectedEngine} params.engine - Engine chosen by selectEngine (with its providerId).
 * @param {GatewayModelFactory} params.createGatewayModel - Creates the gateway model for a request.
 * @returns {AiEngine} The engine.
 */
export const createGatewayEngine = ({
  engine,
  createGatewayModel,
}: {
  engine: AiSelectedEngine
  createGatewayModel: GatewayModelFactory
}): AiEngine => {
  const { providerId } = engine
  // without a provider id the server would pick one: refused, so a request never goes to an unnamed provider
  if (engine.id !== 'gateway' || !providerId) {
    throw new SystemError('aiNoEngineAvailable', { reasons: ['notAvailable'] }, StatusCodes.CONFLICT)
  }
  return { ...engine, createModel: (options) => createGatewayModel({ ...options, providerId }) }
}
