import React, { useCallback, useMemo, useState } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useOnIntersect } from '@webapp/components/hooks'
import { useRandomColors } from '@webapp/components/hooks/useRandomColors'
import { MapContainer } from '@webapp/components/MapContainer'
import { useSurvey } from '@webapp/store/survey'
import { GeoAttributeDataLayer } from '@webapp/views/App/views/Data/MapView/GeoAttributeDataLayer'

import { TestId } from '@webapp/utils/testId'
import { DashboardSection } from '../components/DashboardSection'
import { DashboardMapOwnerFilter } from './DashboardMapOwnerFilter'
import { DashboardPolygonPopup } from './DashboardPolygonPopup'
import { useDashboardMapOwners } from './useDashboardMapOwners'

type RenderPopupParams = {
  attributeDef: unknown
  pointFeature: { properties?: Record<string, unknown> }
}

/**
 * Map section body: layers, owner filter and lazy map mount once the section is in view.
 *
 * @returns {React.ReactElement} The dashboard map section.
 */
export const DashboardMapContent = () => {
  const survey = useSurvey()
  const [mapVisible, setMapVisible] = useState(false)
  const onSectionVisible = useCallback(() => setMapVisible(true), [])
  const [setSectionRef] = useOnIntersect(onSectionVisible)

  const { onLayerPointsLoaded, owners, pointsFilter, selectedOwnerUuid, setSelectedOwnerUuid } = useDashboardMapOwners({
    fetchUserNamesEnabled: mapVisible,
  })

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
