import React, { useContext, useState } from 'react'
import { defaultBaseLayer } from './baseLayers'
import PropTypes from 'prop-types'

const initialState = {
  baseLayer: null,
  options: {
    showMarkersLabels: false,
    showSamplingPolygon: true,
    showControlPoints: true,
    showPlotReferencePoint: true,
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
    onBaseLayerUpdate: (baseLayer) => setContextObject((contextPrev) => ({ ...contextPrev, baseLayer })),
  }

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

const useMapContext = () => useContext(MapContext)

const useMapContextOptions = () => {
  const { contextObject } = useMapContext()
  const { options } = contextObject
  return options
}

const useMapContextBaseLayer = () => {
  const { contextObject } = useMapContext()
  const { baseLayer } = contextObject
  return baseLayer || defaultBaseLayer
}

export {
  MapContext,
  MapContextConsumer,
  MapContextProvider,
  useMapContext,
  useMapContextBaseLayer,
  useMapContextOptions,
}

MapContextConsumer.propTypes = {
  children: PropTypes.any,
}
MapContextProvider.propTypes = {
  children: PropTypes.any,
}
