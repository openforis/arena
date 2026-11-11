import { type MapCustomLayer, sanitizeMapCustomLayers } from '@core/map/customLayers/mapCustomLayer'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { db } from '@server/db/db'

// the pg-promise method used here; tests pass a fake
export type MapCustomLayersDbClient = {
  oneOrNone: <T>(
    query: string,
    values: Record<string, unknown>,
    callback: (row: T | null) => unknown
  ) => Promise<unknown>
}

type LayersRow = { layers: unknown } | null

export type MapCustomLayersRepository = {
  fetchSurveyMapCustomLayers: (
    params: { surveyId: number },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[]>
  appendSurveyMapCustomLayers: (
    params: { surveyId: number; layers: MapCustomLayer[]; max: number },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[] | null>
  removeSurveyMapCustomLayer: (
    params: { surveyId: number; layerId: string },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[] | null>
  fetchUserMapCustomLayers: (
    params: { userUuid: string; surveyId: number },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[]>
  appendUserMapCustomLayers: (
    params: { userUuid: string; surveyId: number; layers: MapCustomLayer[]; max: number },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[] | null>
  removeUserMapCustomLayer: (
    params: { userUuid: string; surveyId: number; layerId: string },
    client?: MapCustomLayersDbClient
  ) => Promise<MapCustomLayer[] | null>
}

const defaultClient = db as unknown as MapCustomLayersDbClient
const surveyKey = Survey.configKeys.mapCustomLayers
const prefsKey = User.keysPrefs.mapCustomLayers

/**
 * Reads the layers column of a row; anything malformed is dropped.
 * @param {LayersRow} row - The row.
 * @returns {MapCustomLayer[]|null} The layers, or null when no row was returned.
 */
const toLayersOrNull = (row: LayersRow): MapCustomLayer[] | null => (row ? sanitizeMapCustomLayers(row.layers) : null)

/**
 * Builds the path of the layers of a survey in the user prefs.
 * @param {number} surveyId - The survey id.
 * @returns {string[]} The jsonb path.
 */
const userLayersPath = (surveyId: number): string[] => [prefsKey, String(surveyId)]

/**
 * Builds the SQL expression selecting, in order, the incoming layers whose id is not stored yet, so a retried request
 * does not duplicate layers and only the effective additions count for the limit. It reads the row being updated, so
 * Postgres re-evaluates it on the newest row version when two requests race.
 * @param {string} stored - The SQL expression of the stored layers array.
 * @returns {string} The SQL expression of the layers to append.
 */
const freshLayersSql = (stored: string): string =>
  `(SELECT coalesce(jsonb_agg(incoming.layer ORDER BY incoming.position), '[]'::jsonb)
    FROM jsonb_array_elements($/layers:json/::jsonb) WITH ORDINALITY AS incoming(layer, position)
    WHERE NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(${stored}) AS saved(layer) WHERE saved.layer ->> 'id' = incoming.layer ->> 'id'
    ))`

/**
 * Fetches the layers every user of a survey sees.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]>} The layers.
 */
const fetchSurveyMapCustomLayers = async (
  { surveyId }: { surveyId: number },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[]> =>
  (await client.oneOrNone<LayersRow>(
    `SELECT config -> '${surveyKey}' AS layers FROM survey WHERE id = $/surveyId/`,
    { surveyId },
    (row) => toLayersOrNull(row) ?? []
  )) as MapCustomLayer[]

/**
 * Appends layers to a survey in one statement, so two editors adding at once cannot exceed the limit.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {MapCustomLayer[]} params.layers - The layers to append.
 * @param {number} params.max - The maximum number of layers.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]|null>} All the survey layers, or null when the limit would be exceeded.
 */
const appendSurveyMapCustomLayers = async (
  { surveyId, layers, max }: { surveyId: number; layers: MapCustomLayer[]; max: number },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[] | null> => {
  const stored = `coalesce(config -> '${surveyKey}', '[]'::jsonb)`
  const fresh = freshLayersSql(stored)
  return (await client.oneOrNone<LayersRow>(
    `UPDATE survey
    SET config = jsonb_set(coalesce(config, '{}'::jsonb), '{${surveyKey}}', ${stored} || ${fresh})
    WHERE id = $/surveyId/
      AND jsonb_array_length(${stored}) + jsonb_array_length(${fresh}) <= $/max/
    RETURNING config -> '${surveyKey}' AS layers`,
    { surveyId, layers, max },
    toLayersOrNull
  )) as MapCustomLayer[] | null
}

/**
 * Removes a layer from a survey, keeping the order of the others.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.layerId - The layer id.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]|null>} The remaining layers, or null when the survey has none.
 */
const removeSurveyMapCustomLayer = async (
  { surveyId, layerId }: { surveyId: number; layerId: string },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[] | null> =>
  (await client.oneOrNone<LayersRow>(
    `UPDATE survey
    SET config = jsonb_set(
      config,
      '{${surveyKey}}',
      coalesce(
        (SELECT jsonb_agg(layer ORDER BY position)
        FROM jsonb_array_elements(config -> '${surveyKey}') WITH ORDINALITY AS item(layer, position)
        WHERE layer ->> 'id' <> $/layerId/),
        '[]'::jsonb
      )
    )
    WHERE id = $/surveyId/
      AND jsonb_typeof(config -> '${surveyKey}') = 'array'
    RETURNING config -> '${surveyKey}' AS layers`,
    { surveyId, layerId },
    toLayersOrNull
  )) as MapCustomLayer[] | null

/**
 * Fetches the layers a user added for themselves in a survey.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - The user uuid.
 * @param {number} params.surveyId - The survey id.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]>} The layers.
 */
const fetchUserMapCustomLayers = async (
  { userUuid, surveyId }: { userUuid: string; surveyId: number },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[]> =>
  (await client.oneOrNone<LayersRow>(
    `SELECT prefs #> $/path/::text[] AS layers FROM "user" WHERE uuid = $/userUuid/`,
    { userUuid, path: userLayersPath(surveyId) },
    (row) => toLayersOrNull(row) ?? []
  )) as MapCustomLayer[]

/**
 * Appends layers to the user prefs of a survey in one statement.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - The user uuid.
 * @param {number} params.surveyId - The survey id.
 * @param {MapCustomLayer[]} params.layers - The layers to append.
 * @param {number} params.max - The maximum number of layers.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]|null>} All the user layers of the survey, or null when the limit would be exceeded.
 */
const appendUserMapCustomLayers = async (
  { userUuid, surveyId, layers, max }: { userUuid: string; surveyId: number; layers: MapCustomLayer[]; max: number },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[] | null> => {
  const stored = `coalesce(prefs #> $/path/::text[], '[]'::jsonb)`
  const fresh = freshLayersSql(stored)
  return (await client.oneOrNone<LayersRow>(
    `UPDATE "user"
    SET prefs = jsonb_set(
      coalesce(prefs, '{}'::jsonb),
      '{${prefsKey}}',
      coalesce(prefs -> '${prefsKey}', '{}'::jsonb) || jsonb_build_object($/surveyKey/::text, ${stored} || ${fresh})
    )
    WHERE uuid = $/userUuid/
      AND jsonb_array_length(${stored}) + jsonb_array_length(${fresh}) <= $/max/
    RETURNING prefs #> $/path/::text[] AS layers`,
    { userUuid, surveyKey: String(surveyId), path: userLayersPath(surveyId), layers, max },
    toLayersOrNull
  )) as MapCustomLayer[] | null
}

/**
 * Removes a layer from the user prefs of a survey, keeping the order of the others.
 * @param {object} params - Parameters.
 * @param {string} params.userUuid - The user uuid.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.layerId - The layer id.
 * @param {MapCustomLayersDbClient} [client] - The database client.
 * @returns {Promise<MapCustomLayer[]|null>} The remaining layers, or null when the user has none in the survey.
 */
const removeUserMapCustomLayer = async (
  { userUuid, surveyId, layerId }: { userUuid: string; surveyId: number; layerId: string },
  client: MapCustomLayersDbClient = defaultClient
): Promise<MapCustomLayer[] | null> =>
  (await client.oneOrNone<LayersRow>(
    `UPDATE "user"
    SET prefs = jsonb_set(
      prefs,
      $/path/::text[],
      coalesce(
        (SELECT jsonb_agg(layer ORDER BY position)
        FROM jsonb_array_elements(prefs #> $/path/::text[]) WITH ORDINALITY AS item(layer, position)
        WHERE layer ->> 'id' <> $/layerId/),
        '[]'::jsonb
      )
    )
    WHERE uuid = $/userUuid/
      AND jsonb_typeof(prefs #> $/path/::text[]) = 'array'
    RETURNING prefs #> $/path/::text[] AS layers`,
    { userUuid, path: userLayersPath(surveyId), layerId },
    toLayersOrNull
  )) as MapCustomLayer[] | null

export const MapCustomLayersRepository: MapCustomLayersRepository = {
  fetchSurveyMapCustomLayers,
  appendSurveyMapCustomLayers,
  removeSurveyMapCustomLayer,
  fetchUserMapCustomLayers,
  appendUserMapCustomLayers,
  removeUserMapCustomLayer,
}
