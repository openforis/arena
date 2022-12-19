import './KmlUploader.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

import { useI18n } from '@webapp/store/system'

import L from 'leaflet'

require('./L.KML')

import JSZip from 'jszip'
import shp from 'shpjs'
const pathmodule = require('path')

export const KmlUploader = () => {
  const map = useMap()
  const jszip = new JSZip()

  const i18n = useI18n()

  const [selectedFile, setSelectedFile] = useState()
  const [layers, setLayers] = useState([])
  const [opacity, setOpacity] = useState(50)

  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.name.endsWith('.kmz')) {
        processKMZFile(selectedFile)
      } else if (selectedFile.name.endsWith('.kml')) {
        processKMLFile(selectedFile)
      } else if (selectedFile.name.endsWith('.zip')) {
        processShapeFile(selectedFile)
      } else if (selectedFile.name.endsWith('.json') || selectedFile.name.endsWith('.geojson')) {
        processGeoJson(selectedFile)
      }
    }
  }, [selectedFile])

  const processGeoJson = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      const geo = JSON.parse(text)
      const geojson = L.geoJSON(geo).addTo(map)
      setLayers((old) => [...old, geojson])
    }
    reader.readAsText(file)
  }

  const processShapeFile = (file) => {
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

  const processKMLFile = (file) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target.result
      addKMLLayers([text])
    }
    reader.readAsText(file)
  }

  const processKMZFile = async (file) => {
    const MAX_FILES = 10000
    const MAX_SIZE = 1000000000 // 1 GB
    let fileCount = 0
    let totalSize = 0
    let targetDirectory = '/archive_tmp'
    const kmlList = []
    let promises = []
    await jszip.loadAsync(file)
    jszip.forEach((relativePath, fileEntry) => {
      fileCount++
      if (fileCount > MAX_FILES) {
        throw 'Reached max. number of files'
      }
      // Prevent ZipSlip path traversal (S6096)
      const resolvedPath = pathmodule.join(targetDirectory, fileEntry.name)
      if (!resolvedPath.startsWith(targetDirectory)) {
        throw 'Path traversal detected'
      }
      jszip
        .file(fileEntry.name)
        .async('nodebuffer')
        .then(function (content) {
          totalSize += content.length
          if (totalSize > MAX_SIZE) {
            throw 'Reached max. size'
          }
        })

      promises.push(
        new Promise((resolve) => {
          if (relativePath.endsWith('.kml')) {
            resolve(fileEntry.async('string').then((data) => kmlList.push(data)))
          }
          resolve()
        })
      )
    })
    await Promise.all(promises)
    addKMLLayers(kmlList)
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
          <input
            type="file"
            name="file"
            onChange={fileChangeHandler}
            className="file"
            id="file"
            accept=".kml,.kmz,.zip,.json,.geojson"
          />
        </div>
      </div>
    </div>
  )
}
