import React, { useContext, useState } from 'react'

const initialState = {
  options: {
    showMarkersLabels: false,
  },
}

const MapContext = React.createContext({})

// Consumer
const MapContextConsumer = ({ children }) => <MapContext.Consumer>{(context) => children(context)}</MapContext.Consumer>

// Provider
const MapContextProvider = ({ children }) => {
  const [contextObject, setContextObject] = useState(initialState)

  // Context values passed to consumer
  const value = {
    contextObject,
    onOptionUpdate: ({ option, value }) =>
      setContextObject((contextPrev) => ({ ...contextPrev, options: { ...contextPrev.options, [option]: value } })),
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

const useMapContext = () => useContext(MapContext)

const useMapContextOptions = () => {
  const { contextObject } = useMapContext()
  const { options } = contextObject
  return options
}

export { MapContext, MapContextConsumer, MapContextProvider, useMapContext, useMapContextOptions }
