import { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'

import { Button } from '@webapp/components/buttons'
import { MapContainer } from '@webapp/components/MapContainer'
import PanelRight from '@webapp/components/PanelRight'
import { RecordState } from '@webapp/store/ui/record'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

type MapTriggerButtonProps = {
  disabled?: boolean
  insideTable?: boolean
  showMap?: boolean
  onClick?: (...args: any[]) => any
  mapMarkerEditable?: boolean
  mapMarkerPoint?: Record<string, any>
  mapMarkerTitle?: string
  onMapMarkerPointChange?: (...args: any[]) => any
  onPanelClose?: (...args: any[]) => any
  panelHeader?: string
  title?: string
}

export const MapTriggerButton = (props: MapTriggerButtonProps) => {
  const {
    disabled = false,
    insideTable = false,
    showMap = false,
    onClick = null,
    onMapMarkerPointChange: onMapMarkerPointChangeProp = null,
    mapMarkerEditable = false,
    mapMarkerPoint = null,
    mapMarkerTitle = null,
    onPanelClose = null,
    panelHeader = null,
    title = null,
  } = props
  const canUseMap = useAuthCanUseMap()
  const noHeader = useSelector(RecordState.hasNoHeader)
  const canShowMap = canUseMap && !noHeader
  const [showMapInternal, setShowMapInternal] = useState(false)

  const toggleShowMap = useCallback(() => {
    setShowMapInternal(!showMapInternal)
  }, [showMapInternal])

  const onClickDefault = toggleShowMap

  const onMapMarkerPointChange = useCallback(
    (markerPoint) => {
      onMapMarkerPointChangeProp?.(markerPoint)
      toggleShowMap()
    },
    [onMapMarkerPointChangeProp, toggleShowMap]
  )

  const button = canShowMap ? (
    <Button
      className="map-trigger-btn btn-transparent"
      disabled={disabled}
      iconClassName={`icon-map ${insideTable ? 'icon-14px' : 'icon-24px'}`}
      onClick={onClick ?? onClickDefault}
      title={title}
      variant="text"
    />
  ) : null

  const mapPanelRight =
    showMap || showMapInternal ? (
      <PanelRight className="map-panel" width="40vw" onClose={onPanelClose ?? toggleShowMap} header={panelHeader}>
        <MapContainer
          editable={mapMarkerEditable}
          markerPoint={mapMarkerPoint}
          markerTitle={mapMarkerTitle}
          onMarkerPointChange={onMapMarkerPointChange}
        />
      </PanelRight>
    ) : null

  return (
    <>
      {button}
      {mapPanelRight}
    </>
  )
}
