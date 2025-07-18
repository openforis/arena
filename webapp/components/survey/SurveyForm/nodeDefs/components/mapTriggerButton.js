import React, { useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components/buttons'
import { MapContainer } from '@webapp/components/MapContainer'
import PanelRight from '@webapp/components/PanelRight'

import { useAuthCanUseMap } from '@webapp/store/user/hooks'
import { RecordState } from '@webapp/store/ui/record'

export const MapTriggerButton = (props) => {
  const {
    disabled = false,
    insideTable = false,
    showMap = false,
    onClick = null,
    onMapMarkerPointChange = null,
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
          showOptions={false}
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

MapTriggerButton.propTypes = {
  disabled: PropTypes.bool,
  insideTable: PropTypes.bool,
  showMap: PropTypes.bool,
  onClick: PropTypes.func,
  mapMarkerEditable: PropTypes.bool,
  mapMarkerPoint: PropTypes.object,
  mapMarkerTitle: PropTypes.string,
  onMapMarkerPointChange: PropTypes.func,
  onPanelClose: PropTypes.func,
  panelHeader: PropTypes.string,
  title: PropTypes.string,
}
