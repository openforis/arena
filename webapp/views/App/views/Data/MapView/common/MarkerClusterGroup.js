import React, { useCallback, useMemo } from 'react'
import LeafletCluster from 'react-leaflet-cluster'
import PropTypes from 'prop-types'
import L from 'leaflet'

import { Colors } from '@webapp/utils/colors'

const MarkerClusterGroup = (props) => {
  const { markersColor, children } = props

  const clusterIconsCache = useMemo(() => ({}), [markersColor])

  const iconCreateFunction = useCallback(
    (cluster) => {
      const clusterIconSize = 30

      const count = cluster.getChildCount()
      if (!clusterIconsCache[count]) {
        const textColor = Colors.getHighContrastTextColor(markersColor)

        const backgroundColor = `${markersColor}ee`
        const borderColor = `${markersColor}aa`

        clusterIconsCache[count] = L.divIcon({
          html: `<span class="cluster-marker-content" style="border-color: ${borderColor}; background-color: ${backgroundColor}; color: ${textColor}">${count}</span>`,
          className: 'cluster-marker',
          iconSize: L.point(clusterIconSize, clusterIconSize, true),
        })
      }
      return clusterIconsCache[count]
    },
    [clusterIconsCache, markersColor]
  )

  return (
    <LeafletCluster chunkedLoading zoomToBoundsOnClick iconCreateFunction={iconCreateFunction}>
      {children}
    </LeafletCluster>
  )
}

MarkerClusterGroup.propTypes = {
  markersColor: PropTypes.string.isRequired,
  children: PropTypes.node,
}

export default MarkerClusterGroup
