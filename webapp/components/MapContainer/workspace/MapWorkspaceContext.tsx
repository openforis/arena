import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { useMap } from 'react-leaflet'
import { createLeafletContext, LeafletContext } from '@react-leaflet/core'

import { initialMapWorkspaceState, mapWorkspaceReducer } from './mapWorkspaceReducer'
import type { MapWorkspaceAction, MapWorkspaceState, MapWorkspaceVariant } from './mapWorkspaceTypes'

export type MapWorkspaceContextValue = MapWorkspaceState & {
  variant: MapWorkspaceVariant
  map: LeafletMap | null
  dispatch: (action: MapWorkspaceAction) => void
  setMap: (map: LeafletMap | null) => void
  layersControlTarget: HTMLElement | null
  setLayersControlTarget: (element: HTMLElement | null) => void
  portalContainer: HTMLElement | null
  setPortalContainer: (element: HTMLElement | null) => void
}

const MapWorkspaceContext = createContext<MapWorkspaceContextValue | null>(null)

/**
 * Holds the state shared by the map, its top bar, rail, status bar, tools and dialogs.
 * @param {object} props - Component props.
 * @param {MapWorkspaceVariant} props.variant - 'full' (Data › Map) or 'compact' (picker, geo panel, dashboard).
 * @param {ReactNode} props.children - Workspace content.
 * @returns {React.ReactElement} The provider.
 */
export const MapWorkspaceProvider = ({
  variant,
  children,
}: {
  variant: MapWorkspaceVariant
  children: ReactNode
}): ReactElement => {
  // the full workspace opens with the Layers tab; the compact one has no rail
  const [state, dispatch] = useReducer(
    mapWorkspaceReducer,
    variant === 'full' ? 'layers' : null,
    initialMapWorkspaceState
  )
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [layersControlTarget, setLayersControlTarget] = useState<HTMLElement | null>(null)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  const value = useMemo<MapWorkspaceContextValue>(
    () => ({
      ...state,
      variant,
      map,
      dispatch,
      setMap,
      layersControlTarget,
      setLayersControlTarget,
      portalContainer,
      setPortalContainer,
    }),
    [layersControlTarget, map, portalContainer, state, variant]
  )

  return <MapWorkspaceContext.Provider value={value}>{children}</MapWorkspaceContext.Provider>
}

/**
 * Returns the map workspace context.
 * @returns {MapWorkspaceContextValue} The context value.
 */
export const useMapWorkspace = (): MapWorkspaceContextValue => {
  const context = useContext(MapWorkspaceContext)
  if (!context) throw new Error('useMapWorkspace must be used inside MapWorkspaceProvider')
  return context
}

/**
 * Publishes the Leaflet map into the workspace context; render it inside the react-leaflet map container.
 * @returns {null} Renders nothing.
 */
export const MapInstanceBridge = (): null => {
  const map = useMap()
  const { setMap } = useMapWorkspace()
  useEffect(() => {
    setMap(map)
    return () => setMap(null)
  }, [map, setMap])
  return null
}

/**
 * Gives its children react-leaflet's context (useMap, useMapEvents) outside the map container.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Children that use react-leaflet hooks.
 * @returns {React.ReactElement|null} The children once the map exists, else null.
 */
export const WorkspaceLeafletProvider = ({ children }: { children: ReactNode }): ReactElement | null => {
  const { map } = useMapWorkspace()
  const leafletContext = useMemo(() => (map ? createLeafletContext(map) : null), [map])
  if (!leafletContext) return null
  return <LeafletContext value={leafletContext}>{children}</LeafletContext>
}
