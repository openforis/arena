import React, { useEffect, useState, useRef, useCallback } from 'react'
import { LayersControl, LayerGroup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'
import axios from 'axios'
import L from 'leaflet'
require('@webapp/components/MapContainer/L.KML')

import * as SurveyFile from '@core/survey/surveyFile'
import * as API from '@webapp/service/api'
import { FileUtils } from '@webapp/utils/fileUtils'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { ZipUtils } from '@webapp/utils/zipUtils'

import { useMapLayerAdd } from '../common'

const createGeoJsonLayer = async (data) => {
  const geoLayer = L.geoJSON(data)
  return geoLayer
}

const createKmzLayer = async (blob) => {
  const kmlTexts = []
  await ZipUtils.forEachFileInZip(blob, async (relativePath, fileEntry) => {
    if (relativePath.endsWith('.kml')) {
      const fileData = await fileEntry.async('string')
      kmlTexts.push(fileData)
    }
  })
  const parser = new DOMParser()
  // Only add the first KML found (or extend for multiple)
  if (kmlTexts.length > 0) {
    const kml = parser.parseFromString(kmlTexts[0], 'text/xml')
    const kmlLayer = new L.KML(kml)
    return kmlLayer
  }
  return null
}

export const PreloadedLayer = (props) => {
  const { preloadedMapLayer } = props

  const map = useMap()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const [leafletLayer, setLeafletLayer] = useState(null)
  const layerRef = useRef(null)

  const fileUuid = SurveyFile.getUuid(preloadedMapLayer)

  const layerName = SurveyFile.getLabel(lang)(preloadedMapLayer)

  const removePreviousLayer = useCallback(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
      setLeafletLayer(null)
    }
  }, [map])

  const fetchAndSetLayer = useCallback(async () => {
    if (!fileUuid || !surveyId) return
    removePreviousLayer()
    const fileName = SurveyFile.getName(preloadedMapLayer)
    const extension = FileUtils.getExtension(fileName)?.toLowerCase()
    const url = API.getSurveyFileDownloadUrl({ surveyId, fileUuid })
    try {
      let layer = null
      if (extension === 'geojson' || extension === 'json') {
        const { data } = await axios.get(url)
        layer = await createGeoJsonLayer(data)
      } else if (extension === 'kmz') {
        const response = await axios.get(url, { responseType: 'blob' })
        layer = await createKmzLayer(response.data)
      }
      if (layer) {
        layer.addTo(map)
        setLeafletLayer(layer)
        layerRef.current = layer
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading preloaded map layer:', err)
    }
  }, [fileUuid, map, preloadedMapLayer, removePreviousLayer, surveyId])

  useEffect(() => {
    // Cleanup on unmount
    return removePreviousLayer
  }, [removePreviousLayer])

  useMapLayerAdd({
    layerName,
    callback: async () => {
      await fetchAndSetLayer()
    },
  })

  // Render the overlay for MapLayersControl
  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>{leafletLayer && <>{/* Layer will be added by react-leaflet when present */}</>}</LayerGroup>
    </LayersControl.Overlay>
  )
}

PreloadedLayer.propTypes = {
  preloadedMapLayer: PropTypes.object.isRequired,
}
