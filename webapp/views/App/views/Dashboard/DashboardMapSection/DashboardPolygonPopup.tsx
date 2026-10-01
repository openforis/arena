import React, { useCallback, useState } from 'react'
import { Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'

import { GeoJsonUtils } from '@core/geo/geoJsonUtils'
import * as NodeDef from '@core/survey/nodeDef'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUserName } from '@webapp/store/user/hooks'
import { WhispMenuButton } from '@webapp/views/App/views/Data/MapView/GeoAttributeDataLayer'

type DashboardPolygonFeature = {
  properties?: {
    ancestorsKeys?: string[]
    data?: unknown // geojson of the geo attribute value
    parentUuid?: string
    recordUuid?: string
    recordOwnerUuid?: string
  }
}

type DashboardPolygonPopupProps = {
  attributeDef: unknown
  pointFeature: DashboardPolygonFeature
}

/**
 * Popup of a dashboard map polygon: record keys, attribute, record editor link and Whisp actions.
 *
 * @param {DashboardPolygonPopupProps} props - The component props.
 * @returns {React.ReactElement} The popup.
 */
export const DashboardPolygonPopup = (props: DashboardPolygonPopupProps) => {
  const { attributeDef, pointFeature } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const [open, setOpen] = useState(false)

  const { ancestorsKeys = [], data: polygon, parentUuid, recordUuid, recordOwnerUuid } = pointFeature.properties ?? {}
  // owner name is fetched only while the popup is open
  const ownerName = useUserName({ userUuid: recordOwnerUuid, active: open })

  const recordLabel = ancestorsKeys.join(' - ')
  const attributeLabel = NodeDef.getLabel(attributeDef, lang)
  const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`

  const generateGeoJson = useCallback(
    () => GeoJsonUtils.setFeatureName({ feature: polygon, name: recordLabel }),
    [polygon, recordLabel]
  )

  return (
    <Popup eventHandlers={{ add: () => setOpen(true), remove: () => setOpen(false) }}>
      <div className="dashboard-polygon-popup">
        <h5 className="dashboard-polygon-popup__title">{recordLabel}</h5>
        <div className="dashboard-polygon-popup__attribute">{attributeLabel}</div>
        {ownerName && <div className="dashboard-polygon-popup__owner">{`${i18n.t('common.owner')}: ${ownerName}`}</div>}
        <div className="dashboard-polygon-popup__actions">
          <Link className="btn btn-s" to={recordEditUrl} title={i18n.t('mapView.editRecord') as string}>
            <span className="icon icon-12px icon-pencil2 icon-left" />
            {i18n.t('mapView.editRecord') as string}
          </Link>
          {polygon && <WhispMenuButton geoJsonGenerator={generateGeoJson} />}
        </div>
      </div>
    </Popup>
  )
}
