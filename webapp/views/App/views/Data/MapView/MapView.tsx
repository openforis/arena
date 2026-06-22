import './MapView.scss'

import React, { useCallback, useMemo, useRef, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import { useI18n, useSystemConfigExperimentalFeatures } from '@webapp/store/system'

import { useHorizontalResize } from '@webapp/components/hooks'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { MapContainer } from '@webapp/components/MapContainer'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { RecordEditModal } from '../common/RecordEditModal'
import { GeoAttributeDataLayer } from './GeoAttributeDataLayer'
import { PreloadedLayer } from './PreloadedLayer/PreloadedLayer'
import { MapLayersPanel, MapLayersPanelProvider } from './MapLayersPanel'
import { useMapLayersPanel } from './MapLayersPanel/MapLayersPanelContext'

const PANEL_DEFAULT_WIDTH = 260
const PANEL_MIN_WIDTH = 100
const MAP_MIN_WIDTH = 300

type LayerGroup = {
  label: string
  count: number
}

type MapViewContentProps = {
  baseLayersLabel: string
  layers: React.ReactElement[]
  overlayGroups: LayerGroup[]
}

// MapContainer must always occupy the same position in the React tree so Leaflet never
// unmounts. We achieve this with a stable flex layout where only the panel-pane width
// changes — no conditional Split mount/unmount.
const MapViewContent = ({ baseLayersLabel, layers, overlayGroups }: MapViewContentProps) => {
  const { activeLayers, isPanelVisible } = useMapLayersPanel()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panelOpen = experimentalFeatures && isPanelVisible && activeLayers.length > 0

  const {
    width: panelWidth,
    maxWidth: panelMaxWidth,
    onGutterMouseDown,
    onGutterKeyDown,
    onGutterTouchStart,
  } = useHorizontalResize({
    containerRef,
    initialWidth: PANEL_DEFAULT_WIDTH,
    minLeftWidth: PANEL_MIN_WIDTH,
    minRightWidth: MAP_MIN_WIDTH,
  })

  return (
    <div ref={containerRef} className="map-view-content">
      <div
        className="map-view-content__panel"
        style={{ width: panelOpen ? panelWidth : 0, overflow: panelOpen ? 'hidden' : 'visible' }}
      >
        <MapLayersPanel />
      </div>
      {panelOpen && (
        <div
          role="slider"
          aria-orientation="vertical"
          aria-valuenow={panelWidth}
          aria-valuemin={PANEL_MIN_WIDTH}
          aria-valuemax={panelMaxWidth}
          tabIndex={0}
          className="map-view-content__gutter"
          onMouseDown={onGutterMouseDown}
          onKeyDown={onGutterKeyDown}
          onTouchStart={onGutterTouchStart}
        />
      )}
      <div className="map-view-content__map">
        <MapContainer layers={layers} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
      </div>
    </div>
  )
}

const getGeoAttributeLayerMarkersColor = ({
  attributeDef,
  defaultColor,
}: {
  attributeDef: any
  defaultColor: string
}): string => {
  if (!NodeDef.isCoordinate(attributeDef)) return defaultColor

  const mapMarkerColor = NodeDef.getMapMarkerColor(attributeDef) as string
  return Objects.isEmpty(mapMarkerColor) ? defaultColor : mapMarkerColor
}

const getSamplingPointDataLevels = (survey: any): any[] => {
  const samplingPointDataCategory = Survey.getSamplingPointDataCategory(survey)
  const samplingPointDataCoordinatesDefined =
    Category.getItemExtraDefKeys(samplingPointDataCategory).includes('location')

  return samplingPointDataCoordinatesDefined ? Category.getLevelsArray(samplingPointDataCategory) : []
}

type MapWrapperState = {
  editingRecordUuid: string | null
  editingParentNodeUuid: string | null
  lastRecordEditModalState: unknown
}

const MapWrapper = () => {
  const i18n = useI18n()
  const survey = useSurvey() as any

  const surveyInfo = useSurveyInfo() as any
  const surveyId = Survey.getId(survey)

  const [state, setState] = useState<MapWrapperState>({
    editingRecordUuid: null,
    editingParentNodeUuid: null,
    lastRecordEditModalState: null,
  })
  const { editingRecordUuid, editingParentNodeUuid, lastRecordEditModalState } = state

  const geoAttributeDefs = useMemo(
    () =>
      Survey.getNodeDefsArray(survey).filter((nodeDef: any) => NodeDef.isGeo(nodeDef) || NodeDef.isCoordinate(nodeDef)),
    [survey]
  )
  const samplingPointDataLevels = useMemo(() => getSamplingPointDataLevels(survey), [survey])

  const preloadedLayerSummaries = useMemo(() => {
    if (!Survey.isPreloadedMapLayersEnabled(surveyInfo)) return []

    return Survey.getPreloadedMapLayers(surveyInfo) as any[]
  }, [surveyInfo])

  const layerColors = useRandomColors(
    samplingPointDataLevels.length + geoAttributeDefs.length + preloadedLayerSummaries.length
  )

  const onRecordEditClick = useCallback((params?: { recordUuid?: string; parentUuid?: string }) => {
    const { recordUuid, parentUuid } = params ?? {}
    setState((statePrev) => ({
      ...statePrev,
      editingRecordUuid: recordUuid ?? null,
      editingParentNodeUuid: parentUuid ?? null,
    }))
  }, [])

  const closeRecordEditor = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, editingRecordUuid: null, editingParentNodeUuid: null }))
  }, [])

  const onRecordEditorClose = useCallback(({ modalState: lastRecordEditModalState }: { modalState: unknown }) => {
    setState((statePrev) => ({ ...statePrev, lastRecordEditModalState }))
  }, [])

  const createRecordFromSamplingPointDataItem = useCallback(
    async ({ itemUuid, callback }: { itemUuid: string; callback?: (params: { recordUuid: string }) => void }) => {
      const recordUuid = await API.createRecordFromSamplingPointDataItem({ surveyId, itemUuid })
      setState((statePrev) => ({ ...statePrev, editingRecordUuid: recordUuid }))
      callback?.({ recordUuid })
    },
    [surveyId]
  )

  const layers = useMemo(
    () => [
      ...preloadedLayerSummaries.map((preloadedLayerSummary: any) => (
        <PreloadedLayer key={SurveyFile.getUuid(preloadedLayerSummary)} preloadedMapLayer={preloadedLayerSummary} />
      )),

      ...samplingPointDataLevels.map((level: any, index: number) => (
        <SamplingPointDataLayer
          key={CategoryLevel.getUuid(level)}
          levelIndex={CategoryLevel.getIndex(level)}
          markersColor={layerColors[preloadedLayerSummaries.length + index]}
          onRecordEditClick={onRecordEditClick}
          createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
        />
      )),

      ...geoAttributeDefs.map((attributeDef: any, index: number) => (
        <GeoAttributeDataLayer
          key={NodeDef.getUuid(attributeDef)}
          attributeDef={attributeDef}
          markersColor={getGeoAttributeLayerMarkersColor({
            attributeDef,
            defaultColor: layerColors[preloadedLayerSummaries.length + samplingPointDataLevels.length + index],
          })}
          onRecordEditClick={onRecordEditClick}
        />
      )),
    ],
    [
      createRecordFromSamplingPointDataItem,
      geoAttributeDefs,
      layerColors,
      onRecordEditClick,
      preloadedLayerSummaries,
      samplingPointDataLevels,
    ]
  )

  const baseLayersLabel = i18n.t('dataView:mapView.layersControl.baseLayers')

  const overlayGroups = useMemo(
    () =>
      [
        { label: i18n.t('dataView:mapView.layersControl.preloadedLayers'), count: preloadedLayerSummaries.length },
        { label: i18n.t('dataView:mapView.layersControl.samplingPointData'), count: samplingPointDataLevels.length },
        { label: i18n.t('dataView:mapView.layersControl.inputData'), count: geoAttributeDefs.length },
      ].filter((g) => g.count > 0),
    [geoAttributeDefs.length, i18n, preloadedLayerSummaries.length, samplingPointDataLevels.length]
  )

  if (layers.length > 0 && layerColors.length === 0) {
    // layer colors not generated yet
    return null
  }

  return (
    <MapLayersPanelProvider>
      <div className="map-view-layout">
        <MapViewContent layers={layers} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
      </div>
      {editingRecordUuid && (
        <RecordEditModal
          initialState={lastRecordEditModalState as object}
          onClose={onRecordEditorClose}
          onRequestClose={closeRecordEditor}
          recordUuid={editingRecordUuid}
          parentNodeUuid={editingParentNodeUuid}
        />
      )}
    </MapLayersPanelProvider>
  )
}

export const MapView = () => <MapWrapper />
