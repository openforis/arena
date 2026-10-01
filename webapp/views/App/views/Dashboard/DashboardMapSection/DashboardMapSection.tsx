import './DashboardMapSection.scss'

import React, { useCallback, useMemo, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useOnIntersect } from '@webapp/components/hooks'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { MapContainer } from '@webapp/components/MapContainer'
import { useSurvey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { GeoAttributeDataLayer } from '@webapp/views/App/views/Data/MapView/GeoAttributeDataLayer'

import { DashboardSection } from '../components/DashboardSection'
import { surveyHasGeoAttributes } from '../utils/surveyHasGeoAttributes'
import { DashboardMapOwnerFilter } from './DashboardMapOwnerFilter'
import { DashboardPolygonPopup } from './DashboardPolygonPopup'
import { useDashboardMapOwners } from './useDashboardMapOwners'

type RenderPopupParams = {
  attributeDef: unknown
  pointFeature: { properties?: Record<string, unknown> }
}

/**
 * Dashboard section with the polygons of the survey geo attributes, filterable by record owner.
 *
 * The map and its data are mounted only once the section becomes visible.
 *
 * @returns {React.ReactElement} The section, or null when the survey has no geo attribute.
 */
const DashboardMapSection = () => {
  const survey = useSurvey()
  const [mapVisible, setMapVisible] = useState(false)
  const onSectionVisible = useCallback(() => setMapVisible(true), [])
  const [setSectionRef] = useOnIntersect(onSectionVisible)

  const { onLayerPointsLoaded, owners, pointsFilter, selectedOwnerUuid, setSelectedOwnerUuid } = useDashboardMapOwners()

  const geoAttributeDefs = useMemo(
    () => Survey.getNodeDefsArray(survey).filter((nodeDef: unknown) => NodeDef.isGeo(nodeDef)),
    [survey]
  )
  const layerColors = useRandomColors(geoAttributeDefs.length)

  const renderPopup = useCallback(
    ({ attributeDef, pointFeature }: RenderPopupParams) => (
      <DashboardPolygonPopup attributeDef={attributeDef} pointFeature={pointFeature} />
    ),
    []
  )

  const layers = useMemo(
    () =>
      geoAttributeDefs.map((attributeDef: unknown, index: number) => (
        <GeoAttributeDataLayer
          key={NodeDef.getUuid(attributeDef)}
          attributeDef={attributeDef}
          checked
          markersColor={layerColors[index]}
          onPointsLoaded={onLayerPointsLoaded}
          pointsFilter={pointsFilter}
          renderPopup={renderPopup}
        />
      )),
    [geoAttributeDefs, layerColors, onLayerPointsLoaded, pointsFilter, renderPopup]
  )

  if (!surveyHasGeoAttributes(survey)) {
    return null
  }

  return (
    <DashboardSection titleKey="homeView:dashboard.map.title" testId={TestId.dashboard.mapSection}>
      <div ref={setSectionRef} className="dashboard-map-section">
        <DashboardMapOwnerFilter
          owners={owners}
          selectedOwnerUuid={selectedOwnerUuid}
          onOwnerSelect={setSelectedOwnerUuid}
        />
        <div className="dashboard-map-section__map">
          {mapVisible && <MapContainer layers={layers} showOptions={false} />}
        </div>
      </div>
    </DashboardSection>
  )
}

export default DashboardMapSection
