import React, { useEffect, useCallback, useRef } from 'react'
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

import { useMapLayerToggle } from '../common'

const parseKmlText = (text, parser = null) => {
  if (!text) return null
  const actualParser = parser ?? new DOMParser()
  return actualParser.parseFromString(text, 'text/xml')
}

const extractKmlDomFromKmz = async (blob) => {
  const kmlTexts = []
  await ZipUtils.forEachFileInZip(blob, async (relativePath, fileEntry) => {
    if (relativePath.endsWith('.kml')) {
      const fileData = await fileEntry.async('string')
      kmlTexts.push(fileData)
    }
  })
  if (kmlTexts.length > 0) {
    const parser = new DOMParser()
    return kmlTexts.map((kmlText) => parseKmlText(kmlText, parser))
  }
  return []
}

const createGeoJsonLayer = async (url) => {
  const { data } = await axios.get(url)
  const layer = L.geoJSON(data)
  let bounds = null
  if (layer) {
    bounds = layer.getBounds()
  }
  return { layer, bounds }
}

const createKmlLayer = async (url) => {
  const { data } = await axios.get(url)
  const kmlDom = parseKmlText(data)
  let bounds = null
  let layer = null
  if (kmlDom) {
    layer = new L.KML(kmlDom)
    bounds = layer.getBounds()
  }
  return { layer, bounds }
}

const createKmzLayer = async (url) => {
  const { data } = await axios.get(url, { responseType: 'blob' })
  const kmlDoms = await extractKmlDomFromKmz(data)
  let bounds = null
  let layer = null
  if (kmlDoms.length > 0) {
    layer = L.layerGroup()
    kmlDoms.forEach((kmlDom) => {
      const kmlLayer = new L.KML(kmlDom)
      layer.addLayer(kmlLayer)
      const kmlBounds = kmlLayer.getBounds()
      if (kmlBounds.isValid()) {
        bounds = bounds ? bounds.extend(kmlBounds) : kmlBounds
      }
    })
  }
  return { layer, bounds }
}

export const PreloadedLayer = (props) => {
  const { preloadedMapLayer } = props

  const map = useMap()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const layerRef = useRef(null)

  const fileUuid = SurveyFile.getUuid(preloadedMapLayer)
  const layerName = SurveyFile.getLabel(lang)(preloadedMapLayer)

  const removePreviousLayer = useCallback(() => {
    const layer = layerRef.current
    if (layer) {
      map.removeLayer(layer)
      layerRef.current = null
    }
  }, [map])

  const fetchDataAndAddLayerToMap = useCallback(async () => {
    if (!fileUuid || !surveyId) return
    removePreviousLayer()
    const fileName = SurveyFile.getName(preloadedMapLayer)
    const extension = FileUtils.getExtension(fileName)?.toLowerCase()
    const url = API.getSurveyFileDownloadUrl({ surveyId, fileUuid })

    let result = null
    switch (extension) {
      case 'geojson':
      case 'json': {
        result = await createGeoJsonLayer(url)
        break
      }
      case 'kmz': {
        result = await createKmzLayer(url)
        break
      }
      case 'kml': {
        result = await createKmlLayer(url)
        break
        break
      }
      default:
        // Unsupported file type
        break
    }
    const { layer, bounds } = result || {}
    if (layer) {
      layerRef.current = layer
      map.addLayer(layer)
    }
    if (bounds?.isValid()) {
      map.fitBounds(bounds)
    }
  }, [fileUuid, surveyId, removePreviousLayer, preloadedMapLayer, map])

  useEffect(() => {
    // Cleanup on unmount
    return removePreviousLayer
  }, [removePreviousLayer])

  useMapLayerToggle({
    layerName,
    onAdd: fetchDataAndAddLayerToMap,
    onRemove: removePreviousLayer,
  })

  // Render the overlay for MapLayersControl
  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup />
    </LayersControl.Overlay>
  )
}

PreloadedLayer.propTypes = {
  preloadedMapLayer: PropTypes.object.isRequired,
}
