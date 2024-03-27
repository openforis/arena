import React, { useEffect, useState } from 'react'
import { LayersControl, TileLayer } from 'react-leaflet'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

/**
 * This component is not ready, but can be used for demo purposes.
 * Just set componentDisabled to false and use any url you want.
 * The url needs to go to a WMTS getCapabilities xml document, directly or as an api call.
 *
 * Basemaps is a list of all available layers.
 *
 * TileMatrixSets is a list of ALL available TileMatrixSets. Some layers may not have support all TileMatrixSets.
 * TileMatrixSet is basically the projection. TODO is to find a way to find the projection that leaflet uses (EPSG:3857).
 * (The problem is that no all providers use the same name in the TileMatrixSet list. For some it is with the EPSG code, for some it is custom name...).
 *
 * CurrentTileMatrixSet is the TileMatrixSet that is used currently...
 */

export const WmtsComponent = () => {
  const apiKey = ''
  const [baseMaps, setBaseMaps] = useState([])
  const [tileMatrixSets, setTileMatrixSets] = useState([])
  const [currentTileMatrixSet, setCurrentTileMatrixSet] = useState('')

  const surveyId = useSurveyId()

  const componentDisabled = true

  /*  Here we have some example urls, in the final component the url should be provided by the user */
  //const url = "https://io.apps.fao.org/geoserver/wms/ASIS/VHI_D/v1?service=WMS&version=1.3.0&request=GetCapabilities"
  //const url = "https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml?api-key=" + apiKey
  //const url = "https://kartta.hsy.fi/geoserver/gwc/service/wmts?request=getCapabilities"
  const url =
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml'

  /* Get a list of all available TileMatrixSets. Some layers may not support all of the available TileMatrixSets, each layer has info about the supported sets */
  const getTileMatrixSets = (json) => {
    const list = json.map((set) => set['ows:Identifier']['_text'])
    return list
  }

  /* Prepare a list of {title, url} objects for showing all layers */
  const makeBaseMaps = (layers, newTileMatrixSet) => {
    if (!layers.length) layers = [layers]
    const baseMaps = layers.map((layer) => {
      const title = layer['ows:Title']._text
      let url = layer.ResourceURL._attributes?.template || layer.ResourceURL[0]._attributes.template
      url = url.replace(/{TileRow}/gi, '{y}')
      url = url.replace(/{TileCol}/gi, '{x}')
      url = url.replace(/{TileMatrix}/gi, '{z}')
      url = url.replace(/{TileMatrixSet}/gi, newTileMatrixSet)
      url = url.replace(/{Style}/gi, layer.Style['ows:Identifier']._text)
      //url = url + "?api-key={apiKey}" // If api key is required, different providers might want this different way so find out a way to check what the way is or just try with the common ones
      const object = {
        title: title,
        url: url,
      }
      return object
    })
    return baseMaps
  }

  useEffect(() => {
    if (componentDisabled) return
    let isMounted = true
    API.fetchMapWmtsCapabilities({ surveyId, url }).then((capabilities) => {
      const newTileMatrixSets = getTileMatrixSets(capabilities.Capabilities.Contents.TileMatrixSet)
      const base = makeBaseMaps(capabilities.Capabilities.Contents.Layer, newTileMatrixSets[0])
      if (isMounted) {
        setTileMatrixSets(newTileMatrixSets)
        setCurrentTileMatrixSet(newTileMatrixSets[0])
        setBaseMaps(base)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  return baseMaps.map((layer) => {
    return (
      <LayersControl.BaseLayer key={layer.title} name={layer.title}>
        <TileLayer key={layer.title} url={layer.url} apiKey={apiKey} attribution={''} />
      </LayersControl.BaseLayer>
    )
  })
}
