import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, List, ListItemButton, ListItemText, ListSubheader, Typography } from '@mui/material'

import { useMapLayersPanel } from './MapLayersPanelContext'

// Colors from SideBar: $blue #3885ca, $grey #e7e9ee, $greyBorder #d1d1dd, $black #2f3138
const SIDEBAR_BLUE = '#3885ca'
const SIDEBAR_GREY = '#e7e9ee'
const SIDEBAR_BLACK = '#2f3138'

const ITEM_HEIGHT = 36
const OVERSCAN = 4

const VirtualPointsList = ({ layerName, points, onItemClick, selectedPointKey, onSelect }) => {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerHeight(el.clientHeight)
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onScroll = useCallback((e) => setScrollTop(e.currentTarget.scrollTop), [])

  const totalHeight = points.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(points.length - 1, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN)
  const visiblePoints = points.slice(startIndex, endIndex + 1)

  const handleItemClick = useCallback(
    (point) => {
      onSelect(point.properties.key)
      onItemClick(point)
    },
    [onItemClick, onSelect]
  )

  return (
    <>
      <ListSubheader
        disableGutters
        sx={{
          bgcolor: SIDEBAR_GREY,
          color: SIDEBAR_BLACK,
          borderLeft: `3px solid ${SIDEBAR_BLUE}`,
          px: 1.5,
          py: 0.75,
          lineHeight: 1.3,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>
          {layerName}
        </Typography>
        <Typography variant="caption" sx={{ color: SIDEBAR_BLACK, opacity: 0.7, fontSize: '0.72rem', lineHeight: 1 }}>
          {points.length} markers
        </Typography>
      </ListSubheader>
      <Box
        component="li"
        ref={containerRef}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', listStyle: 'none', p: 0 }}
        onScroll={onScroll}
      >
        <Box sx={{ height: totalHeight, position: 'relative' }}>
          <List dense disablePadding sx={{ position: 'absolute', top: startIndex * ITEM_HEIGHT, width: '100%' }}>
            {visiblePoints.map((point) => {
              const { key, ancestorsKeys } = point.properties
              const label = ancestorsKeys.join(' - ')
              const isSelected = key === selectedPointKey
              return (
                <ListItemButton
                  key={key}
                  dense
                  onClick={() => handleItemClick(point)}
                  sx={{
                    height: ITEM_HEIGHT,
                    borderLeft: `3px solid ${isSelected ? SIDEBAR_BLUE : 'transparent'}`,
                    bgcolor: isSelected ? `rgba(56, 133, 202, 0.1)` : 'transparent',
                    pl: isSelected ? 1.25 : 1.5,
                    '&:hover': {
                      bgcolor: isSelected ? `rgba(56, 133, 202, 0.15)` : `rgba(56, 133, 202, 0.06)`,
                    },
                  }}
                >
                  <ListItemText
                    primary={label}
                    slotProps={{
                      primary: {
                        noWrap: true,
                        sx: {
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? SIDEBAR_BLUE : SIDEBAR_BLACK,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      </Box>
    </>
  )
}

export const MapLayersPanel = () => {
  const { activeLayers, selectedPointKey, selectPoint: setSelectedPointKey } = useMapLayersPanel()

  if (activeLayers.length === 0) return null

  return (
    <List
      dense
      disablePadding
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: 260,
        zIndex: 1000,
        bgcolor: 'rgba(255,255,255,0.96)',
        borderRight: `1px solid #d1d1dd`,
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {activeLayers.map(({ key, layerName, points, flyToPoint }) => (
        <VirtualPointsList
          key={key}
          layerName={layerName}
          points={points}
          onItemClick={flyToPoint}
          selectedPointKey={selectedPointKey}
          onSelect={setSelectedPointKey}
        />
      ))}
    </List>
  )
}
