import { createContext, useCallback, useContext, useState } from 'react'

const MapLayersPanelContext = createContext({
  activeLayers: [],
  selectedPointKey: null,
  registerLayer: () => {},
  unregisterLayer: () => {},
  selectPoint: () => {},
})

export const MapLayersPanelProvider = ({ children }) => {
  const [activeLayers, setActiveLayers] = useState([])
  const [selectedPointKey, setSelectedPointKey] = useState(null)

  const registerLayer = useCallback(({ key, layerName, points, flyToPoint }) => {
    setActiveLayers((prev) => {
      const filtered = prev.filter((l) => l.key !== key)
      return [...filtered, { key, layerName, points, flyToPoint }]
    })
  }, [])

  const unregisterLayer = useCallback(({ key }) => {
    setActiveLayers((prev) => prev.filter((l) => l.key !== key))
  }, [])

  const selectPoint = useCallback((key) => {
    setSelectedPointKey(key)
  }, [])

  return (
    <MapLayersPanelContext.Provider value={{ activeLayers, selectedPointKey, registerLayer, unregisterLayer, selectPoint }}>
      {children}
    </MapLayersPanelContext.Provider>
  )
}

export const useMapLayersPanel = () => useContext(MapLayersPanelContext)
