const LayerType = {
  geojson: 'geojson',
  kmz: 'kmz',
}
import React, { useEffect, useState, useCallback } from 'react'
import { LayersControl, LayerGroup, GeoJSON, useMap } from 'react-leaflet'
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

// Custom KMLLayer component for react-leaflet
const KMLLayer = ({ kmlDom }) => {
  const map = useMap()
  useEffect(() => {
    if (!kmlDom) return
    const kmlLayer = new L.KML(kmlDom)
    kmlLayer.addTo(map)
    return () => {
      map.removeLayer(kmlLayer)
    }
  }, [kmlDom, map])
  return null
}

KMLLayer.propTypes = {
  kmlDom: PropTypes.object,
}

export const PreloadedLayer = (props) => {
  const { preloadedMapLayer } = props

  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const [layerType, setLayerType] = useState(null)
  const [geoJsonData, setGeoJsonData] = useState(null)
  const [kmlDom, setKmlDom] = useState(null)

  const fileUuid = SurveyFile.getUuid(preloadedMapLayer)
  const layerName = SurveyFile.getLabel(lang)(preloadedMapLayer)

  const removePreviousLayer = useCallback(() => {
    setGeoJsonData(null)
    setKmlDom(null)
    setLayerType(null)
  }, [])

  const fetchAndSetLayer = useCallback(async () => {
    if (!fileUuid || !surveyId) return
    removePreviousLayer()
    const fileName = SurveyFile.getName(preloadedMapLayer)
    const extension = FileUtils.getExtension(fileName)?.toLowerCase()
    const url = API.getSurveyFileDownloadUrl({ surveyId, fileUuid })
    try {
      if (extension === 'geojson' || extension === 'json') {
        const { data } = await axios.get(url)
        setLayerType(LayerType.geojson)
        setGeoJsonData(data)
      } else if (extension === 'kmz') {
        const response = await axios.get(url, { responseType: 'blob' })
        setLayerType(LayerType.kmz)
        const kmlDom = await extractKmlDomFromKmz(response.data)
        setKmlDom(kmlDom)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading preloaded map layer:', err)
    }
  }, [fileUuid, preloadedMapLayer, removePreviousLayer, surveyId])

  useEffect(() => {
    // Cleanup on unmount
    return removePreviousLayer
  }, [removePreviousLayer])

  useMapLayerToggle({
    layerName,
    onAdd: fetchAndSetLayer,
    onRemove: removePreviousLayer,
  })

  // Render the overlay for MapLayersControl
  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>
        {layerType === LayerType.geojson && geoJsonData && <GeoJSON data={geoJsonData} />}
        {layerType === LayerType.kmz && kmlDom && <KMLLayer kmlDom={kmlDom} />}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

PreloadedLayer.propTypes = {
  preloadedMapLayer: PropTypes.object.isRequired,
}
