import React, { useEffect, useState } from 'react'
import { LayersControl, TileLayer } from 'react-leaflet'


import axios from 'axios'

export const WmtsComponent = () => {
    const apiKey = '' 
    const [baseMaps, setBaseMaps] = useState([])
    const [tileMatrixSets, setTileMatrixSets] = useState([])
    const [currentTileMatrixSet, setCurrentTileMatrixSet] = useState('')
    //const url = "https://io.apps.fao.org/geoserver/wms/ASIS/VHI_D/v1?service=WMS&version=1.3.0&request=GetCapabilities"
    //const url = "https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/WMTSCapabilities.xml?api-key=" + apiKey
    //const url = "https://kartta.hsy.fi/geoserver/gwc/service/wmts?request=getCapabilities"
    const url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS/1.0.0/WMTSCapabilities.xml"

    const getTileMatrixSets = (json) => {
        const list = json.map(set => set['ows:Identifier']['_text'])
        return list
    }

    const makeBaseMaps = (layers, newTileMatrixSet) => {
        if (!layers.length) layers = [layers]
        const baseMaps = layers.map((layer) => {
            const title = layer['ows:Title']._text
            let url = layer.ResourceURL._attributes?.template || layer.ResourceURL[0]._attributes.template
            url = url.replace(/{TileRow}/gi, '{y}')
            url = url.replace(/{TileCol}/gi, '{x}')
            url = url.replace(/{TileMatrix}/gi, '{z}')
            url = url.replace(/{TileMatrixSet}/gi, newTileMatrixSet)
            url = url.replace(/{Style}/gi, layer.Style["ows:Identifier"]._text)
            url = url + "?api-key={apiKey}"
            const object = {
                title: title,
                url: url
            }
            return object
        })
        return baseMaps
    }

    useEffect( () => {
        let isMounted = true
        getCapabilities(url).then( (capabilities) => {
            const newTileMatrixSets = getTileMatrixSets(capabilities.Capabilities.Contents.TileMatrixSet)
            const base = makeBaseMaps(capabilities.Capabilities.Contents.Layer, newTileMatrixSets[0])
            if (isMounted) {
                setTileMatrixSets(newTileMatrixSets)
                setCurrentTileMatrixSet(newTileMatrixSets[0])
                setBaseMaps(base)
            }
        })
        return () => { isMounted = false }
    }, [])

        return (
            baseMaps.map((layer) => {
                return (
                    <LayersControl.BaseLayer key={layer.title} name={layer.title} >
                        <TileLayer key={layer.title} url={layer.url} apiKey={apiKey} attribution={''}/>
                    </LayersControl.BaseLayer>
                )
            })
            )
}


const getCapabilities = async (url) => {
    let res, data
    try {
        res = await axios.get('/api/geo/map/wmts/getCapabilities/' + encodeURIComponent(url))
        data =  res.data
    } catch {
        return null
    }
    return data
}

