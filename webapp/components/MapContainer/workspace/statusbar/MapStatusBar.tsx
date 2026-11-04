import React, { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { useMap, useMapEvents } from 'react-leaflet'

import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { useControlContainerMove } from '../layers/useControlContainerMove'
import { useMapWorkspace } from '../MapWorkspaceContext'
import type { MapWorkspaceRecords } from '../mapWorkspaceTypes'
import { formatCoordinates, nextCoordinateNotation } from './coordinateFormat'
import type { CoordinateNotation } from './coordinateFormat'
import { countPointsInBounds, getScaleBar, metersPerPixel } from './mapScale'
import type { LatLngBoundsLiteral } from './mapScale'

type LatLng = { lat: number; lng: number }
type MapViewState = { center: LatLng; zoom: number; bounds: LatLngBoundsLiteral }

/**
 * Reads the centre, zoom and bounds of the map.
 * @param {LeafletMap} map - The map.
 * @returns {MapViewState} The view.
 */
const readView = (map: LeafletMap): MapViewState => {
  const { lat, lng } = map.getCenter()
  const bounds = map.getBounds()
  return {
    center: { lat, lng },
    zoom: map.getZoom(),
    bounds: { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() },
  }
}

/**
 * Formats a zoom level with at most one decimal.
 * @param {number} zoom - The zoom level.
 * @returns {string} The text.
 */
const formatZoom = (zoom: number): string => String(Math.round(zoom * 10) / 10)

/**
 * Status bar: cursor (or centre) coordinates with a notation switch, zoom, scale, records in view, attribution.
 * @param {object} props - Component props.
 * @param {MapWorkspaceRecords} [props.records] - Records on the map (full workspace with the Records list only).
 * @returns {React.ReactElement} The status bar content.
 */
export const MapStatusBar = ({ records }: { records?: MapWorkspaceRecords }): ReactElement => {
  const t = useI18nT()
  const map = useMap()
  const { variant } = useMapWorkspace()
  const [notation, setNotation] = useState<CoordinateNotation>('latLon')
  const [cursor, setCursor] = useState<LatLng | null>(null)
  const [view, setView] = useState<MapViewState>(() => readView(map))
  const [attributionTarget, setAttributionTarget] = useState<HTMLSpanElement | null>(null)

  useControlContainerMove(map.attributionControl, attributionTarget)

  // the attribution is cut with an ellipsis when it does not fit: its full text goes in the title
  useEffect(() => {
    if (!attributionTarget) return undefined
    /**
     * Copies the attribution text into the title.
     * @returns {void}
     */
    const syncTitle = (): void => {
      attributionTarget.setAttribute('title', attributionTarget.textContent ?? '')
    }
    syncTitle()
    const observer = new MutationObserver(syncTitle)
    observer.observe(attributionTarget, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [attributionTarget])

  useMapEvents({
    mousemove: (event) => setCursor({ lat: event.latlng.lat, lng: event.latlng.lng }),
    mouseout: () => setCursor(null),
    moveend: () => setView(readView(map)),
    resize: () => setView(readView(map)),
  })

  const point = cursor ?? view.center
  const scaleBar = getScaleBar(metersPerPixel(view.center.lat, view.zoom))
  // not on every mouse move: the bounds change only on moveend / resize
  const recordsInView = useMemo(
    () => (variant === 'full' && records ? countPointsInBounds(records.candidates, view.bounds) : null),
    [variant, records, view.bounds]
  )

  return (
    <>
      <button
        type="button"
        className="map-status-bar__coordinates"
        title={t('mapWorkspace.status.changeNotation')}
        onClick={() => setNotation(nextCoordinateNotation)}
        data-testid={TestId.mapWorkspace.statusCoordinates}
      >
        <span className="map-status-bar__notation" data-testid={TestId.mapWorkspace.statusNotation}>
          {t(`mapWorkspace.status.notations.${notation}`)}
        </span>
        <span>{formatCoordinates(point.lat, point.lng, notation)}</span>
      </button>
      <span className="map-status-bar__item" data-testid={TestId.mapWorkspace.statusZoom}>
        {`${t('mapWorkspace.status.zoom')} ${formatZoom(view.zoom)}`}
      </span>
      {scaleBar && (
        <span className="map-status-bar__item map-status-bar__scale" title={t('mapWorkspace.status.scale')}>
          <span className="map-status-bar__scale-line" style={{ width: scaleBar.widthPx }} aria-hidden="true" />
          {scaleBar.label}
        </span>
      )}
      {recordsInView !== null && (
        <span className="map-status-bar__item">{t('mapWorkspace.status.recordsInView', { count: recordsInView })}</span>
      )}
      <span className="map-status-bar__spacer" />
      <span ref={setAttributionTarget} className="map-status-bar__attribution" />
    </>
  )
}
