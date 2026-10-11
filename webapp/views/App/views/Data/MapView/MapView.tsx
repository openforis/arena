import './MapView.scss'

import React, { useCallback, useMemo, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyInfo } from '@webapp/store/survey'
import { useI18n, useSystemConfigExperimentalFeatures } from '@webapp/store/system'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { MapContainer } from '@webapp/components/MapContainer'
import { MapPlotPointsProvider } from '@webapp/components/MapContainer/workspace/screenshot/MapPlotPointsContext'
import type { MapRailTab, MapWorkspaceRecords } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'
import { exitFullScreen } from '@webapp/components/MapContainer/workspace/tools/useFullScreen'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { RecordEditModal } from '../common/RecordEditModal'
import { GeoAttributeDataLayer } from './GeoAttributeDataLayer'
import { PreloadedLayer } from './PreloadedLayer/PreloadedLayer'
import { MapLayersPanel, MapLayersPanelProvider } from './MapLayersPanel'
import { useMapLayersPanel } from './MapLayersPanel/MapLayersPanelContext'
import { buildRecordCandidates, selectRecordCandidate } from './mapRecordCandidates'

type LayerGroup = {
  label: string
  count: number
}

type MapViewContentProps = {
  layers: React.ReactElement[]
  overlayGroups: LayerGroup[]
}

// the Records tab (experimental): the records of the shown layers, as in the former side panel
const RECORDS_RAIL_TABS: MapRailTab[] = [
  {
    key: 'records',
    labelKey: 'mapWorkspace.rail.tabs.records',
    titleKey: 'mapWorkspace.rail.titles.records',
    iconClassName: 'icon-list',
    content: <MapLayersPanel />,
  },
]
const NO_RAIL_TABS: MapRailTab[] = []

// MapContainer must always occupy the same position in the React tree so Leaflet never unmounts
const MapViewContent = ({ layers, overlayGroups }: MapViewContentProps) => {
  const { activeLayers, selectPoint } = useMapLayersPanel()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()

  const records = useMemo<MapWorkspaceRecords | undefined>(
    () =>
      experimentalFeatures
        ? {
            candidates: buildRecordCandidates(activeLayers),
            onSelect: (id: string) => selectRecordCandidate({ id, activeLayers, selectPoint }),
          }
        : undefined,
    [activeLayers, experimentalFeatures, selectPoint]
  )

  return (
    <MapContainer
      variant="full"
      layers={layers}
      overlayGroups={overlayGroups}
      extraRailTabs={experimentalFeatures ? RECORDS_RAIL_TABS : NO_RAIL_TABS}
      records={records}
    />
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
    exitFullScreen()
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
      exitFullScreen()
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

  const overlayGroups = useMemo(() => {
    const layersCountByGroup = {
      preloadedLayers: preloadedLayerSummaries.length,
      samplingPointData: samplingPointDataLevels.length,
      inputData: geoAttributeDefs.length,
    }
    return Object.entries(layersCountByGroup)
      .map(([groupKey, groupLayersCount]) => ({
        label: i18n.t(`dataView:mapView.layersControl.${groupKey}`),
        count: groupLayersCount,
      }))
      .filter((g) => g.count > 0)
  }, [geoAttributeDefs.length, i18n, preloadedLayerSummaries.length, samplingPointDataLevels.length])

  if (layers.length > 0 && layerColors.length === 0) {
    // layer colors not generated yet
    return null
  }

  return (
    <MapLayersPanelProvider>
      <div className="map-view-layout">
        <MapViewContent layers={layers} overlayGroups={overlayGroups} />
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

export const MapView = () => (
  <MapPlotPointsProvider>
    <MapWrapper />
  </MapPlotPointsProvider>
)
