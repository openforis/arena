import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

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

type MapLayersPanelContextType = {
  activeLayers: ActiveLayer[]
  isPanelVisible: boolean
  selectedPointKey: string | null
  registerLayer: (layer: ActiveLayer) => void
  unregisterLayer: (params: { key: string }) => void
  selectPoint: (key: string | null) => void
  togglePanelVisible: () => void
}

const MapLayersPanelContext = createContext<MapLayersPanelContextType>({
  activeLayers: [],
  isPanelVisible: true,
  selectedPointKey: null,
  registerLayer: () => {},
  unregisterLayer: () => {},
  selectPoint: () => {},
  togglePanelVisible: () => {},
})

type MapLayersPanelProviderProps = {
  children: ReactNode
}

export const MapLayersPanelProvider = ({ children }: MapLayersPanelProviderProps) => {
  const [activeLayers, setActiveLayers] = useState<ActiveLayer[]>([])
  const [isPanelVisible, setIsPanelVisible] = useState(true)
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null)

  const registerLayer = useCallback(({ key, layerName, points, flyToPoint }: ActiveLayer) => {
    setActiveLayers((prev) => {
      const filtered = prev.filter((l) => l.key !== key)
      return [...filtered, { key, layerName, points, flyToPoint }]
    })
  }, [])

  const unregisterLayer = useCallback(({ key }: { key: string }) => {
    setActiveLayers((prev) => prev.filter((l) => l.key !== key))
  }, [])

  const selectPoint = useCallback((key: string | null) => {
    setSelectedPointKey(key)
  }, [])

  const togglePanelVisible = useCallback(() => {
    setIsPanelVisible((prev) => !prev)
  }, [])

  return (
    <MapLayersPanelContext.Provider
      value={{
        activeLayers,
        isPanelVisible,
        selectedPointKey,
        registerLayer,
        unregisterLayer,
        selectPoint,
        togglePanelVisible,
      }}
    >
      {children}
    </MapLayersPanelContext.Provider>
  )
}

export const useMapLayersPanel = () => useContext(MapLayersPanelContext)
