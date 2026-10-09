/**
 * Gateway engine: A's gateway model (POST /api/ai/model), described with the hosting class of the AI settings.
 */
import type { LanguageModel } from 'ai'

import SystemError, { StatusCodes } from '@core/systemError'

import { getGatewayEngineInfo } from './engineInfo'
import type { AiEngine, AiEngineModelOptions, AiGatewayCapability } from './types'

export type GatewayModelFactory = (options: AiEngineModelOptions) => LanguageModel

/**
 * Creates the gateway engine.
 * @param {object} params - Parameters.
 * @param {AiGatewayCapability} params.gateway - Gateway capability.
 * @param {GatewayModelFactory} params.createGatewayModel - Creates the gateway model for a request.
 * @returns {AiEngine} The engine.
 */
export const createGatewayEngine = ({
  gateway,
  createGatewayModel,
}: {
  gateway: AiGatewayCapability
  createGatewayModel: GatewayModelFactory
}): AiEngine => {
  const info = getGatewayEngineInfo(gateway)
  if (!info) throw new SystemError('aiNoEngineAvailable', { reasons: ['gatewayNotConfigured'] }, StatusCodes.CONFLICT)
  return { ...info, createModel: (options) => createGatewayModel(options) }
}
