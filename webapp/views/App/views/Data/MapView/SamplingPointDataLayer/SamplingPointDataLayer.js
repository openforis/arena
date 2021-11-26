import React from 'react'
import { LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataClusters } from './SamplingPointDataClusters'

export const SamplingPointDataLayer = (props) => {
  const { items, checked, overlayName } = useSamplingPointDataLayer(props)

  return (
    <LayersControl.Overlay checked={checked} name={overlayName}>
      <SamplingPointDataClusters items={items} />
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
