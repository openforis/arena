import React, { useEffect, useState, useCallback, useRef } from 'react'
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
    return parser.parseFromString(kmlTexts[0], 'text/xml')
  }
  return null
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
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
  }, [map])

  const fetchDataAndAddLayerToMap = useCallback(async () => {
    if (!fileUuid || !surveyId) return
    removePreviousLayer()
    const fileName = SurveyFile.getName(preloadedMapLayer)
    const extension = FileUtils.getExtension(fileName)?.toLowerCase()
    const url = API.getSurveyFileDownloadUrl({ surveyId, fileUuid })
    let layer = null
    if (extension === 'geojson' || extension === 'json') {
      const { data } = await axios.get(url)
      layer = L.geoJSON(data)
    } else if (extension === 'kmz') {
      const response = await axios.get(url, { responseType: 'blob' })
      const kmlDom = await extractKmlDomFromKmz(response.data)
      if (kmlDom) {
        layer = new L.KML(kmlDom)
      }
    }
    if (layer) {
      layerRef.current = layer
      map.addLayer(layer)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds)
      }
    }
  }, [fileUuid, preloadedMapLayer, removePreviousLayer, surveyId, map])

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
