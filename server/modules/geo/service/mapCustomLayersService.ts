import {
  MAP_CUSTOM_LAYERS_MAX,
  type MapCustomLayer,
  type MapCustomLayerScope,
  validateMapCustomLayers,
} from '@core/map/customLayers/mapCustomLayer'
import {
  MapCustomLayersRepository,
  type MapCustomLayersRepository as MapCustomLayersRepositoryType,
} from '@server/modules/geo/repository/mapCustomLayersRepository'
import { newMapCustomLayersError } from '@server/modules/geo/service/mapCustomLayersErrors'

type ScopeParams = { surveyId: number; userUuid: string; scope: MapCustomLayerScope }

export type MapCustomLayersService = {
  fetchMapCustomLayers: (params: {
    surveyId: number
    userUuid: string
  }) => Promise<{ surveyLayers: MapCustomLayer[]; userLayers: MapCustomLayer[] }>
  addMapCustomLayers: (params: ScopeParams & { layers: unknown }) => Promise<MapCustomLayer[]>
  removeMapCustomLayer: (params: ScopeParams & { layerId: string }) => Promise<MapCustomLayer[]>
}

/**
 * Creates the service storing the custom map layers of a survey ("Everyone in this survey", in the survey config)
 * and of a user ("Only me", in the user prefs, per survey).
 * @param {MapCustomLayersRepositoryType} repository - The repository.
 * @returns {MapCustomLayersService} The service.
 */
export const createMapCustomLayersService = (repository: MapCustomLayersRepositoryType): MapCustomLayersService => {
  /**
   * Fetches the survey layers and the layers the user added in the survey.
   * @param {object} params - Parameters.
   * @param {number} params.surveyId - The survey id.
   * @param {string} params.userUuid - The user uuid.
   * @returns {Promise<object>} The survey layers and the user layers.
   */
  const fetchMapCustomLayers = async ({ surveyId, userUuid }: { surveyId: number; userUuid: string }) => {
    const [surveyLayers, userLayers] = await Promise.all([
      repository.fetchSurveyMapCustomLayers({ surveyId }),
      repository.fetchUserMapCustomLayers({ userUuid, surveyId }),
    ])
    return { surveyLayers, userLayers }
  }

  /**
   * Validates and appends layers to a scope.
   * @param {object} params - Parameters.
   * @param {number} params.surveyId - The survey id.
   * @param {string} params.userUuid - The user uuid.
   * @param {MapCustomLayerScope} params.scope - The scope.
   * @param {unknown} params.layers - The layers sent by the client.
   * @returns {Promise<MapCustomLayer[]>} All the layers of the scope.
   * @throws {SystemError} invalidLayers, or tooManyLayers when the limit would be exceeded.
   */
  const addMapCustomLayers = async ({ surveyId, userUuid, scope, layers }: ScopeParams & { layers: unknown }) => {
    const validLayers = validateMapCustomLayers(layers)
    if (!validLayers) throw newMapCustomLayersError('invalidLayers')
    const max = MAP_CUSTOM_LAYERS_MAX
    const result =
      scope === 'survey'
        ? await repository.appendSurveyMapCustomLayers({ surveyId, layers: validLayers, max })
        : await repository.appendUserMapCustomLayers({ userUuid, surveyId, layers: validLayers, max })
    if (!result) throw newMapCustomLayersError('tooManyLayers', { max })
    return result
  }

  /**
   * Removes a layer from a scope.
   * @param {object} params - Parameters.
   * @param {number} params.surveyId - The survey id.
   * @param {string} params.userUuid - The user uuid.
   * @param {MapCustomLayerScope} params.scope - The scope.
   * @param {string} params.layerId - The layer id.
   * @returns {Promise<MapCustomLayer[]>} The remaining layers of the scope.
   */
  const removeMapCustomLayer = async ({ surveyId, userUuid, scope, layerId }: ScopeParams & { layerId: string }) => {
    const result =
      scope === 'survey'
        ? await repository.removeSurveyMapCustomLayer({ surveyId, layerId })
        : await repository.removeUserMapCustomLayer({ userUuid, surveyId, layerId })
    return result ?? []
  }

  return { fetchMapCustomLayers, addMapCustomLayers, removeMapCustomLayer }
}

export const MapCustomLayersService = createMapCustomLayersService(MapCustomLayersRepository)
