import './MapView.scss'

import React, { useCallback, useMemo, useState } from 'react'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyAreaOfInterest from '@core/survey/surveyAreaOfInterest'
import * as SurveyFile from '@core/survey/surveyFile'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import * as API from '@webapp/service/api'
import { useSurvey, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { MapContainer } from '@webapp/components/MapContainer'
import type { SurveyFileRef } from '@webapp/components/MapContainer/fileLayers'
import type { MapRailTab, MapWorkspaceRecords } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'
import { exitFullScreen } from '@webapp/components/MapContainer/workspace/tools/useFullScreen'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'
import { RecordEditModal } from '../common/RecordEditModal'
import { GeoAttributeDataLayer } from './GeoAttributeDataLayer'
import { SurveyFileLayer } from './SurveyFileLayer/SurveyFileLayer'
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

// the Records tab: the records of the shown layers, to go from one to the next as in the former side panel
const RECORDS_RAIL_TABS: MapRailTab[] = [
  {
    key: 'records',
    labelKey: 'mapWorkspace.rail.tabs.records',
    titleKey: 'mapWorkspace.rail.titles.records',
    iconClassName: 'icon-list',
    content: <MapLayersPanel />,
  },
]

// MapContainer must always occupy the same position in the React tree so Leaflet never unmounts
const MapViewContent = ({ layers, overlayGroups }: MapViewContentProps) => {
  const { activeLayers, selectPoint } = useMapLayersPanel()
  // the search finds the records the Records tab lists
  const records = useMemo<MapWorkspaceRecords>(
    () => ({
      candidates: buildRecordCandidates(activeLayers),
      onSelect: (id: string) => selectRecordCandidate({ id, activeLayers, selectPoint }),
    }),
    [activeLayers, selectPoint]
  )

  return (
    <MapContainer
      variant="full"
      layers={layers}
      overlayGroups={overlayGroups}
      extraRailTabs={RECORDS_RAIL_TABS}
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
  const lang = useSurveyPreferredLang()
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

  const preloadedLayerRefs = useMemo((): SurveyFileRef[] => {
    if (!Survey.isPreloadedMapLayersEnabled(surveyInfo)) return []

    return (Survey.getPreloadedMapLayers(surveyInfo) as any[]).map((preloadedMapLayer) => ({
      fileUuid: SurveyFile.getUuid(preloadedMapLayer),
      fileName: SurveyFile.getName(preloadedMapLayer),
      label: SurveyFile.getLabel(lang)(preloadedMapLayer),
    }))
  }, [lang, surveyInfo])

  const areaOfInterestRefs = useMemo(
    (): SurveyFileRef[] =>
      SurveyAreaOfInterest.getAreasOfInterest(surveyInfo).map((areaOfInterest) => ({
        fileUuid: areaOfInterest.fileUuid,
        fileName: areaOfInterest.fileName,
        label: SurveyAreaOfInterest.getLabel(lang)(areaOfInterest),
      })),
    [lang, surveyInfo]
  )

  const layerColors = useRandomColors(
    samplingPointDataLevels.length + geoAttributeDefs.length + preloadedLayerRefs.length
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
      // same order as the overlay groups
      ...[...preloadedLayerRefs, ...areaOfInterestRefs].map((surveyFile) => (
        <SurveyFileLayer key={surveyFile.fileUuid} surveyFile={surveyFile} />
      )),

      ...samplingPointDataLevels.map((level: any, index: number) => (
        <SamplingPointDataLayer
          key={CategoryLevel.getUuid(level)}
          levelIndex={CategoryLevel.getIndex(level)}
          markersColor={layerColors[preloadedLayerRefs.length + index]}
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
            defaultColor: layerColors[preloadedLayerRefs.length + samplingPointDataLevels.length + index],
          })}
          onRecordEditClick={onRecordEditClick}
        />
      )),
    ],
    [
      areaOfInterestRefs,
      createRecordFromSamplingPointDataItem,
      geoAttributeDefs,
      layerColors,
      onRecordEditClick,
      preloadedLayerRefs,
      samplingPointDataLevels,
    ]
  )

  const overlayGroups = useMemo(() => {
    const layersCountByGroup = {
      preloadedLayers: preloadedLayerRefs.length,
      areasOfInterest: areaOfInterestRefs.length,
      samplingPointData: samplingPointDataLevels.length,
      inputData: geoAttributeDefs.length,
    }
    return Object.entries(layersCountByGroup)
      .map(([groupKey, groupLayersCount]) => ({
        label: i18n.t(`dataView:mapView.layersControl.${groupKey}`),
        count: groupLayersCount,
      }))
      .filter((g) => g.count > 0)
  }, [
    areaOfInterestRefs.length,
    geoAttributeDefs.length,
    i18n,
    preloadedLayerRefs.length,
    samplingPointDataLevels.length,
  ])

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

export const MapView = MapWrapper
