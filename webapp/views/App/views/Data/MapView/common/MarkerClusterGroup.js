import React, { useCallback, useMemo } from 'react'
import LeafletMarkerClusterGroup from 'react-leaflet-markercluster'
import PropTypes from 'prop-types'
import L from 'leaflet'

import { Colors } from '@webapp/utils/colors'

const MarkerClusterGroup = (props) => {
  const { markersColor, children, onClick } = props

  const clusterIconsCache = useMemo(() => ({}), [markersColor])

  const iconCreateFunction = useCallback(
    (cluster) => {
      const clusterIconSize = 30

      const count = cluster.getChildCount()
      if (!clusterIconsCache[count]) {
        const textColor = Colors.getHighContrastTextColor(markersColor)

        const backgroundColor = `${markersColor}ee`
        const borderColor = `${markersColor}aa`
        const style = `border-color: ${borderColor}; background-color: ${backgroundColor}; color: ${textColor}`

        clusterIconsCache[count] = L.divIcon({
          html: `<span class="cluster-marker-content" style="${style}">${count}</span>`,
          className: 'cluster-marker',
          iconSize: L.point(clusterIconSize, clusterIconSize, true),
        })
      }
      return clusterIconsCache[count]
    },
    [clusterIconsCache, markersColor]
  )

  return (
    <LeafletMarkerClusterGroup
      chunkedLoading
      zoomToBoundsOnClick
      iconCreateFunction={iconCreateFunction}
      onClick={onClick}
    >
      {children}
    </LeafletMarkerClusterGroup>
  )
}

MarkerClusterGroup.propTypes = {
  children: PropTypes.node,
  markersColor: PropTypes.string.isRequired,
  onClick: PropTypes.func,
}

MarkerClusterGroup.defaultProps = {
  onClick: undefined,
  children: undefined,
}

export default MarkerClusterGroup
