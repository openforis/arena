import './KmlUploader.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import shp from 'shpjs'
import L from 'leaflet'
require('./L.KML')

import { useI18n } from '@webapp/store/system'
import { ZipForEach } from '@webapp/utils/zipUtils'
import classNames from 'classnames'
import { FileUtils } from '@webapp/utils/fileUtils'

const generatePopupContent = (f, l) => {
  if (f.properties) {
    const out = Object.entries(f.properties).map((key) => key + ': ' + f.properties[key])
    l.bindPopup(out.join('<br />'))
  }
}

export const KmlUploader = () => {
  const map = useMap()

  const i18n = useI18n()

  const [selectedFile, setSelectedFile] = useState()
  const [layers, setLayers] = useState([])
  const [opacity, setOpacity] = useState(50)
  const [open, setOpen] = useState(false)

  const addKMLLayers = useCallback(
    (kmlTexts) => {
      const parser = new DOMParser()
      kmlTexts.forEach((text) => {
        const kml = parser.parseFromString(text, 'text/xml')
        const track = new L.KML(kml)
        map.addLayer(track)
        setLayers((old) => [...old, track])
      })
    },
    [map]
  )

  const processKMLFile = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target.result
        addKMLLayers([text])
      }
      reader.readAsText(file)
    },
    [addKMLLayers]
  )

  const processKMZFile = useCallback(
    async (file) => {
      const kmlList = []
      const promises = []
      await ZipForEach(file, (relativePath, fileEntry) => {
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
    },
    [addKMLLayers]
  )

  const processGeoJson = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target.result
        const geo = JSON.parse(text)
        const geojson = L.geoJSON(geo).addTo(map)
        setLayers((old) => [...old, geojson])
      }
      reader.readAsText(file)
    },
    [map]
  )

  const processShapeFile = useCallback(
    (file) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target.result

        const geo = L.geoJson(
          { features: [] },
          {
            onEachFeature: generatePopupContent,
          }
        ).addTo(map)
        const data = await shp(text)
        geo.addData(data)
        setLayers((old) => [...old, geo])
      }
      reader.readAsArrayBuffer(file)
    },
    [map]
  )

  useEffect(() => {
    const extension = FileUtils.getExtension(selectedFile)
    switch (extension) {
      case 'kmz':
        return processKMZFile(selectedFile)
      case 'kml':
        return processKMLFile(selectedFile)
      case 'zip':
        return processShapeFile(selectedFile)
      case 'json':
      case 'geojson':
        return processGeoJson(selectedFile)
      default:
        break
    }
  }, [processGeoJson, processKMLFile, processKMZFile, processShapeFile, selectedFile])

  const onIconClick = useCallback(() => {
    setOpen(true)
  }, [])

  const onMouseLeave = useCallback(() => {
    setOpen(false)
  }, [])

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

  const title = i18n.t('kmlUploader.title')

  return (
    <div
      className={classNames(`leaflet-top leaflet-right map-kml-uploader-wrapper`, { open })}
      onMouseLeave={onMouseLeave}
      role="dialog"
    >
      <span className="icon icon-upload2 icon-24px" onClick={onIconClick} role="button" title={title} />
      <div className="kml-title">{title}</div>
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
      {selectedFile && (
        <>
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
        </>
      )}
    </div>
  )
}
