import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'

import { useI18n, useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import {
  applySortOrder,
  type MapLayerPoint,
  SORT_ORDER_NEXT,
  type SortOrder,
  useMapLayersPanel,
} from './MapLayersPanelContext'

// Colors from SideBar: $blue #3885ca, $grey #e7e9ee, $greyBorder #d1d1dd, $black #2f3138
const SIDEBAR_BLUE = '#3885ca'
const SIDEBAR_GREY = '#e7e9ee'
const SIDEBAR_BLACK = '#2f3138'

export const PANEL_WIDTH = 260

const ITEM_HEIGHT = 36
const OVERSCAN = 4

// Bypasses MUI's Collapse so flex layout propagates cleanly to AccordionDetails.
const NoTransition: FC<{ children?: React.ReactNode; in?: boolean }> = ({ children, in: inProp }) =>
  inProp ? <>{children}</> : null

type PointListItemProps = {
  point: MapLayerPoint
  isSelected: boolean
  onClick: (point: MapLayerPoint) => void
}

const PointListItem: FC<PointListItemProps> = ({ point, isSelected, onClick }) => {
  const { key, ancestorsKeys } = point.properties
  const label = ancestorsKeys.join(' - ')
  return (
    <ListItemButton
      key={key}
      dense
      onClick={() => onClick(point)}
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
}

type SortButtonProps = {
  sortOrder: SortOrder
  onClick: (e: React.MouseEvent) => void
}

const SortButton: FC<SortButtonProps> = ({ sortOrder, onClick }) => {
  const i18n = useI18n()
  const tooltipKeyBySortOrder: Record<SortOrder, string> = {
    asc: 'dataView:mapView.layersPanel.sortDesc',
    desc: 'dataView:mapView.layersPanel.sortNone',
    none: 'dataView:mapView.layersPanel.sortAsc',
  }
  const tooltipKey = tooltipKeyBySortOrder[sortOrder]
  const iconClass = sortOrder === 'desc' ? 'icon-sort-alpha-desc' : 'icon-sort-alpha-asc'
  return (
    <Tooltip title={i18n.t(tooltipKey)} placement="right">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          p: 0.25,
          ml: 0.5,
          borderRadius: 1,
          gap: 0.25,
          color: sortOrder === 'none' ? SIDEBAR_BLACK : SIDEBAR_BLUE,
          opacity: sortOrder === 'none' ? 0.4 : 1,
          '&:hover': { bgcolor: 'rgba(56, 133, 202, 0.12)', opacity: 1 },
        }}
      >
        <span className={`icon icon-12px ${iconClass}`} />
        <Typography component="span" sx={{ fontSize: '0.68rem', lineHeight: 1, color: 'inherit' }}>
          {i18n.t('dataView:mapView.layersPanel.sort')}
        </Typography>
      </IconButton>
    </Tooltip>
  )
}

const scrollSelectedPointIntoView = ({
  container,
  selectedPointKey,
  sortedPoints,
}: {
  container: HTMLElement | null
  selectedPointKey: string | null
  sortedPoints: MapLayerPoint[]
}) => {
  if (!selectedPointKey || !container) return
  const idx = sortedPoints.findIndex((p) => p.properties.key === selectedPointKey)
  if (idx === -1) return
  const itemTop = idx * ITEM_HEIGHT
  const itemBottom = itemTop + ITEM_HEIGHT
  if (itemTop < container.scrollTop || itemBottom > container.scrollTop + container.clientHeight) {
    container.scrollTop = Math.max(0, itemTop - container.clientHeight / 2 + ITEM_HEIGHT / 2)
  }
}

type LayerAccordionProps = {
  layerKey: string
  layerName: string
  points: MapLayerPoint[]
  onItemClick: (point: MapLayerPoint) => void
  selectedPointKey: string | null
  onSelect: (key: string | null) => void
  isExpanded: boolean
  onToggleExpand: (event: React.SyntheticEvent, expanded: boolean) => void
  isSingleLayer: boolean
}

const LayerAccordion: FC<LayerAccordionProps> = ({
  layerKey,
  layerName,
  points,
  onItemClick,
  selectedPointKey,
  onSelect,
  isExpanded,
  onToggleExpand,
  isSingleLayer,
}) => {
  const i18n = useI18n()
  const { layerSortOrders, setLayerSortOrder } = useMapLayersPanel()
  const sortOrder: SortOrder = layerSortOrders[layerKey] ?? 'none'
  const containerRef = useRef<HTMLElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerHeight(el.clientHeight)
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [isExpanded])

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => setScrollTop(e.currentTarget.scrollTop), [])

  const handleSortToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setLayerSortOrder(layerKey, SORT_ORDER_NEXT[sortOrder])
    },
    [layerKey, setLayerSortOrder, sortOrder]
  )

  const sortedPoints = useMemo(() => applySortOrder(points, sortOrder), [points, sortOrder])

  useEffect(() => {
    scrollSelectedPointIntoView({ container: containerRef.current, selectedPointKey, sortedPoints })
  }, [selectedPointKey, sortedPoints])

  const totalHeight = sortedPoints.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(sortedPoints.length - 1, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN)
  const visiblePoints = sortedPoints.slice(startIndex, endIndex + 1)

  const handleItemClick = useCallback(
    (point: MapLayerPoint) => {
      onSelect(point.properties.key)
      onItemClick(point)
    },
    [onItemClick, onSelect]
  )

  return (
    <Accordion
      component="li"
      expanded={isExpanded}
      onChange={isSingleLayer ? undefined : onToggleExpand}
      disableGutters
      elevation={0}
      slots={{ transition: NoTransition as any }}
      slotProps={{
        heading: { sx: { flexShrink: 0 } },
        region: { sx: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' } },
      }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: isExpanded ? 1 : 'none',
        minHeight: 0,
        overflow: 'hidden',
        listStyle: 'none',
        borderRadius: '0 !important',
        borderBottom: `1px solid #d1d1dd`,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={isSingleLayer ? null : <span className="icon icon-12px icon-arrow-down" />}
        sx={{
          bgcolor: SIDEBAR_GREY,
          color: SIDEBAR_BLACK,
          borderLeft: `3px solid ${SIDEBAR_BLUE}`,
          minHeight: '0 !important',
          px: 1.5,
          flexShrink: 0,
          '& .MuiAccordionSummary-content': { my: 0.75, flexDirection: 'column', gap: 0.25, mr: 0.5 },
          ...(isSingleLayer ? { cursor: 'default', '&:hover': {} } : { '&:hover': { bgcolor: '#dde3ed' } }),
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem', lineHeight: 1.3 }}>
          {layerName}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: SIDEBAR_BLACK, opacity: 0.7, fontSize: '0.72rem', lineHeight: 1 }}>
            {i18n.t('dataView:mapView.layersPanel.markers', { count: points.length })}
          </Typography>
          <SortButton sortOrder={sortOrder} onClick={handleSortToggle} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, p: 0 }}>
        <Box ref={containerRef} sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }} onScroll={onScroll}>
          <Box sx={{ height: totalHeight, position: 'relative' }}>
            <List dense disablePadding sx={{ position: 'absolute', top: startIndex * ITEM_HEIGHT, width: '100%' }}>
              {visiblePoints.map((point) => (
                <PointListItem
                  key={point.properties.key}
                  point={point}
                  isSelected={point.properties.key === selectedPointKey}
                  onClick={handleItemClick}
                />
              ))}
            </List>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

type PanelHeaderProps = {
  onToggle: () => void
}

const PanelHeader: FC<PanelHeaderProps> = ({ onToggle }) => (
  <Box
    component="li"
    sx={{
      display: 'flex',
      justifyContent: 'flex-end',
      px: 0.5,
      py: 0.25,
      borderBottom: `1px solid #d1d1dd`,
    }}
  >
    <ToggleButton isPanelVisible onClick={onToggle} />
  </Box>
)

type ToggleButtonProps = {
  isPanelVisible: boolean
  onClick: () => void
}

const ToggleButton: FC<ToggleButtonProps> = ({ isPanelVisible, onClick }) => {
  const i18n = useI18n()
  return (
    <Tooltip
      title={i18n.t(
        isPanelVisible ? 'dataView:mapView.layersPanel.hidePanel' : 'dataView:mapView.layersPanel.showPanel'
      )}
      placement="right"
    >
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          p: 0.5,
          borderRadius: 1,
          color: SIDEBAR_BLACK,
          '&:hover': { bgcolor: `rgba(56, 133, 202, 0.08)` },
        }}
      >
        <span className={`icon icon-12px ${isPanelVisible ? 'icon-arrow-left' : 'icon-arrow-right'}`} />
      </IconButton>
    </Tooltip>
  )
}

export const MapLayersPanel: FC = () => {
  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const {
    activeLayers,
    isPanelVisible,
    selectedPointKey,
    selectPoint: setSelectedPointKey,
    togglePanelVisible,
  } = useMapLayersPanel()

  const [expandedLayerKey, setExpandedLayerKey] = useState<string | null>(null)
  const prevLayerKeysRef = useRef<string[]>([])

  useEffect(() => {
    const currentKeys = activeLayers.map((l) => l.key)
    const prevKeys = prevLayerKeysRef.current
    prevLayerKeysRef.current = currentKeys

    if (activeLayers.length === 0) {
      setExpandedLayerKey(null)
    } else {
      const newKey = currentKeys.find((k) => !prevKeys.includes(k))
      if (newKey) {
        setExpandedLayerKey(newKey)
      } else if (expandedLayerKey === null || !activeLayers.some((l) => l.key === expandedLayerKey)) {
        setExpandedLayerKey(activeLayers[0].key)
      }
    }
  }, [activeLayers, expandedLayerKey])

  if (!experimentalFeatures) return null
  if (activeLayers.length === 0) return null

  if (!isPanelVisible) {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 8,
          zIndex: 1000,
          bgcolor: 'rgba(255,255,255,0.96)',
          border: `1px solid #d1d1dd`,
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          boxShadow: 2,
          p: 0.25,
        }}
      >
        <ToggleButton isPanelVisible={false} onClick={togglePanelVisible} />
      </Box>
    )
  }

  return (
    <List
      dense
      disablePadding
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'rgba(255,255,255,0.96)',
        borderRight: `1px solid #d1d1dd`,
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <PanelHeader onToggle={togglePanelVisible} />
      {activeLayers.map(({ key, layerName, points, flyToPoint }) => (
        <LayerAccordion
          key={key}
          layerKey={key}
          layerName={layerName}
          points={points}
          onItemClick={flyToPoint}
          selectedPointKey={selectedPointKey}
          onSelect={setSelectedPointKey}
          isExpanded={expandedLayerKey === key}
          onToggleExpand={(_, expanded) => {
            if (expanded) {
              setExpandedLayerKey(key)
            } else {
              const currentIndex = activeLayers.findIndex((l) => l.key === key)
              const nextLayer = activeLayers[currentIndex + 1]
              setExpandedLayerKey(nextLayer ? nextLayer.key : null)
            }
          }}
          isSingleLayer={activeLayers.length === 1}
        />
      ))}
    </List>
  )
}
