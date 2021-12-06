import React from 'react'
import { Link } from 'react-router-dom'
import { Popup } from 'react-leaflet'

import { appModuleUri, dataModules } from '@webapp/app/appModules'
import { ButtonIconEdit } from '@webapp/components'

export const CoordinateAttributePopUp = (props) => {
  const { recordUuid, parentUuid, onEditClick } = props
  //   const recordEditUrl = `${appModuleUri(dataModules.record)}${recordUuid}?pageNodeUuid=${parentUuid}`
  return (
    <Popup>
      <ButtonIconEdit onClick={onEditClick} />
    </Popup>
  )
}
