import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

export type MapLayerPoint = {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    key: string
    ancestorsKeys: string[]
    parentUuid: string
    recordUuid: string
    recordOwnerUuid: string
  }
}

export type ActiveLayer = {
  key: string
  layerName: string
  points: MapLayerPoint[]
  flyToPoint: (point: MapLayerPoint) => void
}

export type SortOrder = 'none' | 'asc' | 'desc'

export const SORT_ORDER_NEXT: Record<SortOrder, SortOrder> = { none: 'asc', asc: 'desc', desc: 'none' }

const naturalCompare = (a: string, b: string): number => {
  const numA = Number(a)
  const numB = Number(b)
  if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB
  return a.localeCompare(b)
}

const compareAncestorsKeys = (keysA: string[], keysB: string[]): number => {
  const len = Math.min(keysA.length, keysB.length)
  for (let i = 0; i < len; i++) {
    const cmp = naturalCompare(keysA[i], keysB[i])
    if (cmp !== 0) return cmp
  }
  return keysA.length - keysB.length
}

export const applySortOrder = (points: MapLayerPoint[], sortOrder: SortOrder): MapLayerPoint[] => {
  if (sortOrder === 'none') return points
  return [...points].sort((a, b) => {
    const cmp = compareAncestorsKeys(a.properties.ancestorsKeys, b.properties.ancestorsKeys)
    return sortOrder === 'asc' ? cmp : -cmp
  })
}

type MapLayersPanelContextType = {
  activeLayers: ActiveLayer[]
  isPanelVisible: boolean
  layerSortOrders: Record<string, SortOrder>
  selectedPointKey: string | null
  registerLayer: (layer: ActiveLayer) => void
  unregisterLayer: (params: { key: string }) => void
  selectPoint: (key: string | null) => void
  setLayerSortOrder: (layerKey: string, sortOrder: SortOrder) => void
  togglePanelVisible: () => void
}

const MapLayersPanelContext = createContext<MapLayersPanelContextType>({
  activeLayers: [],
  isPanelVisible: true,
  layerSortOrders: {},
  selectedPointKey: null,
  registerLayer: () => {},
  unregisterLayer: () => {},
  selectPoint: () => {},
  setLayerSortOrder: () => {},
  togglePanelVisible: () => {},
})

type MapLayersPanelProviderProps = {
  children: ReactNode
}

export const MapLayersPanelProvider = ({ children }: MapLayersPanelProviderProps) => {
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([])
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null)
  const [layerSortOrders, setLayerSortOrders] = useState<Record<string, SortOrder>>({})

  const registerLayer = useCallback(({ key, layerName, points, flyToPoint }: ActiveLayer) => {
    setActiveLayers((prev) => {
      const filtered = prev.filter((l) => l.key !== key)
      return [...filtered, { key, layerName, points, flyToPoint }]
    })
  }, [])

  const unregisterLayer = useCallback(({ key }: { key: string }) => {
    setActiveLayers((prev) => prev.filter((l) => l.key !== key))
    setLayerSortOrders((prev) => {
      const { [key]: _removed, ...rest } = prev
      return rest
    })
  }, [])

  const selectPoint = useCallback((key: string | null) => {
    setSelectedPointKey(key)
  }, [])

  const setLayerSortOrder = useCallback((layerKey: string, sortOrder: SortOrder) => {
    setLayerSortOrders((prev) => ({ ...prev, [layerKey]: sortOrder }))
  }, [])

  const togglePanelVisible = useCallback(() => {
    setIsPanelVisible((prev) => !prev)
  }, [])

  const mapLayersContextValue = useMemo(
    () => ({
      activeLayers,
      isPanelVisible,
      layerSortOrders,
      selectedPointKey,
      registerLayer,
      unregisterLayer,
      selectPoint,
      setLayerSortOrder,
      togglePanelVisible,
    }),
    [
      activeLayers,
      isPanelVisible,
      layerSortOrders,
      selectedPointKey,
      registerLayer,
      unregisterLayer,
      selectPoint,
      setLayerSortOrder,
      togglePanelVisible,
    ]
  )

  return <MapLayersPanelContext.Provider value={mapLayersContextValue}>{children}</MapLayersPanelContext.Provider>
}

export const useMapLayersPanel = () => useContext(MapLayersPanelContext)
