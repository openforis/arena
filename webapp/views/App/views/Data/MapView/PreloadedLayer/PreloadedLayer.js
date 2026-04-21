import React, { useEffect, useState, useRef } from 'react'
import { LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'
import axios from 'axios'
import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as API from '@webapp/service/api'
import { FileUtils } from '@webapp/utils/fileUtils'
import L from 'leaflet'
require('@webapp/components/MapContainer/L.KML')
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { ZipUtils } from '@webapp/utils/zipUtils'

export const PreloadedLayer = (props) => {
  const { preloadedMapLayer } = props

  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()

  const [leafletLayer, setLeafletLayer] = useState(null)
  const layerRef = useRef(null)

  const fileUuid = SurveyFile.getUuid(preloadedMapLayer)

  useEffect(() => {
    const removePreviousLayer = () => {
      if (layerRef.current) {
        layerRef.current = null
        setLeafletLayer(null)
      }
    }

    const addGeoJsonLayer = async (data) => {
      const geoLayer = L.geoJSON(data)
      layerRef.current = geoLayer
      setLeafletLayer(geoLayer)
    }

    const addKmzLayer = async (blob) => {
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
        layerRef.current = kmlLayer
        setLeafletLayer(kmlLayer)
      }
    }

    const fetchAndAddLayer = async () => {
      if (!fileUuid || !surveyId) return
      removePreviousLayer()
      const fileName = SurveyFile.getName(preloadedMapLayer)
      const extension = FileUtils.getExtension(fileName)?.toLowerCase()
      const url = API.getSurveyFileDownloadUrl({ surveyId, fileUuid })
      try {
        if (extension === 'geojson' || extension === 'json') {
          const { data } = await axios.get(url)
          await addGeoJsonLayer(data)
        } else if (extension === 'kmz') {
          const response = await axios.get(url, { responseType: 'blob' })
          await addKmzLayer(response.data)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading preloaded map layer:', err)
      }
    }

    fetchAndAddLayer()
    // Cleanup on unmount
    return removePreviousLayer
  }, [fileUuid, surveyId, preloadedMapLayer])

  // Render the overlay for MapLayersControl
  return (
    <LayersControl.Overlay name={SurveyFile.getLabel(lang)(preloadedMapLayer)}>
      <LayerGroup>{leafletLayer && <>{/* Layer will be added by react-leaflet when present */}</>}</LayerGroup>
    </LayersControl.Overlay>
  )
}

PreloadedLayer.propTypes = {
  preloadedMapLayer: PropTypes.object.isRequired,
}
