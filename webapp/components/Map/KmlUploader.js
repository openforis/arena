import './KmlUploader.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import L from 'leaflet'

require('./L.KML')

import JSZip from 'jszip'
import shp from 'shpjs'

export const KmlUploader = () => {
  const map = useMap()
  const jszip = new JSZip()

  const i18n = useI18n()
  const user = useUser()

  const [selectedFile, setSelectedFile] = useState()
  const [isFilePicked, setIsFilePicked] = useState(false)
  const [layers, setLayers] = useState([])
  const [opacity, setOpacity] = useState(50)

  useEffect(() => {
    if (isFilePicked) {
      if (selectedFile.name.endsWith('.kmz')) {
        handleKMZ(selectedFile)
      } else if (selectedFile.name.endsWith('.kml')) {
        handleKLM(selectedFile)
      } else if (selectedFile.name.endsWith('.zip')) {
        handleShapefile(selectedFile)
      }
    }
  }, [selectedFile])

  const handleShapefile = (file) => {
    const geo = L.geoJson(
      { features: [] },
      {
        onEachFeature: function popUp(f, l) {
          if (f.properties) {
            const out = Object.entries(f.properties).map((key) => key + ': ' + f.properties[key])
            l.bindPopup(out.join('<br />'))
          }
        },
      }
    ).addTo(map)
    setLayers((old) => [...old, geo])
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      shp(text).then(function (data) {
        geo.addData(data)
      })
    }
    reader.readAsArrayBuffer(file)
  }

  const handleKLM = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      addKMLLayers([text])
    }
    reader.readAsText(file)
  }

  const handleKMZ = async (file) => {
    const kmlList = []
    let promises = []
    await jszip.loadAsync(file).then(() => {
      jszip.forEach((relativePath, file) => {
        promises.push(
          new Promise((resolve) => {
            if (relativePath.endsWith('.kml')) {
              resolve(file.async('string').then((data) => kmlList.push(data)))
            }
            resolve()
          })
        )
      })
    })
    Promise.all(promises).then(() => {
      addKMLLayers(kmlList)
    })
  }

  const addKMLLayers = (kmlTexts) => {
    const parser = new DOMParser()
    kmlTexts.forEach((text) => {
      const kml = parser.parseFromString(text, 'text/xml')
      const track = new L.KML(kml)
      map.addLayer(track)
      setLayers((old) => [...old, track])
    })
  }

  const fileChangeHandler = (event) => {
    setSelectedFile(event.target.files[0])

    setIsFilePicked(true)
  }

  const rangeChangeHandler = (event) => {
    const value = event.target.value
    setOpacity(value)
    layers.forEach((layer) => layer.setStyle({ fillOpacity: value / 100 }))
  }

  const rangeOnMouseDown = () => {
    map.dragging.disable()
  }

  const rangeOnMouseUp = () => {
    map.dragging.enable()
  }
  if (!User.isSystemAdmin(user)) {
    return null
  }
  return (
    <div className="leaflet-bottom map-kml-uploader-wrapper">
      <div className="kml-title">{i18n.t('kmlUploader.title')}</div>
      <label htmlFor="range">{i18n.t('kmlUploader.opacity')}</label>
      <input
        type="range"
        min="1"
        max="100"
        value={opacity}
        onChange={rangeChangeHandler}
        onMouseDown={rangeOnMouseDown}
        onMouseUp={rangeOnMouseUp}
        name="range"
        id="range"
      />
      <div className="file-select-wrapper">
        <div className="file-input">
          <label htmlFor="file">{i18n.t('kmlUploader.selectFile')}</label>
          <input type="file" name="file" onChange={fileChangeHandler} className="file" id="file" />
        </div>
      </div>
    </div>
  )
}
