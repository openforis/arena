import type { MapServiceCapabilities } from '@core/map/customLayers/mapServiceCapabilities'
import { buildCapabilitiesUrls, parseServiceUrl } from '@server/modules/geo/service/mapCapabilities/capabilitiesUrl'
import {
  createSafeHttpFetcher,
  type SafeHttpFetcher,
} from '@server/modules/geo/service/mapCapabilities/safeHttpFetcher'
import { parseWmsCapabilities, WMS_ROOT_NAMES } from '@server/modules/geo/service/mapCapabilities/wmsCapabilitiesParser'
import { parseWmtsCapabilities } from '@server/modules/geo/service/mapCapabilities/wmtsCapabilitiesParser'
import { localName, parseXmlDocument } from '@server/modules/geo/service/mapCapabilities/xmlElements'
import { isMapCustomLayersError, newMapCustomLayersError } from '@server/modules/geo/service/mapCustomLayersErrors'

export type MapCapabilitiesService = {
  fetchCapabilities: (urlValue: unknown) => Promise<MapServiceCapabilities>
}

/**
 * Parses a GetCapabilities response.
 * @param {object} params - Parameters.
 * @param {string} params.xml - The response body.
 * @param {string} params.requestUrl - The URL it was fetched from.
 * @returns {MapServiceCapabilities} The summary.
 * @throws {SystemError} notCapabilities for other documents (e.g. exception reports), noLayers when nothing is named.
 */
export const parseCapabilitiesXml = ({
  xml,
  requestUrl,
}: {
  xml: string
  requestUrl: string
}): MapServiceCapabilities => {
  const root = parseXmlDocument(xml)
  const rootName = localName(root?.name)
  let capabilities: MapServiceCapabilities | null = null
  if (root && WMS_ROOT_NAMES.includes(rootName)) capabilities = parseWmsCapabilities({ root, requestUrl })
  else if (root && rootName === 'Capabilities') capabilities = parseWmtsCapabilities({ root, requestUrl })
  if (!capabilities) throw newMapCustomLayersError('notCapabilities')
  if (capabilities.layers.length === 0) throw newMapCustomLayersError('noLayers')
  return capabilities
}

/**
 * Creates the service that reads WMS / WMTS capabilities for the "Add WMS / WMTS / XYZ" dialog.
 * @param {SafeHttpFetcher} fetcher - The SSRF-safe fetcher.
 * @returns {MapCapabilitiesService} The service.
 */
export const createMapCapabilitiesService = ({ fetchText }: SafeHttpFetcher): MapCapabilitiesService => {
  /**
   * Fetches the capabilities of a service, trying WMS and then WMTS when the URL does not say which.
   * @param {unknown} urlValue - The service URL typed by the user.
   * @returns {Promise<MapServiceCapabilities>} The summary.
   * @throws {SystemError} A map custom layers error.
   */
  const fetchCapabilities = async (urlValue: unknown): Promise<MapServiceCapabilities> => {
    const candidates = buildCapabilitiesUrls(parseServiceUrl(urlValue))
    let lastError: unknown = newMapCustomLayersError('notCapabilities')
    for (const requestUrl of candidates) {
      try {
        const { body } = await fetchText(new URL(requestUrl))
        return parseCapabilitiesXml({ xml: body, requestUrl })
      } catch (error) {
        // only "this is not that service" moves on to the next candidate; blocked or slow hosts stop here
        if (!isMapCustomLayersError(error, ['notCapabilities', 'fetchFailed'])) throw error
        lastError = error
      }
    }
    throw lastError
  }
  return { fetchCapabilities }
}

export const MapCapabilitiesService = createMapCapabilitiesService(createSafeHttpFetcher())
